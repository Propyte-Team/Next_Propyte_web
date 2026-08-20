# Tipos de producto múltiples por desarrollo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un desarrollo que vende más de un producto (lotes y casas, villas y departamentos) aparezca bajo *todos* sus filtros en propyte.com, con precios que correspondan al producto filtrado.

**Architecture:** Una sola regla de resolución en `v_developments.property_types` (override manual `ext_property_types`, si no, los `tipo_unidad` crudos del inventario). La vista devuelve **grafías crudas**, nunca normalizadas — la normalización vive en un único módulo de catálogo en TypeScript del que derivan tanto el mapeo de facetas SEO como el de las tarjetas. El filtro del marketplace pasa de comparar un escalar a preguntar si el desarrollo ofrece ese producto.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Supabase (Postgres, schema `real_estate_hub`) · vitest · Zoho CRM v8

**Spec:** `docs/superpowers/specs/2026-08-20-tipos-producto-multiples-design.md` (en `Next_Propyte_web`)

## Global Constraints

- **Dos repos.** `Next_Propyte_web` (`c:\Users\ptoral\Projects\Next_Propyte_web`) y `Propyte_hub` (`c:\Users\ptoral\Projects\Propyte_hub`). Cada tarea declara en cuál trabaja. **Nunca** hacer commits que crucen repos.
- **Basar toda rama en `origin/main`**, no en el `main` local. Correr `git fetch origin` y ramificar desde `origin/main`.
- **La normalización de tipos existe en UN solo lugar:** `src/lib/catalog/product-types.ts` (web). Prohibido normalizar tipos en SQL, en el Hub o en cualquier componente.
- **Catálogo canónico de producto, exactamente estos siete valores y en este orden:** `departamento`, `penthouse`, `casa`, `villa`, `terreno`, `macrolote`, `comercial`.
- **`Condominio` NO pertenece al catálogo** (es régimen de propiedad). Resuelve a `null`.
- **Un `tipo_unidad` vacío o NULL no aporta un tipo.** Nunca cae a `departamento` en agregación.
- Tests del sitio web: `npm run test:unit` (vitest). Tests del Hub: `npm test`.
- El shell es Git Bash POSIX en Windows. **No hay `python`** — usar `node`. `jq` sí existe.
- Mensajes de commit terminan con `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- **No pushear a producción sin correr el build.** El deploy de `propyte.com` compila en el servidor de Hostinger; un build roto tumba el sitio.

---

## Estructura de archivos

### `Next_Propyte_web`

| Archivo | Responsabilidad |
|---|---|
| `src/lib/catalog/product-types.ts` | **NUEVO.** Única fuente del catálogo: los 7 canónicos, las grafías crudas de cada uno, y `resolveProductType()`. Del que derivan facetas SEO y tarjetas. |
| `src/lib/catalog/product-types.test.ts` | **NUEVO.** Pruebas del catálogo. |
| `src/hooks/useFilters.ts` | Predicado de filtrado. Gana `matchesProductType()` exportada y la proyección por tipo. |
| `src/hooks/useFilters.test.ts` | Gana las pruebas de ambas. |
| `src/lib/supabase/taxonomy-values.ts` | Deja de declarar `TYPE_DB_VALUES` a mano; lo re-exporta del catálogo. Conserva `STAGE_DB_VALUES`. |
| `src/lib/supabase/development-aggregates.ts` | Agregados de `v_units`. Gana precio y área mínimos **por tipo**. |
| `src/lib/mappers/unit-to-property.ts` | `normalizeUnitType` pasa a delegar en el catálogo y a poder devolver `null`. |
| `src/lib/mappers/development-to-property.ts` | `VALID_SPEC_TYPES` y `resolveSpecType` se alinean al catálogo. |
| `src/types/property.ts` | El union `specs.type` crece a 7. Nuevo campo `unitTypeStats`. |
| `src/components/marketplace/FilterBar.tsx` | `typeOptions` derivado del catálogo; el chip «Tipo desarrollo» se rotula «Formato». |
| `src/i18n/messages/{es,en}.json` | Claves `comercial` en `types`; `villa` y `comercial` en `unitTypesPlural`. |
| `src/lib/investment/market-rent.ts` | `RENTABLE_PROPERTY_TYPES` gana `villa`. |

### `Propyte_hub`

| Archivo | Responsabilidad |
|---|---|
| `scripts/sql/audit-property-types-drift.sql` | **NUEVO.** El medidor: compara lo que la vista devuelve hoy contra lo que devolverá. Se corre ANTES de migrar. |
| `scripts/sql/property-types-derivados.sql` | **NUEVO.** La migración de `v_developments`. |
| `src/components/common/fields/MultiSelectInput.tsx` | **NUEVO.** Control de selección múltiple, calcado de `IntArrayInput`. |
| `src/components/common/FieldEditor.tsx` | Nuevo `FieldType` `"multiselect"`. |
| `src/lib/fields-config.ts` | Campo «Tipos de producto»; renombrar «Tipo de desarrollo» → «Formato del desarrollo» y corregir su `info`. |
| `src/lib/zoho/outbound-whitelist.ts` | Transformer `text_array` y salida `ext_property_types` → `Tipos_propiedad`. |

---

# FASE 1 — El filtro respeta los varios tipos

Solo `Next_Propyte_web`. Sin base de datos, sin Hub. Entregable independiente.

### Task 1: El filtro pregunta «¿ofrece este producto?» en vez de «¿es de este tipo?»

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/hooks/useFilters.ts:201` (el predicado) y la zona de helpers exportados (junto a `passesRoiMin`, `src/hooks/useFilters.ts:58-70`)
- Test: `src/hooks/useFilters.test.ts`

**Interfaces:**
- Consumes: `Property` de `@/types/property` — campos usados: `specs.type` (string), `unitTypes?: Array<PropertySpecs['type']>`, `kind: 'development' | 'unit'`.
- Produces: `export function matchesProductType(property: Property, filterType: string): boolean` — usada por el predicado de `useFilters` y, en la Task 12, por la proyección de precio.

- [ ] **Step 1: Escribir la prueba que falla**

Añadir a `src/hooks/useFilters.test.ts` (conservar el `describe` de `passesRoiMin` que ya está):

```ts
import { describe, it, expect } from 'vitest';
import { passesRoiMin, matchesProductType } from './useFilters';
import type { Property } from '@/types/property';

/** Property mínima para probar el predicado de tipo. Solo los campos que
 *  `matchesProductType` lee; el resto no interviene. */
function devWith(specType: string, unitTypes?: string[]): Property {
  return {
    kind: 'development',
    specs: { type: specType },
    unitTypes,
  } as unknown as Property;
}

describe('matchesProductType', () => {
  it('sin filtro activo, todo pasa', () => {
    expect(matchesProductType(devWith('departamento'), '')).toBe(true);
  });

  it('un desarrollo con lotes Y casas aparece bajo AMBOS filtros', () => {
    // El caso que motivó el cambio: la tarjeta ya mostraba «LOTES · CASAS»
    // pero el desarrollo desaparecía al filtrar por Casa, porque el predicado
    // comparaba contra specs.type — un escalar, el primero del array.
    const mixto = devWith('terreno', ['terreno', 'casa']);
    expect(matchesProductType(mixto, 'terreno')).toBe(true);
    expect(matchesProductType(mixto, 'casa')).toBe(true);
  });

  it('un desarrollo de un solo producto no aparece bajo otro', () => {
    const soloDepas = devWith('departamento', ['departamento']);
    expect(matchesProductType(soloDepas, 'casa')).toBe(false);
  });

  it('sin unidades cargadas cae a specs.type', () => {
    // 4 de los 22 desarrollos visibles no tienen ninguna fila de unidad.
    // Sin el respaldo desaparecerían de todos los filtros.
    expect(matchesProductType(devWith('terreno'), 'terreno')).toBe(true);
    expect(matchesProductType(devWith('terreno'), 'casa')).toBe(false);
  });

  it('un array vacío no se toma como «no tiene tipos»: cae a specs.type', () => {
    expect(matchesProductType(devWith('casa', []), 'casa')).toBe(true);
  });

  it('para unidades sueltas sigue mandando specs.type', () => {
    const unidad = { kind: 'unit', specs: { type: 'penthouse' } } as unknown as Property;
    expect(matchesProductType(unidad, 'penthouse')).toBe(true);
    expect(matchesProductType(unidad, 'casa')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/hooks/useFilters.test.ts
```

Esperado: FAIL — `matchesProductType is not a function` / error de importación.

- [ ] **Step 3: Implementar**

En `src/hooks/useFilters.ts`, justo debajo de `passesRoiMin` (después de la línea 70 aprox.), añadir:

```ts
/**
 * ¿Este inmueble ofrece el producto que el comprador pidió?
 *
 * Antes el predicado comparaba `p.specs.type !== filters.type` — un escalar
 * que sale del PRIMER elemento de `property_types`. Un desarrollo con lotes y
 * casas mostraba los dos chips en la tarjeta y aun así desaparecía al filtrar
 * por Casa. Ver spec 2026-08-20-tipos-producto-multiples-design.md.
 *
 * `unitTypes` es el inventario real (tipos distintos de las unidades cargadas).
 * Cuando viene vacío —desarrollo sin unidades— se respalda en `specs.type`,
 * que ya deriva de property_types → development_type.
 */
export function matchesProductType(property: Property, filterType: string): boolean {
  if (!filterType) return true;
  const types = property.kind === 'development' ? property.unitTypes : undefined;
  if (types && types.length > 0) return types.includes(filterType as Property['specs']['type']);
  return property.specs.type === filterType;
}
```

Y reemplazar la línea 201:

```ts
      if (filters.type && p.specs.type !== filters.type) return fail(`type:'${p.specs.type}'≠'${filters.type}'`);
```

por:

```ts
      if (!matchesProductType(p, filters.type))
        return fail(`type:[${p.unitTypes?.join(',') ?? p.specs.type}]∌'${filters.type}'`);
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/hooks/useFilters.test.ts
```

Esperado: PASS, 9 pruebas (3 de `passesRoiMin` + 6 nuevas).

- [ ] **Step 5: Verificar que no se rompió nada más**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run test:unit && npx tsc --noEmit
```

Esperado: PASS en ambos.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/hooks/useFilters.ts src/hooks/useFilters.test.ts
git commit -m "fix(filtros): un desarrollo mixto desaparecia de la mitad de sus filtros

El predicado comparaba specs.type — el PRIMER elemento de property_types —
asi que un desarrollo con lotes y casas mostraba los dos chips en la tarjeta
y no salia al filtrar por Casa.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FASE 2 — Una sola definición de tipo para las dos rutas

`Propyte_hub` (migración + formulario) y verificación cruzada.

### Task 2: El medidor, y la prueba de que el medidor sirve

Antes de migrar hay que tener un chequeo que **dé negativo contra el estado actual**. Un chequeo que solo se corre después no distingue «arreglado» de «roto en verde».

**Repo:** `Propyte_hub`

**Files:**
- Create: `scripts/sql/audit-property-types-drift.sql`

**Interfaces:**
- Consumes: nada.
- Produces: una consulta SQL que devuelve una fila por desarrollo visible con `property_types_hoy`, `property_types_despues` y `veredicto`. La Task 3 la vuelve a correr después de migrar.

- [ ] **Step 1: Escribir el medidor**

Crear `scripts/sql/audit-property-types-drift.sql`:

```sql
-- Deriva de property_types: lo que la vista devuelve HOY contra lo que
-- devolvera tras aplicar property-types-derivados.sql.
--
-- SE CORRE ANTES DE MIGRAR. Si no reporta ninguna fila 'GANA TIPOS', el
-- medidor no sirve: no esta midiendo el estado viejo. Ver
-- feedback_validar_el_medidor_antes_de_confiar.
--
-- Uso: psql -f scripts/sql/audit-property-types-drift.sql
--      o via el MCP de Supabase (execute_sql).

with visibles as (
  select d.id, d.ext_property_types
  from real_estate_hub."Propyte_desarrollos" d
  where d.approved_at is not null
    and d.deleted_at is null
),
derivado as (
  select v.id,
         v.ext_property_types as hoy,
         coalesce(
           nullif(v.ext_property_types, '{}'),
           (select array_agg(distinct u.tipo_unidad order by u.tipo_unidad)
              from real_estate_hub."Propyte_unidades" u
             where u.id_desarrollo = v.id
               and u.deleted_at is null
               and u.approved_at is not null
               and u.tipo_unidad is not null
               and btrim(u.tipo_unidad) <> '')
         ) as despues
  from visibles v
)
select
  id,
  coalesce(hoy, '{}') as property_types_hoy,
  coalesce(despues, '{}') as property_types_despues,
  case
    when coalesce(hoy, '{}') = coalesce(despues, '{}') then 'SIN CAMBIO'
    when coalesce(hoy, '{}') <@ coalesce(despues, '{}') then 'GANA TIPOS'
    else 'PIERDE TIPOS -- REVISAR'
  end as veredicto
from derivado
order by veredicto desc, id;
```

- [ ] **Step 2: Correr el medidor contra el estado ACTUAL y exigir que dé negativo**

Correr el contenido del archivo contra el proyecto Supabase `oaijxdpevakashxshhvm`.

Esperado, y esto es la puerta de la fase:
- **Al menos una fila con `GANA TIPOS`.** Si no aparece ninguna, el medidor no está midiendo el estado viejo — parar y arreglarlo antes de seguir.
- **Cero filas con `PIERDE TIPOS -- REVISAR`.** Si aparece alguna, parar: la regla de resolución estaría borrando tipos declarados y hay que entender el caso antes de migrar.

Anotar el conteo de `GANA TIPOS` — la Task 3 lo usa.

- [ ] **Step 3: Registrar la discrepancia observable entre las dos rutas**

Correr también, contra el mismo proyecto:

```sql
with pub as (
  select * from real_estate_hub.v_developments
  where approved_at is not null and deleted_at is null
)
select
  (select count(*) from pub) as visibles,
  (select count(*) from pub
    where property_types && array['Terrenos','Terreno','Lotes','Lote']) as faceta_seo_terreno;
```

Esperado hoy: `faceta_seo_terreno` **menor** que los 5 resultados que muestra `/desarrollos?type=terreno`. Anotar ambos números: son el antes de la Task 3.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add scripts/sql/audit-property-types-drift.sql
git commit -m "chore(sql): medidor de deriva de property_types

Compara lo que v_developments devuelve hoy contra lo que devolvera con la
regla derivada. Se corre ANTES de migrar y debe reportar filas 'GANA TIPOS':
un medidor que solo se corre despues no distingue arreglado de roto en verde.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: La vista deriva los tipos del inventario

La vista devuelve **grafías crudas**, igual que hoy. No normaliza. La normalización vive en el catálogo TypeScript (Task 7) — si se hiciera en los dos lados, divergirían.

**Repo:** `Propyte_hub`

**Files:**
- Create: `scripts/sql/property-types-derivados.sql`

**Interfaces:**
- Consumes: el medidor de la Task 2.
- Produces: `real_estate_hub.v_developments.property_types` con la regla de resolución. Mismo nombre y mismo tipo (`text[]`) que hoy; todos los consumidores existentes siguen compilando.

- [ ] **Step 1: Capturar la definición actual de la vista**

```bash
# Guardar el respaldo ANTES de tocar nada. Si la migracion sale mal, este es
# el texto exacto al que se vuelve.
cd /c/Users/ptoral/Projects/Propyte_hub && mkdir -p docs/zoho-backups
```

Correr contra Supabase y guardar la salida completa en `docs/zoho-backups/v_developments-antes-2026-08-20.sql`:

```sql
select pg_get_viewdef('real_estate_hub.v_developments'::regclass, true);
```

- [ ] **Step 2: Escribir la migración**

Crear `scripts/sql/property-types-derivados.sql`. **Tomar el texto del respaldo del paso anterior** y sustituir únicamente la línea

```
    d.ext_property_types AS property_types,
```

por el bloque de abajo, dejando TODO lo demás byte por byte igual. El archivo queda como un `CREATE OR REPLACE VIEW real_estate_hub.v_developments AS` seguido del cuerpo completo.

```sql
    -- property_types: override manual, y si no, el inventario real.
    --
    -- 1. ext_property_types            si trae algo   -> override / Zoho
    -- 2. tipo_unidad distintos          en otro caso   -> derivado
    -- 3. NULL                           en otro caso   -> sin dato
    --
    -- Devuelve GRAFIAS CRUDAS ('Lotes', 'Local comercial'), no canonicas: la
    -- normalizacion vive en Next_Propyte_web/src/lib/catalog/product-types.ts
    -- y tiene que existir en UN solo lugar.
    --
    -- Antes esto era `d.ext_property_types` a secas y 12 de los 22 desarrollos
    -- visibles lo tenian en NULL: invisibles en toda faceta de tipo.
    COALESCE(
        NULLIF(d.ext_property_types, '{}'::text[]),
        ( SELECT array_agg(DISTINCT u.tipo_unidad ORDER BY u.tipo_unidad)
            FROM real_estate_hub."Propyte_unidades" u
           WHERE u.id_desarrollo = d.id
             AND u.deleted_at IS NULL
             AND u.approved_at IS NOT NULL
             AND u.tipo_unidad IS NOT NULL
             AND btrim(u.tipo_unidad) <> '' )
    ) AS property_types,
```

- [ ] **Step 3: Verificar que la vista conserva `security_invoker`**

Antes de aplicar, comprobar cómo está declarada hoy:

```sql
select c.relname, c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'real_estate_hub' and c.relname = 'v_developments';
```

Si `reloptions` incluye `security_invoker=true`, el `CREATE OR REPLACE VIEW` del paso 2 **debe** llevar `WITH (security_invoker = true)` después del nombre de la vista. Un `CREATE OR REPLACE` sin la opción la pierde en silencio y la vista pasaría a bypassear la RLS. Ajustar el archivo si aplica.

- [ ] **Step 4: Aplicar la migración**

Aplicar el contenido de `scripts/sql/property-types-derivados.sql` contra el proyecto `oaijxdpevakashxshhvm`.

- [ ] **Step 5: Volver a correr el medidor y exigir que ahora dé positivo**

Correr de nuevo `scripts/sql/audit-property-types-drift.sql`.

Esperado: **cero filas con `GANA TIPOS`** — porque el «después» ya es el «hoy». Cero filas con `PIERDE TIPOS`.

Y verificar el conteo real de la vista:

```sql
with pub as (
  select * from real_estate_hub.v_developments
  where approved_at is not null and deleted_at is null
)
select
  (select count(*) from pub) as visibles,
  (select count(*) from pub where property_types is null
     or cardinality(property_types) = 0) as sin_tipos,
  (select count(*) from pub
    where property_types && array['Terrenos','Terreno','Lotes','Lote']) as faceta_seo_terreno;
```

Esperado: `sin_tipos` baja de 12 a los desarrollos que de verdad no tienen ni override ni unidades (los 4 con cero filas de unidad). `faceta_seo_terreno` sube respecto al número anotado en la Task 2 paso 3.

- [ ] **Step 6: Verificar que ningún consumidor se rompió**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run build
```

Esperado: build limpio. `property_types` mantiene nombre y tipo, así que no debería haber cambios de tipos; el build confirma que los consumidores (web, PDF, comparador) siguen resolviendo.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add scripts/sql/property-types-derivados.sql docs/zoho-backups/v_developments-antes-2026-08-20.sql
git commit -m "feat(sql): property_types deriva del inventario cuando no hay override

12 de 22 desarrollos visibles tenian ext_property_types en NULL y quedaban
invisibles en toda faceta de tipo. La vista ahora cae a los tipo_unidad
distintos de las unidades aprobadas. Devuelve grafias crudas: normalizar aqui
Y en TypeScript garantizaria que divergieran.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Control de selección múltiple en el Hub

**Repo:** `Propyte_hub`

**Files:**
- Create: `src/components/common/fields/MultiSelectInput.tsx`
- Modify: `src/components/common/FieldEditor.tsx:40-60` (el union `FieldType`) y `src/components/common/FieldEditor.tsx:406-419` (zona de despacho por tipo)

**Interfaces:**
- Consumes: `InfoTooltip` de `../InfoTooltip`; la firma `{ label, info, fieldKey, values, setValue, readOnly, help, options, derivedHint }`.
- Produces: `export function MultiSelectInput(...)` y el `FieldType` `"multiselect"`, que la Task 5 usa desde `fields-config.ts` con `options` y `derivedFrom`.

- [ ] **Step 1: Crear el control**

Crear `src/components/common/fields/MultiSelectInput.tsx`:

```tsx
"use client";
import { InfoTooltip } from "../InfoTooltip";

/**
 * Seleccion multiple sobre un catalogo fijo, persistida como text[].
 * Calcado de IntArrayInput, con dos diferencias: el valor sale de un catalogo
 * cerrado (no texto libre) y muestra en gris lo que el sistema derivo cuando
 * el campo esta vacio — para que se vea CUAL de las dos vias esta mandando.
 */
export function MultiSelectInput({
  label, info, fieldKey, values, setValue, readOnly, help, options, derivedHint,
}: {
  label: string; info?: string; fieldKey: string;
  values: Record<string, unknown>; setValue: (k: string, v: unknown) => void;
  readOnly?: boolean; help?: string;
  options: { value: string; label: string }[];
  /** Lo que el sistema deriva cuando el campo esta vacio. Solo informativo. */
  derivedHint?: string[];
}) {
  const arr = Array.isArray(values[fieldKey]) ? (values[fieldKey] as string[]) : [];
  const vacio = arr.length === 0;

  function toggle(v: string) {
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    // Orden del catalogo, no de clic: el array viaja a Zoho y a la web.
    const ordenado = options.map((o) => o.value).filter((o) => next.includes(o));
    setValue(fieldKey, ordenado.length > 0 ? ordenado : null);
  }

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5">
        {label}{info && <InfoTooltip text={info} />}
      </span>
      <div className="flex flex-wrap gap-1.5 items-center">
        {options.map((o) => {
          const on = arr.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(o.value)}
              className={`px-2 py-1 rounded-lg text-sm border transition-colors ${
                on
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {vacio && derivedHint && derivedHint.length > 0 && (
        <div className="text-[11px] text-slate-500">
          Derivado de las unidades: {derivedHint.join(" · ")}
        </div>
      )}
      {help && <div className="text-[11px] text-slate-500">{help}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Registrar el tipo en `FieldEditor`**

En `src/components/common/FieldEditor.tsx`, añadir `"multiselect"` al union `FieldType` (línea 57, junto a `"int-array"`):

```ts
  | "int-array"
  | "multiselect"
```

Añadir a la interfaz `FieldDef` (después de `sourceKey`, línea 76):

```ts
  // For "multiselect": columna hermana de la que se deriva el hint en gris
  derivedFromKey?: string;
```

Importar el control junto a los demás de `./fields/`:

```ts
import { MultiSelectInput } from "./fields/MultiSelectInput";
```

Y añadir el despacho justo después del bloque de `int-array` (línea 419):

```tsx
  if (f.type === "multiselect") {
    const hint = f.derivedFromKey && Array.isArray(values[f.derivedFromKey])
      ? (values[f.derivedFromKey] as unknown[]).map(String)
      : undefined;
    return (
      <MultiSelectInput
        key={f.key}
        label={f.label}
        info={f.info}
        fieldKey={f.key}
        values={values}
        setValue={setValue}
        readOnly={f.readOnly}
        help={f.help}
        options={f.options ?? []}
        derivedHint={hint}
      />
    );
  }
```

- [ ] **Step 3: Verificar que compila**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add src/components/common/fields/MultiSelectInput.tsx src/components/common/FieldEditor.tsx
git commit -m "feat(hub): control de seleccion multiple para campos text[]

Muestra en gris lo que el sistema derivo cuando el campo esta vacio, para
que se vea cual de las dos vias esta mandando.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: El campo «Tipos de producto» y el renombre de «Formato»

**Repo:** `Propyte_hub`

**Files:**
- Modify: `src/lib/fields-config.ts:23-34` (`TIPO_DESARROLLO_OPTIONS`) y `src/lib/fields-config.ts:173-180` (el campo `tipo_desarrollo`)

**Interfaces:**
- Consumes: el `FieldType` `"multiselect"` y `derivedFromKey` de la Task 4.
- Produces: `export const TIPOS_PRODUCTO_OPTIONS` — las siete grafías canónicas que el Hub escribe en `ext_property_types`.

- [ ] **Step 1: Declarar el catálogo de producto**

En `src/lib/fields-config.ts`, justo después de `TIPO_DESARROLLO_OPTIONS` (línea 34):

```ts
/**
 * Tipos de PRODUCTO que un desarrollo vende. Multivaluado: un desarrollo puede
 * tener lotes y casas, o villas y departamentos.
 *
 * Las grafias tienen que coincidir con las que reconoce
 * Next_Propyte_web/src/lib/catalog/product-types.ts, o el filtro del sitio no
 * las encuentra. No es lo mismo que TIPO_DESARROLLO_OPTIONS, que describe el
 * FORMATO del desarrollo (vertical, horizontal, mixto).
 */
export const TIPOS_PRODUCTO_OPTIONS = [
  { value: "Departamento", label: "Departamento" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Casa", label: "Casa" },
  { value: "Villa", label: "Villa" },
  { value: "Terreno", label: "Terreno / Lote" },
  { value: "Macrolote", label: "Macrolote" },
  { value: "Local comercial", label: "Comercial" },
];
```

- [ ] **Step 2: Renombrar el campo existente y añadir el nuevo**

Reemplazar el bloque de `tipo_desarrollo` (líneas 173-180) por estos dos campos:

```ts
  {
    section: "Identidad",
    key: "tipo_desarrollo",
    label: "Formato del desarrollo",
    type: "select",
    options: TIPO_DESARROLLO_OPTIONS,
    info: "Como esta construido el desarrollo. Vertical = torres; Horizontal = casas/townhouse; Mixto = combina vivienda+comercio. NO controla los filtros del sitio: eso lo hace «Tipos de producto».",
  },
  {
    section: "Identidad",
    key: "ext_property_types",
    label: "Tipos de producto",
    type: "multiselect",
    options: TIPOS_PRODUCTO_OPTIONS,
    derivedFromKey: "ext_property_types_derivado",
    info: "Que se vende aqui. Define los filtros del sitio y los chips de la tarjeta. Si lo dejas vacio se deriva solo de los tipos de unidad cargados; solo fijalo a mano cuando aun no hay unidades.",
    help: "Vacio = derivado del inventario. Con valores = fijado a mano, y manda sobre el inventario.",
  },
```

- [ ] **Step 3: Verificar que compila y que el campo aparece**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub && npx tsc --noEmit && npm run lint
```

Esperado: sin errores.

- [ ] **Step 4: Probar la escritura de verdad, no solo que el formulario pinte**

`/api/record` escribe vía la RPC `hub_write_record`, no con un UPDATE plano. Un UPDATE plano contra una columna bloqueada devuelve `error: null` y no cambia nada — parece que funcionó. Hay que confirmar que el valor llegó.

Levantar el Hub, abrir la ficha de un desarrollo de prueba, marcar dos tipos, guardar, y verificar en la base:

```sql
select id, ext_property_types
from real_estate_hub."Propyte_desarrollos"
where id = '<el id del desarrollo que tocaste>';
```

Esperado: el array con los dos valores marcados, en el orden del catálogo. Si vuelve NULL o sin cambios, el problema está en la RPC, no en el formulario — revisar `src/app/api/record/route.ts:221` antes de seguir.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add src/lib/fields-config.ts
git commit -m "feat(hub): campo «Tipos de producto» y renombre de «Tipo de desarrollo»

El info de «Tipo de desarrollo» afirmaba que define como se filtra el sitio.
Era falso: el sitio filtra por property_types, un campo que no existia en el
formulario. Ahora existe, y el viejo pasa a llamarse «Formato del desarrollo».

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `ext_property_types` sale hacia Zoho

Hoy el campo solo entra desde Zoho (`Tipos_propiedad` → `ext_property_types`). Si el Hub lo edita y no lo empuja, el siguiente pull de Zoho lo pisa.

**Repo:** `Propyte_hub`

**Files:**
- Modify: `src/lib/zoho/outbound-whitelist.ts:4-18` (union `TransformerKey`), `src/lib/zoho/outbound-whitelist.ts:99+` (objeto `TRANSFORMERS`), `src/lib/zoho/outbound-whitelist.ts:219-224` (`OUTBOUND_DEVELOPMENT_FIELDS`)

**Interfaces:**
- Consumes: `mapHubToZoho` de `src/lib/zoho/mappers/hub-to-zoho.ts:34-53`, que aplica `TRANSFORMERS[key].out(rawValue)` y omite el campo solo si el resultado es `undefined`.
- Produces: transformer `"text_array"`.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `src/lib/zoho/outbound-whitelist.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TRANSFORMERS, OUTBOUND_DEVELOPMENT_FIELDS } from "./outbound-whitelist";

describe("transformer text_array", () => {
  it("manda el array tal cual", () => {
    expect(TRANSFORMERS.text_array.out(["Casa", "Terreno"])).toEqual(["Casa", "Terreno"]);
  });

  it("un array vacio se manda como null para BORRAR el multiselect en Zoho", () => {
    // [] y null significan lo mismo aqui: el desarrollo no fija tipos a mano.
    // Mandar [] dejaria el campo de Zoho en un estado que el pull no distingue.
    expect(TRANSFORMERS.text_array.out([])).toBeNull();
  });

  it("null se mantiene null", () => {
    expect(TRANSFORMERS.text_array.out(null)).toBeNull();
  });

  it("un escalar suelto se envuelve", () => {
    expect(TRANSFORMERS.text_array.out("Casa")).toEqual(["Casa"]);
  });
});

describe("whitelist de salida de desarrollos", () => {
  it("ext_property_types viaja a Tipos_propiedad", () => {
    const spec = OUTBOUND_DEVELOPMENT_FIELDS.find((f) => f[0] === "ext_property_types");
    expect(spec, "ext_property_types no esta en la whitelist de salida").toBeDefined();
    expect(spec![1]).toBe("Tipos_propiedad");
    expect(spec![2]).toBe("text_array");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub && npx vitest run src/lib/zoho/outbound-whitelist.test.ts
```

Esperado: FAIL — `TRANSFORMERS.text_array` es `undefined`.

- [ ] **Step 3: Implementar**

En `src/lib/zoho/outbound-whitelist.ts`, añadir al union `TransformerKey` (después de `"boolean"`, línea 10):

```ts
  | "text_array"
```

Añadir al objeto `TRANSFORMERS`, junto a los demás:

```ts
  // Multiselect de Zoho: viaja como array de strings. Un array vacio sale como
  // null porque significa lo mismo — el desarrollo no fija tipos a mano — y
  // null es lo que el pull vuelve a leer sin ambiguedad.
  text_array: {
    out: (v: unknown) => {
      if (v == null) return null;
      const arr = Array.isArray(v) ? v.map(String) : [String(v)];
      return arr.length > 0 ? arr : null;
    },
    in: (v: unknown) => {
      if (v == null) return null;
      const arr = Array.isArray(v) ? v.map(String) : [String(v)];
      return arr.length > 0 ? arr : null;
    },
  },
```

Añadir a `OUTBOUND_DEVELOPMENT_FIELDS`, justo debajo de `["tipo_desarrollo", "Tipo_desarrollo"]`:

```ts
  ["ext_property_types", "Tipos_propiedad", "text_array"],
```

- [ ] **Step 4: Correr y verificar que pasa**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub && npx vitest run src/lib/zoho/outbound-whitelist.test.ts && npm test
```

Esperado: PASS en la suite nueva y en la completa.

- [ ] **Step 5: Verificar el campo en Zoho antes de confiar**

Confirmar que `Tipos_propiedad` existe en el módulo de desarrollos y es multiselect. Zoho valida duro el TIPO del campo pero **no** valida los valores de un picklist: si mandamos una grafía que su catálogo no tiene, la acepta en silencio y queda basura.

Consultar los campos del módulo y verificar que las siete grafías de `TIPOS_PRODUCTO_OPTIONS` están en el picklist de `Tipos_propiedad`. Si falta alguna, añadirla en Zoho **antes** de empujar, o esa grafía entrará como valor huérfano.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add src/lib/zoho/outbound-whitelist.ts src/lib/zoho/outbound-whitelist.test.ts
git commit -m "feat(zoho): ext_property_types sale hacia Tipos_propiedad

El campo solo entraba desde Zoho. Editarlo en el Hub sin empujarlo hacia
afuera hacia que el siguiente pull lo pisara.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Las dos rutas del sitio dan la misma respuesta

Cierre verificable de la fase 2.

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/components/marketplace/FilterBar.tsx:532` (etiqueta del chip «Tipo desarrollo»)
- Modify: `src/i18n/messages/es.json` y `src/i18n/messages/en.json` (etiqueta del filtro)

**Interfaces:**
- Consumes: la vista migrada de la Task 3.
- Produces: nada que otras tareas consuman.

- [ ] **Step 1: Renombrar el rótulo en las dos locales**

El chip usa `t('filterDevType')` del namespace `marketplace`
(`src/components/marketplace/FilterBar.tsx:531`).

En `src/i18n/messages/es.json:603`:

```json
    "filterDevType": "Formato",
```

En `src/i18n/messages/en.json:603`:

```json
    "filterDevType": "Format",
```

**Cuidado:** hay otro `filterType` en la línea 2000 de ambos archivos, en un
namespace distinto. No tocarlo. Tampoco tocar el bloque `developmentTypes`:
las opciones del desplegable siguen siendo `Residencial vertical`, `Mixto`, etc.

- [ ] **Step 2: Verificar que la clave cambió en las dos locales**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
grep -n "filterDevType" src/i18n/messages/es.json src/i18n/messages/en.json
```

Esperado: `"Formato"` en es, `"Format"` en en.

- [ ] **Step 3: Comparar las dos rutas**

Levantar el sitio contra la base migrada:

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run build && npm start
```

Visitar y anotar el conteo de resultados de cada par:

| Ruta A | Ruta B |
|---|---|
| `/es/desarrollos?type=terreno` | `/es/desarrollos/tipo/terreno` |
| `/es/desarrollos?type=casa` | `/es/desarrollos/tipo/casa` |
| `/es/desarrollos?type=departamento` | `/es/desarrollos/tipo/departamento` |

Esperado: **los dos conteos de cada fila coinciden.** Antes de la fase 2, terreno daba 5 y 2.

Si no coinciden, no seguir a la fase 3: significa que una de las dos rutas sigue leyendo algo distinto, y la fase 3 construye encima de esa suposición.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "refactor(filtros): el chip «Tipo desarrollo» se llama «Formato»

Dos filtros llamados «tipo» uno junto al otro. El de producto se queda con el
nombre; este describe como esta construido el desarrollo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FASE 3 — Catálogo limpio y precios por tipo

Solo `Next_Propyte_web`.

### Task 8: El catálogo canónico, en un solo lugar

**Repo:** `Next_Propyte_web`

**Files:**
- Create: `src/lib/catalog/product-types.ts`
- Create: `src/lib/catalog/product-types.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `export const PRODUCT_TYPES: readonly ['departamento','penthouse','casa','villa','terreno','macrolote','comercial']`
  - `export type ProductType = (typeof PRODUCT_TYPES)[number]`
  - `export const PRODUCT_TYPE_SPELLINGS: Record<ProductType, readonly string[]>`
  - `export function resolveProductType(raw: string | null | undefined): ProductType | null`

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/lib/catalog/product-types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PRODUCT_TYPES, PRODUCT_TYPE_SPELLINGS, resolveProductType } from './product-types';

describe('catálogo de tipos de producto', () => {
  it('son exactamente siete, en orden de presentación', () => {
    expect(PRODUCT_TYPES).toEqual([
      'departamento', 'penthouse', 'casa', 'villa', 'terreno', 'macrolote', 'comercial',
    ]);
  });

  it('cada canónico declara al menos una grafía', () => {
    for (const t of PRODUCT_TYPES) {
      expect(PRODUCT_TYPE_SPELLINGS[t].length, `${t} sin grafías`).toBeGreaterThan(0);
    }
  });

  it('ninguna grafía está declarada en dos canónicos', () => {
    const vistas = new Map<string, string>();
    for (const t of PRODUCT_TYPES) {
      for (const g of PRODUCT_TYPE_SPELLINGS[t]) {
        const k = g.toLowerCase();
        expect(vistas.has(k), `«${g}» está en ${vistas.get(k)} y en ${t}`).toBe(false);
        vistas.set(k, t);
      }
    }
  });
});

describe('resolveProductType', () => {
  it('resuelve las grafías que el inventario tiene hoy', () => {
    // Verificadas contra la base el 2026-08-20.
    expect(resolveProductType('Departamento')).toBe('departamento');
    expect(resolveProductType('Casa')).toBe('casa');
    expect(resolveProductType('Terreno')).toBe('terreno');
    expect(resolveProductType('Lote')).toBe('terreno');
    expect(resolveProductType('Lotes')).toBe('terreno');
    expect(resolveProductType('Terrenos')).toBe('terreno');
    expect(resolveProductType('Penthouse')).toBe('penthouse');
    expect(resolveProductType('Villa')).toBe('villa');
    expect(resolveProductType('Estudio')).toBe('departamento');
    expect(resolveProductType('2 Recámaras')).toBe('departamento');
  });

  it('Oficina y Local comercial dejan de ser «departamento»', () => {
    // El cajon silencioso: normalizeUnitType mandaba a 'departamento' todo lo
    // que no reconocia, y el comprador veia «Departamentos» sobre una oficina.
    expect(resolveProductType('Oficina')).toBe('comercial');
    expect(resolveProductType('Local comercial')).toBe('comercial');
    expect(resolveProductType('Lote comercial')).toBe('comercial');
  });

  it('Villa deja de ser «casa»', () => {
    expect(resolveProductType('Villa')).not.toBe('casa');
  });

  it('Condominio queda fuera del catálogo: es régimen, no producto', () => {
    expect(resolveProductType('Condominio')).toBeNull();
  });

  it('vacío, nulo y desconocido no inventan un tipo', () => {
    // 162 filas de unidad tienen tipo_unidad NULL. Rellenarlas con
    // «departamento» es exactamente la mentira que se está quitando.
    expect(resolveProductType(null)).toBeNull();
    expect(resolveProductType(undefined)).toBeNull();
    expect(resolveProductType('')).toBeNull();
    expect(resolveProductType('   ')).toBeNull();
    expect(resolveProductType('Nave industrial')).toBeNull();
  });

  it('tolera variantes no catalogadas por prefijo', () => {
    expect(resolveProductType('lote residencial')).toBe('terreno');
    expect(resolveProductType('CASA DE PLAYA')).toBe('casa');
    expect(resolveProductType('  Villas  ')).toBe('villa');
  });

  it('«Lote comercial» gana comercial, no terreno: el orden importa', () => {
    expect(resolveProductType('Lote comercial')).toBe('comercial');
    expect(resolveProductType('Lote')).toBe('terreno');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/catalog/product-types.test.ts
```

Esperado: FAIL — no se puede resolver `./product-types`.

- [ ] **Step 3: Implementar**

Crear `src/lib/catalog/product-types.ts`:

```ts
/**
 * Catálogo canónico de tipos de PRODUCTO — qué vende un desarrollo.
 *
 * ÚNICA fuente de la normalización de tipos en todo el sitio. La vista
 * `v_developments.property_types` devuelve grafías CRUDAS a propósito: si el
 * SQL también normalizara, las dos implementaciones divergirían y nadie se
 * enteraría hasta que un filtro se vaciara en silencio.
 *
 * No confundir con `developmentType` (residencial-vertical, mixto, hotelero…),
 * que describe el FORMATO del desarrollo, no el producto en venta.
 *
 * Spec: docs/superpowers/specs/2026-08-20-tipos-producto-multiples-design.md
 */

/** Orden de presentación. Fijo: v_units es un subconjunto del inventario real,
 *  así que ordenar por frecuencia inventaría una jerarquía que el dato no
 *  respalda. */
export const PRODUCT_TYPES = [
  'departamento',
  'penthouse',
  'casa',
  'villa',
  'terreno',
  'macrolote',
  'comercial',
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

/**
 * Grafías crudas que el inventario guarda para cada canónico, verificadas
 * contra `Propyte_unidades.tipo_unidad` y `ext_property_types` el 2026-08-20.
 *
 * MANTENIMIENTO: de aquí sale también el mapa que usan las facetas SEO para
 * filtrar en Supabase (`taxonomy-values.ts`). Si alguien captura una grafía
 * nueva en el Hub y no está aquí, ese desarrollo deja de aparecer en su filtro
 * — sin error, solo un resultado menos.
 *
 * `Condominio` NO está: es régimen de propiedad, no producto.
 */
export const PRODUCT_TYPE_SPELLINGS: Record<ProductType, readonly string[]> = {
  departamento: ['Departamento', 'Departamentos', 'Estudio', 'Studio', 'Loft', '2 Recámaras'],
  penthouse: ['Penthouse', 'Penthouses'],
  casa: ['Casa', 'Casas', 'Residencia', 'Residencias', 'Townhouse'],
  villa: ['Villa', 'Villas'],
  terreno: ['Terreno', 'Terrenos', 'Lote', 'Lotes'],
  macrolote: ['Macrolote', 'Macrolotes'],
  comercial: ['Local comercial', 'Locales comerciales', 'Lote comercial', 'Oficina', 'Oficinas'],
};

/** Índice grafía-en-minúsculas → canónico, construido una vez. */
const BY_SPELLING: ReadonlyMap<string, ProductType> = new Map(
  PRODUCT_TYPES.flatMap((t) =>
    PRODUCT_TYPE_SPELLINGS[t].map((s) => [s.toLowerCase(), t] as const),
  ),
);

/**
 * Grafía cruda → canónico, o `null` si no corresponde a ningún producto.
 *
 * `null` es un resultado legítimo y frecuente: 162 filas de unidad tienen
 * `tipo_unidad` NULL. Devolver `'departamento'` para lo desconocido es lo que
 * hacía pasar una oficina por departamento.
 */
export function resolveProductType(raw: string | null | undefined): ProductType | null {
  const lower = (raw ?? '').toLowerCase().trim();
  if (!lower) return null;

  const exacto = BY_SPELLING.get(lower);
  if (exacto) return exacto;

  // Tolerancia por prefijo para variantes que nadie catalogó («lote
  // residencial», «casa de playa»). El orden importa: 'lote comercial'
  // tiene que caer en comercial ANTES de que la regla de lote lo atrape.
  if (lower.includes('comercial') || lower.startsWith('local') || lower.startsWith('oficina')) {
    return 'comercial';
  }
  if (lower.startsWith('macrolote') || lower.startsWith('megalote')) return 'macrolote';
  if (lower.startsWith('terreno') || lower.startsWith('lote')) return 'terreno';
  if (lower.startsWith('penthouse')) return 'penthouse';
  if (lower.startsWith('villa')) return 'villa';
  if (lower.startsWith('casa') || lower.startsWith('townhouse') || lower.startsWith('residencia')) {
    return 'casa';
  }
  if (lower.startsWith('departamento') || lower.startsWith('depto') ||
      lower.startsWith('estudio') || lower.startsWith('studio') || lower.startsWith('loft')) {
    return 'departamento';
  }
  return null;
}
```

- [ ] **Step 4: Correr y verificar que pasa**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/catalog/product-types.test.ts
```

Esperado: PASS, 12 pruebas.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/lib/catalog/product-types.ts src/lib/catalog/product-types.test.ts
git commit -m "feat(catalogo): fuente unica de los tipos de producto

Siete canonicos con sus grafias crudas. Villa deja de ser casa y las oficinas
y locales dejan de ser departamentos. Condominio sale: es regimen, no producto.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: El union de tipos crece a siete

Ampliar `Property['specs']['type']` hace fallar el `tsc` en todo lugar que enumere los cinco. Ese fallo es el mapa de trabajo de esta tarea.

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/types/property.ts:25`
- Modify: `src/lib/mappers/development-to-property.ts:152-153` (`VALID_SPEC_TYPES`) y `:207-224` (`resolveSpecType`)
- Modify: `src/lib/supabase/development-aggregates.ts:29-35` (`TYPE_ORDER`)
- Modify: `src/lib/investment/market-rent.ts:29` (`RENTABLE_PROPERTY_TYPES`)

**Interfaces:**
- Consumes: `ProductType`, `PRODUCT_TYPES` de la Task 8.
- Produces: `Property['specs']['type']` pasa a ser `ProductType` (siete valores).

- [ ] **Step 1: Escribir la prueba que falla**

Añadir a `src/lib/catalog/product-types.test.ts`:

```ts
import type { Property } from '@/types/property';

describe('el union de Property se alinea al catálogo', () => {
  it('specs.type acepta los siete canónicos', () => {
    // Prueba de tipos: si el union no creció, esto no compila.
    const tipos: Array<Property['specs']['type']> = [...PRODUCT_TYPES];
    expect(tipos).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit
```

Esperado: FAIL — `'villa' | 'comercial'` no es asignable a `Property['specs']['type']`.

- [ ] **Step 3: Ampliar el union**

En `src/types/property.ts`, reemplazar la línea 25:

```ts
  type: 'departamento' | 'penthouse' | 'terreno' | 'macrolote' | 'casa';
```

por:

```ts
  /** Catálogo canónico de producto. Fuente: lib/catalog/product-types.ts. */
  type: ProductType;
```

Y añadir el import arriba del archivo:

```ts
import type { ProductType } from '@/lib/catalog/product-types';
```

- [ ] **Step 4: Alinear los tres enumerados que existían a mano**

En `src/lib/mappers/development-to-property.ts`, reemplazar las líneas 152-153:

```ts
const VALID_SPEC_TYPES: ReadonlyArray<Property['specs']['type']> = [
  'departamento', 'penthouse', 'casa', 'terreno', 'macrolote',
];
```

por:

```ts
// Deriva del catálogo: enumerarlos aquí garantizaba que se quedaran atrás.
const VALID_SPEC_TYPES: ReadonlyArray<Property['specs']['type']> = PRODUCT_TYPES;
```

con el import correspondiente:

```ts
import { PRODUCT_TYPES, resolveProductType } from '@/lib/catalog/product-types';
```

En el mismo archivo, reemplazar el cuerpo de `resolveSpecType` (líneas 207-224) por:

```ts
export function resolveSpecType(
  propertyTypes: string[] | string | null | undefined,
  developmentType?: string | null,
): Property['specs']['type'] {
  const list = Array.isArray(propertyTypes) ? propertyTypes : [propertyTypes];
  for (const candidato of list) {
    const t = resolveProductType(candidato);
    if (t) return t;
  }
  switch (normalizeDevelopmentType(developmentType)) {
    case 'lotes': return 'terreno';
    case 'macrolotes': return 'macrolote';
    case 'residencial-horizontal':
    case 'townhouse': return 'casa';
    default: return 'departamento';
  }
}
```

En `src/lib/supabase/development-aggregates.ts`, reemplazar las líneas 29-35:

```ts
const TYPE_ORDER: ReadonlyArray<Property['specs']['type']> = [
  'departamento',
  'penthouse',
  'casa',
  'terreno',
  'macrolote',
];
```

por:

```ts
/** Orden de presentación de los tipos. Sale del catálogo, que ya lo declara
 *  en el orden correcto. */
const TYPE_ORDER: ReadonlyArray<Property['specs']['type']> = PRODUCT_TYPES;
```

con el import — **solo `PRODUCT_TYPES` en esta tarea.** `resolveProductType`
entra en la Task 10; importarlo aquí sin usarlo tumba `npm run lint`:

```ts
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';
```

En `src/lib/investment/market-rent.ts`, reemplazar la línea 29:

```ts
const RENTABLE_PROPERTY_TYPES = new Set(['departamento', 'penthouse', 'casa']);
```

por:

```ts
// 'villa' entra al abrirse como canónico propio: antes caía en 'casa' y sí
// estimaba renta. Sin esta línea, separar villa apagaría en silencio la
// estimación de renta de esos desarrollos.
const RENTABLE_PROPERTY_TYPES = new Set(['departamento', 'penthouse', 'casa', 'villa']);
```

- [ ] **Step 5: Recorrer los errores restantes de `tsc` uno por uno**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit
```

Cada error restante es un consumidor que enumera los cinco tipos viejos. Para cada uno: añadir la rama de `villa` y `comercial`. Referencia de dónde están:

```bash
grep -rn "'macrolote'" src --include=*.ts --include=*.tsx | grep -v "\.test\."
```

Los conocidos al 2026-08-20: `src/app/api/rental-comparables/route.ts:13` (enum de zod — añadir `'villa'` y `'comercial'` al `z.enum`), `src/lib/supabase/types.ts:7` (`PropType`), `src/components/home/FeaturedProperties.tsx:27`.

Repetir hasta que `tsc --noEmit` salga limpio.

- [ ] **Step 6: Correr todo**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit && npm run test:unit
```

Esperado: PASS en ambos.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add -A src/types src/lib src/app src/components
git commit -m "feat(tipos): el union de producto crece a siete

Villa y comercial pasan a ser canonicos. VALID_SPEC_TYPES y TYPE_ORDER dejan
de enumerarse a mano y derivan del catalogo. RENTABLE_PROPERTY_TYPES gana
villa: antes caia en casa y si estimaba renta.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Se acaba el cajón silencioso de `normalizeUnitType`

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/lib/mappers/unit-to-property.ts:112-120` y `:218`
- Modify: `src/lib/supabase/development-aggregates.ts:105-110`
- Modify: `src/lib/investment/resolve-rows.ts:41`
- Test: `src/lib/catalog/product-types.test.ts`

**Interfaces:**
- Consumes: `resolveProductType` de la Task 8.
- Produces: `normalizeUnitType(raw): ProductType | null` — la firma cambia. Tres llamadores la consumen: la ficha de unidad (respalda en `'departamento'`), el agregador (descarta los `null`), y el objetivo de renta (acepta `null` tal cual, su campo ya es `string | null`).

- [ ] **Step 1: Escribir la prueba que falla**

Añadir a `src/lib/catalog/product-types.test.ts`:

```ts
import { normalizeUnitType } from '@/lib/mappers/unit-to-property';

describe('normalizeUnitType', () => {
  it('delega en el catálogo y ya no inventa un tipo', () => {
    expect(normalizeUnitType('Oficina')).toBe('comercial');
    expect(normalizeUnitType('Villa')).toBe('villa');
    expect(normalizeUnitType(null)).toBeNull();
    expect(normalizeUnitType('Nave industrial')).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/catalog/product-types.test.ts
```

Esperado: FAIL — `normalizeUnitType(null)` devuelve `'departamento'`.

- [ ] **Step 3: Implementar**

En `src/lib/mappers/unit-to-property.ts`, reemplazar las líneas 112-120 por:

```ts
export function normalizeUnitType(raw: string | null | undefined): ProductType | null {
  return resolveProductType(raw);
}
```

con el import:

```ts
import { resolveProductType, type ProductType } from '@/lib/catalog/product-types';
```

En el mismo archivo, línea 218:

```ts
  const specType: Property['specs']['type'] = normalizeUnitType(row.unit_type);
```

pasa a:

```ts
  // Una unidad SIEMPRE tiene que mostrar algo en su ficha, así que aquí sí hay
  // respaldo. La deuda que queda: 162 filas tienen tipo_unidad NULL y se verán
  // como departamento. Es el comportamiento de hoy, y arreglarlo es capturar
  // el dato, no adivinarlo mejor. Fuera de alcance del spec 2026-08-20.
  const specType: Property['specs']['type'] = normalizeUnitType(row.unit_type) ?? 'departamento';
```

En `src/lib/supabase/development-aggregates.ts`, reemplazar las líneas 105-110 por:

```ts
      // unit_type crudo de Zoho ("Terreno", "Lote", "Estudio", "Oficina").
      // Lo que el catálogo no reconoce NO aporta un tipo: antes caía en
      // 'departamento' y anunciábamos departamentos donde había oficinas.
      const tipo = resolveProductType(u.unit_type);
      if (tipo) acc.types.add(tipo);
```

y en ese archivo quitar el import de `normalizeUnitType`, ampliando el que ya
existe del catálogo:

```ts
import { PRODUCT_TYPES, resolveProductType } from '@/lib/catalog/product-types';
```

En `src/lib/investment/resolve-rows.ts:41` no hay cambio de código —
`MarketRentTarget.propertyType` ya es `string | null`. Verificar que compila.

- [ ] **Step 4: Correr y verificar que pasa**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit && npm run test:unit
```

Esperado: PASS.

- [ ] **Step 5: Verificar con datos reales que las oficinas dejaron de mentir**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run build && npm start
```

Buscar el desarrollo visible que tiene una unidad `Local comercial` (uno solo al 2026-08-20) y confirmar que su tarjeta muestra el chip de comercial, no «Departamentos».

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/lib/mappers/unit-to-property.ts src/lib/supabase/development-aggregates.ts src/lib/catalog/product-types.test.ts
git commit -m "fix(tipos): oficinas y locales dejan de mostrarse como departamentos

normalizeUnitType mandaba al cajon 'departamento' todo lo que no reconocia.
No fallaba: mentia. Ahora devuelve null y el agregador lo descarta.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Las facetas SEO y el desplegable derivan del catálogo

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/lib/supabase/taxonomy-values.ts:28-39` (`TYPE_DB_VALUES`) y `:56-75`
- Modify: `src/lib/supabase/taxonomy-values.test.ts`
- Modify: `src/components/marketplace/FilterBar.tsx:188-194` (`typeOptions`)
- Modify: `src/i18n/messages/es.json` y `src/i18n/messages/en.json`

**Interfaces:**
- Consumes: `PRODUCT_TYPES`, `PRODUCT_TYPE_SPELLINGS` de la Task 8.
- Produces: `TYPE_DB_VALUES` sigue exportándose con la misma forma (`Record<string, string[]>`), ahora derivado. `src/lib/supabase/queries.ts:134` no cambia.

- [ ] **Step 1: Añadir las claves i18n**

En `src/i18n/messages/es.json`, en el bloque `"types"`, añadir después de `"local_comercial"`:

```json
    "comercial": "Comercial",
```

En el bloque `"unitTypesPlural"` del mismo archivo, reemplazar el bloque completo por:

```json
  "unitTypesPlural": {
    "departamento": "Departamentos",
    "penthouse": "Penthouses",
    "casa": "Casas",
    "villa": "Villas",
    "terreno": "Terrenos",
    "macrolote": "Macrolotes",
    "comercial": "Comerciales"
  },
```

En `src/i18n/messages/en.json`, en `"types"` añadir:

```json
    "comercial": "Commercial",
```

y reemplazar `"unitTypesPlural"` por:

```json
  "unitTypesPlural": {
    "departamento": "Apartments",
    "penthouse": "Penthouses",
    "casa": "Houses",
    "villa": "Villas",
    "terreno": "Land",
    "macrolote": "Large lots",
    "comercial": "Commercial"
  },
```

`villa` ya existe en `"types"` en las dos locales — no duplicarla.

- [ ] **Step 2: Escribir la prueba que falla**

Añadir a `src/lib/supabase/taxonomy-values.test.ts`:

```ts
import { TYPE_DB_VALUES } from './taxonomy-values';
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';

describe('TYPE_DB_VALUES deriva del catálogo', () => {
  it('cubre los siete canónicos', () => {
    expect(Object.keys(TYPE_DB_VALUES).sort()).toEqual([...PRODUCT_TYPES].sort());
  });

  it('las grafías nuevas están: sin ellas la faceta se vacía en silencio', () => {
    expect(TYPE_DB_VALUES.villa).toContain('Villa');
    expect(TYPE_DB_VALUES.comercial).toContain('Local comercial');
    expect(TYPE_DB_VALUES.comercial).toContain('Oficina');
    expect(TYPE_DB_VALUES.terreno).toContain('Lotes');
  });
});
```

- [ ] **Step 3: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/supabase/taxonomy-values.test.ts
```

Esperado: FAIL — `TYPE_DB_VALUES.villa` es `undefined`.

- [ ] **Step 4: Derivar el mapa**

En `src/lib/supabase/taxonomy-values.ts`, reemplazar el bloque de `TYPE_DB_VALUES` (líneas 28-39) por:

```ts
/**
 * Slug de tipo → grafías aceptadas dentro del array `property_types`.
 *
 * Deriva del catálogo. Antes se declaraba a mano aquí y había que acordarse de
 * tocar los dos lugares: si alguien añadía una grafía en un sitio y no en el
 * otro, la faceta devolvía menos resultados sin dar ningún error.
 *
 * `terreno` cubre lote y terreno, singular y plural, porque el inventario los
 * distingue sin criterio estable y para quien compra son el mismo producto.
 */
export const TYPE_DB_VALUES: Record<string, string[]> = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t, [...PRODUCT_TYPE_SPELLINGS[t]]]),
);
```

con el import:

```ts
import { PRODUCT_TYPES, PRODUCT_TYPE_SPELLINGS } from '@/lib/catalog/product-types';
```

Y actualizar `OBSERVED_TYPE_VALUES` (líneas 56-67) con las grafías verificadas el 2026-08-20:

```ts
export const OBSERVED_TYPE_VALUES = [
  'Departamento',
  'Casa',
  'Penthouse',
  'Villa',
  'Residencia',
  'Terrenos',
  'Terreno',
  'Lote',
  'Lotes',
  'Local comercial',
  'Lote comercial',
  'Oficina',
  'Estudio',
  '2 Recámaras',
];
```

Y `VALUES_NOT_IN_INVENTORY` (línea 75):

```ts
/** Grafías que el catálogo declara y que el inventario NO tenía el 2026-08-20.
 *  Se aceptan a propósito: la faceta existe y quedará vacía hasta que haya
 *  producto de ese tipo. */
export const VALUES_NOT_IN_INVENTORY = [
  'Macrolote', 'Macrolotes', 'Townhouse', 'Departamentos', 'Casas',
  'Residencias', 'Villas', 'Penthouses', 'Locales comerciales', 'Oficinas',
  'Studio', 'Loft',
];
```

`Condominio` sale de `OBSERVED_TYPE_VALUES`: ya no es un valor que el catálogo pretenda mapear.

- [ ] **Step 5: Derivar el desplegable del filtro**

En `src/components/marketplace/FilterBar.tsx`, reemplazar las líneas 188-194:

```ts
  const typeOptions = [
    { value: 'departamento', label: tTypes('departamento') },
    { value: 'penthouse', label: tTypes('penthouse') },
    { value: 'casa', label: tTypes('casa') },
    { value: 'terreno', label: tTypes('terreno') },
    { value: 'macrolote', label: tTypes('macrolote') },
  ];
```

por:

```ts
  // Del catálogo, no a mano: escritas aquí, un producto nuevo en el inventario
  // no tenía opción bajo la cual filtrarse y nadie se enteraba.
  const typeOptions = PRODUCT_TYPES.map((t) => ({ value: t, label: tTypes(t) }));
```

con el import:

```ts
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';
```

- [ ] **Step 6: Correr y verificar que pasa**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/supabase/taxonomy-values.test.ts && npm run test:unit && npx tsc --noEmit
```

Esperado: PASS en todo.

- [ ] **Step 7: Verificar que el desplegable creció**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run build && npm start
```

Abrir `/es/desarrollos` y confirmar que el desplegable de tipo muestra las siete opciones, con `Villa` y `Comercial` traducidas — no la clave cruda.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/lib/supabase/taxonomy-values.ts src/lib/supabase/taxonomy-values.test.ts src/components/marketplace/FilterBar.tsx src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(filtros): el desplegable y las facetas derivan del catalogo

Las cinco opciones estaban escritas a mano y el mapa de grafias en otro
archivo: un producto nuevo no tenia bajo que filtrarse, sin error visible.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Agregados de precio y superficie por tipo

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/lib/supabase/development-aggregates.ts` (interfaz, consulta y acumulador)
- Modify: `src/types/property.ts` (nuevo campo `unitTypeStats`)
- Modify: `src/lib/mappers/development-to-property.ts` (propagar el campo)

**Interfaces:**
- Consumes: `resolveProductType` de la Task 8.
- Produces:
  - `DevelopmentUnitAggregates.unit_type_stats?: Partial<Record<ProductType, { priceMin: number | null; areaMin: number | null }>>`
  - `Property.unitTypeStats?: Partial<Record<ProductType, { priceMin: number | null; areaMin: number | null }>>` — lo consume la Task 13.

**Columna de precio:** `v_units.price_mxn` (`numeric`), verificada en
`information_schema` el 2026-08-20. La tabla base la llama `precio_mxn`; en la
vista el alias es en inglés. No usar `price_from` ni `sale_price` ni
`discount_price_mxn`: `price_mxn` es el que ya alimenta el resto de la tarjeta y
mantener otra fuente aquí produciría dos «desde» distintos en la misma pantalla.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `src/lib/supabase/development-aggregates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { accumulateUnitStats } from './development-aggregates';

describe('accumulateUnitStats', () => {
  it('separa el mínimo de precio y área por tipo de producto', () => {
    // El caso que motiva D7: lotes baratos y casas caras en el mismo
    // desarrollo. Filtrar Casa y ver el precio del lote es la falla.
    const stats = accumulateUnitStats([
      { unit_type: 'Lote', price_mxn: 1_000_000, area_m2: null, lot_area_m2: 200 },
      { unit_type: 'Lote', price_mxn: 1_200_000, area_m2: null, lot_area_m2: 240 },
      { unit_type: 'Casa', price_mxn: 5_000_000, area_m2: 150, lot_area_m2: 300 },
    ]);
    expect(stats.terreno).toEqual({ priceMin: 1_000_000, areaMin: 200 });
    expect(stats.casa).toEqual({ priceMin: 5_000_000, areaMin: 150 });
  });

  it('las unidades sin tipo reconocible no crean una entrada', () => {
    const stats = accumulateUnitStats([
      { unit_type: null, price_mxn: 900_000, area_m2: 50, lot_area_m2: null },
      { unit_type: 'Nave industrial', price_mxn: 800_000, area_m2: 60, lot_area_m2: null },
    ]);
    expect(Object.keys(stats)).toHaveLength(0);
  });

  it('un precio ausente no borra el tipo, solo deja el precio en null', () => {
    const stats = accumulateUnitStats([
      { unit_type: 'Villa', price_mxn: null, area_m2: 180, lot_area_m2: null },
    ]);
    expect(stats.villa).toEqual({ priceMin: null, areaMin: 180 });
  });

  it('Supabase manda NUMERIC como string y no debe romper el mínimo', () => {
    const stats = accumulateUnitStats([
      { unit_type: 'Casa', price_mxn: '5000000', area_m2: '150.50', lot_area_m2: null },
      { unit_type: 'Casa', price_mxn: '4000000', area_m2: '140.00', lot_area_m2: null },
    ]);
    expect(stats.casa).toEqual({ priceMin: 4_000_000, areaMin: 140 });
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/supabase/development-aggregates.test.ts
```

Esperado: FAIL — `accumulateUnitStats` no está exportada.

- [ ] **Step 3: Implementar**

En `src/lib/supabase/development-aggregates.ts`:

Añadir a la interfaz `DevelopmentUnitAggregates` (después de `area_min_m2`, línea 19):

```ts
  /** Mínimos de precio y área POR tipo de producto. Alimenta el «desde» de la
   *  tarjeta cuando hay un filtro de tipo activo: sin esto, un desarrollo con
   *  lotes desde $1M y casas desde $5M muestra «desde $1,000,000» al filtrar
   *  Casa. Nadie miente a propósito — el número simplemente no responde a la
   *  pregunta que hizo el comprador. */
  unit_type_stats?: UnitTypeStats;
```

Añadir los tipos y la función pura, exportada para poder probarla sin base de datos:

```ts
export type UnitTypeStat = { priceMin: number | null; areaMin: number | null };
export type UnitTypeStats = Partial<Record<ProductType, UnitTypeStat>>;

type UnitStatRow = {
  unit_type: string | null;
  price_mxn: number | string | null;
  area_m2: number | string | null;
  lot_area_m2: number | string | null;
};

/**
 * Mínimos de precio y área agrupados por tipo de producto.
 *
 * Pura y exportada a propósito: es la lógica que decide qué número ve el
 * comprador, y probarla contra la base sería probar la base.
 */
export function accumulateUnitStats(rows: UnitStatRow[]): UnitTypeStats {
  const out: UnitTypeStats = {};
  for (const u of rows) {
    const tipo = resolveProductType(u.unit_type);
    if (!tipo) continue;

    const price = toPositiveNumber(u.price_mxn);
    const area = toPositiveNumber(u.area_m2) ?? toPositiveNumber(u.lot_area_m2);

    const acc = out[tipo] ?? { priceMin: null, areaMin: null };
    if (price !== null) acc.priceMin = acc.priceMin === null ? price : Math.min(acc.priceMin, price);
    if (area !== null) acc.areaMin = acc.areaMin === null ? area : Math.min(acc.areaMin, area);
    out[tipo] = acc;
  }
  return out;
}
```

ampliando el import del catálogo que ya existe en el archivo (que tras la Task
10 dice `{ PRODUCT_TYPES, resolveProductType }`) para que quede:

```ts
import { PRODUCT_TYPES, resolveProductType, type ProductType } from '@/lib/catalog/product-types';
```

Ampliar el `select` de la consulta (línea 76) para traer el precio:

```ts
      .select('development_id, bedrooms, unit_type, area_m2, lot_area_m2, price_mxn')
```

Ampliar `UnitAggRow` con `price_mxn: number | string | null;`.

Y en el bloque que vuelca los acumuladores (líneas 119-126), acumular por desarrollo. La forma más simple sin duplicar lógica: agrupar las filas crudas por desarrollo y llamar `accumulateUnitStats` una vez por grupo. Añadir un `rows: UnitAggRow[]` al acumulador `byDev`:

```ts
    const byDev = new Map<
      string,
      { bedMin: number | null; bedMax: number | null; types: Set<Property['specs']['type']>; areaMin: number | null; rows: UnitAggRow[] }
    >();
```

inicializándolo con `rows: []` y haciendo `acc.rows.push(u)` en el forEach. Luego, en el volcado:

```ts
      const stats = accumulateUnitStats(acc.rows);
      if (Object.keys(stats).length > 0) d.unit_type_stats = stats;
```

- [ ] **Step 4: Propagar hasta `Property`**

En `src/types/property.ts`, después de `areaMin?: number;` (línea 192):

```ts
  /** Mínimos de precio y área por tipo de producto (kind='development' only).
   *  Alimenta la proyección de la tarjeta cuando hay filtro de tipo activo. */
  unitTypeStats?: Partial<Record<ProductType, { priceMin: number | null; areaMin: number | null }>>;
```

En `src/lib/mappers/development-to-property.ts`, dentro del objeto que devuelve `mapDevelopmentToProperty`, junto a `unitTypes` (línea 338):

```ts
    unitTypeStats: (row as { unit_type_stats?: Property['unitTypeStats'] }).unit_type_stats,
```

- [ ] **Step 5: Correr y verificar que pasa**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/lib/supabase/development-aggregates.test.ts && npx tsc --noEmit && npm run test:unit
```

Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/lib/supabase/development-aggregates.ts src/lib/supabase/development-aggregates.test.ts src/types/property.ts src/lib/mappers/development-to-property.ts
git commit -m "feat(agregados): minimos de precio y area por tipo de producto

Sin esto, filtrar Casa en un desarrollo con lotes desde 1M y casas desde 5M
muestra «desde 1,000,000». El numero no responde a la pregunta que se hizo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: La tarjeta muestra el precio del producto filtrado

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/hooks/useFilters.ts` (nueva función exportada + aplicarla al resultado)
- Test: `src/hooks/useFilters.test.ts`

**Interfaces:**
- Consumes: `Property.unitTypeStats` de la Task 12; `matchesProductType` de la Task 1.
- Produces: `export function projectForProductType(property: Property, filterType: string): Property`.

- [ ] **Step 1: Escribir la prueba que falla**

Añadir a `src/hooks/useFilters.test.ts`:

```ts
import { projectForProductType } from './useFilters';

function devMixto(): Property {
  return {
    kind: 'development',
    specs: { type: 'terreno' },
    unitTypes: ['casa', 'terreno'],
    price: { mxn: 1_000_000 },
    areaMin: 200,
    unitTypeStats: {
      terreno: { priceMin: 1_000_000, areaMin: 200 },
      casa: { priceMin: 5_000_000, areaMin: 150 },
    },
  } as unknown as Property;
}

describe('projectForProductType', () => {
  it('sin filtro activo devuelve la misma property, sin copiar', () => {
    const p = devMixto();
    expect(projectForProductType(p, '')).toBe(p);
  });

  it('con filtro activo el «desde» pasa a ser el del producto filtrado', () => {
    const casa = projectForProductType(devMixto(), 'casa');
    expect(casa.price.mxn).toBe(5_000_000);
    expect(casa.areaMin).toBe(150);
  });

  it('no muta la property original', () => {
    const p = devMixto();
    projectForProductType(p, 'casa');
    expect(p.price.mxn).toBe(1_000_000);
  });

  it('sin agregado para ese tipo, deja los números del desarrollo', () => {
    const p = devMixto();
    const ph = projectForProductType(p, 'penthouse');
    expect(ph.price.mxn).toBe(1_000_000);
    expect(ph.areaMin).toBe(200);
  });

  it('un precio nulo en el agregado no borra el del desarrollo', () => {
    const p = {
      ...devMixto(),
      unitTypeStats: { villa: { priceMin: null, areaMin: 180 } },
      unitTypes: ['villa'],
    } as unknown as Property;
    const v = projectForProductType(p, 'villa');
    expect(v.price.mxn).toBe(1_000_000);
    expect(v.areaMin).toBe(180);
  });

  it('a una unidad suelta no le toca nada', () => {
    const u = { kind: 'unit', specs: { type: 'casa' }, price: { mxn: 3_000_000 } } as unknown as Property;
    expect(projectForProductType(u, 'casa')).toBe(u);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/hooks/useFilters.test.ts
```

Esperado: FAIL — `projectForProductType` no existe.

- [ ] **Step 3: Implementar**

En `src/hooks/useFilters.ts`, junto a `matchesProductType`:

```ts
/**
 * Con un filtro de producto activo, devuelve una copia del desarrollo cuyo
 * «desde» corresponde a ese producto.
 *
 * Sin esto, un comprador que filtra Casa en un desarrollo con lotes desde $1M
 * y casas desde $5M lee «desde $1,000,000». El filtro dice casa y el precio
 * dice desarrollo; nadie mintió a propósito y aun así el número es falso para
 * la pregunta que se hizo.
 *
 * Devuelve la MISMA referencia cuando no hay nada que proyectar, para no
 * romper las comparaciones por identidad de React río abajo.
 */
export function projectForProductType(property: Property, filterType: string): Property {
  if (!filterType || property.kind !== 'development') return property;
  const stat = property.unitTypeStats?.[filterType as Property['specs']['type']];
  if (!stat) return property;
  if (stat.priceMin === null && stat.areaMin === null) return property;

  return {
    ...property,
    price: stat.priceMin !== null ? { ...property.price, mxn: stat.priceMin } : property.price,
    areaMin: stat.areaMin !== null ? stat.areaMin : property.areaMin,
  };
}
```

Y aplicarla en el `useMemo`, **después** del `.filter()` y **antes** del `switch (sortBy)` (línea 232 aprox.), para que el ordenamiento por precio use el número proyectado:

```ts
    const result = properties
      .filter(p => { /* … el predicado, sin cambios … */ })
      .map(p => projectForProductType(p, filters.type));
```

Concretamente: cambiar `const result = properties.filter(p => {` por `const result = properties.filter(p => {` … `});` seguido de una línea nueva antes del bloque de `debug`/`switch`:

```ts
    const projected = result.map(p => projectForProductType(p, filters.type));
```

y sustituir los usos posteriores de `result` (el `console.debug`, el `switch (sortBy)` y el `return`) por `projected`.

- [ ] **Step 4: Correr y verificar que pasa**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npx vitest run src/hooks/useFilters.test.ts && npm run test:unit && npx tsc --noEmit
```

Esperado: PASS.

- [ ] **Step 5: Verificar con datos reales**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run build && npm start
```

En un desarrollo multi-producto, filtrar por cada uno de sus tipos y confirmar que el «desde» de la tarjeta cambia y coincide con la unidad más barata de ese tipo en la ficha del desarrollo.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/hooks/useFilters.ts src/hooks/useFilters.test.ts
git commit -m "feat(tarjetas): el «desde» corresponde al producto filtrado

Filtrar Casa y leer el precio del lote mas barato del desarrollo. El filtro
decia casa y el precio decia desarrollo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Cierre — el chip de la tarjeta y la verificación completa

**Repo:** `Next_Propyte_web`

**Files:**
- Modify: `src/components/marketplace/MarketplaceCard.tsx:141-143`

**Interfaces:**
- Consumes: `Property.unitTypes` (ya con siete canónicos posibles).
- Produces: nada.

- [ ] **Step 1: Poner tope a los chips**

En `src/components/marketplace/MarketplaceCard.tsx`, reemplazar las líneas 141-143:

```ts
  const unitTypeLabels = property.kind === 'development' && property.unitTypes?.length
    ? property.unitTypes.map((t) => ({ key: t, label: safeUnitTypePlural(t) }))
    : [];
```

por:

```ts
  // Tope de 3: con siete canónicos posibles un desarrollo grande desbordaría
  // la fila y empujaría el precio fuera del primer vistazo. Vienen ya en el
  // orden del catálogo desde el agregador.
  const MAX_CHIPS = 3;
  const allUnitTypes = property.kind === 'development' ? (property.unitTypes ?? []) : [];
  const unitTypeLabels = allUnitTypes
    .slice(0, MAX_CHIPS)
    .map((t) => ({ key: t, label: safeUnitTypePlural(t) }));
  const extraUnitTypes = Math.max(0, allUnitTypes.length - MAX_CHIPS);
```

Y en el render de los chips (línea 425 aprox.), añadir el `+N` después del `.map()`:

```tsx
              {extraUnitTypes > 0 && (
                <span className="text-2xs text-gray-500">+{extraUnitTypes}</span>
              )}
```

- [ ] **Step 2: Verificación de punta a punta**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web && npm run test:unit && npx tsc --noEmit && npm run lint && npm run build && npm run test:prerender
```

Esperado: PASS en todo. `test:prerender` importa porque estas rutas se indexan.

- [ ] **Step 3: Recorrer la lista de aceptación del spec**

Con el sitio corriendo (`npm start`), verificar una por una:

| Qué | Esperado |
|---|---|
| `/es/desarrollos?type=terreno` vs `/es/desarrollos/tipo/terreno` | mismo conteo |
| `/es/desarrollos?type=casa` vs `/es/desarrollos/tipo/casa` | mismo conteo |
| Un desarrollo con lotes y casas | aparece en los dos filtros |
| El desplegable de tipo | siete opciones, `Villa` y `Comercial` traducidas |
| El desarrollo con unidad `Local comercial` | chip «Comerciales», no «Departamentos» |
| Con filtro Casa activo, tarjeta multi-producto | el «desde» es el de sus casas |
| El chip del segundo filtro | se llama «Formato» |
| Ficha del Hub de un desarrollo | «Tipos de producto» presente; vacío muestra el derivado en gris |

Anotar cualquier fila que falle y arreglarla antes de dar por cerrada la fase.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git add src/components/marketplace/MarketplaceCard.tsx
git commit -m "feat(tarjetas): tope de 3 chips de producto con +N

Con siete canonicos posibles un desarrollo grande desbordaba la fila y
empujaba el precio fuera del primer vistazo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Fuera de alcance

- Selección múltiple en el filtro (Casa **y** Terreno a la vez).
- Los 162 registros de unidad con `tipo_unidad` NULL. En la ficha de una unidad siguen viéndose como «Departamento». Arreglarlo es capturar el dato, no adivinarlo mejor.
- Limpiar los 204 desarrollos con `tipo_desarrollo = 'preventa'`.
- Páginas de faceta nuevas para `villa` y `comercial`. `TYPE_SLUGS`/`TYPE_MAP` en `src/app/[locale]/desarrollos/_components/typeConfig.ts` siguen con cinco entradas: abrir una faceta sin inventario que la llene es publicar una página vacía. Se decide cuando haya producto.
