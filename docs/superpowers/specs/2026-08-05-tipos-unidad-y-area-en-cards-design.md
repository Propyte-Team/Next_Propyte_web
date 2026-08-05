# Tipos de unidad y área mínima en las cards de desarrollos

**Fecha:** 2026-08-05
**Autor:** Luis Flores + Claude
**Estado:** Aprobado

## Problema

En `/es/desarrollos` el usuario no entiende **qué se vende** en cada desarrollo. La card
muestra un chip con `development_type` (`RESIDENCIAL VERTICAL`, `LOTES`, `MIXTO`,
`CONDOMINIO`), que describe la tipología del proyecto —no el producto. Nada en la card
dice "aquí venden departamentos" ni "aquí venden terrenos".

Tampoco hay superficie: la card de desarrollo muestra precio "desde" pero no metros "desde".
`specs.area` es 0 a nivel desarrollo (los metros viven en la unidad), así que la fila de
specs no se rendea.

Requisito de Luis: **el dato tiene que venir directo del inventario**, no de un campo
declarativo del desarrollo.

## Estado verificado de los datos (2026-08-05, 19 desarrollos publicados)

Query sobre `real_estate_hub.v_developments` + `v_units` con el gate de publicación
(`approved_at is not null and deleted_at is null`):

| Fuente | Cobertura | Notas |
|---|---|---|
| `v_units.unit_type` | **18 / 19** | Único sin unidades: **Nubba** (`Residencial horizontal`) |
| `v_developments.property_types` | **7 / 19** | Array declarativo, null en el resto → peor fuente |
| `v_units.area_m2 \|\| lot_area_m2` | **15 / 19** | Sin área: LUA 3030, Sanam Residential, Narai, Nubba |
| `v_developments` — columna de área | **no existe** | Confirmado en `information_schema` |

Valores crudos de `unit_type` en el inventario: `Departamento`, `Estudio`, `Casa`, `Villa`,
`Terreno`, `Lote`, `Penthouse`, `Local comercial`, `2 Recámaras`.

### Caveat crítico: `v_units` es un subconjunto

`v_units` no contiene el inventario completo, solo las unidades cargadas y aprobadas.
Ejemplos: Ancestral tiene `total_units = 221` pero 5 filas en `v_units`; Aldea Savia
`total_units = 210` con 4 filas.

Consecuencias de diseño, no negociables:

1. **Nunca mostrar conteos** ("3 departamentos") — serían falsos.
2. **Nunca ordenar los tipos por frecuencia** — el conteo del subset no representa la
   composición real del desarrollo; ordenar por él inventa una jerarquía.
3. El set de tipos puede **sub-reportar** (Aldea Savia declara `Penthouse` en
   `property_types` pero no tiene unidad penthouse cargada). Se acepta: el requisito es que
   el dato venga del inventario, y sub-reportar es preferible a anunciar un producto sin
   unidad cargada.

El mismo caveat ya aplica a `bedrooms_min/max` y a "DESDE $precio", que ya están en
producción. El comportamiento nuevo es consistente con lo existente.

## Decisiones tomadas

| Decisión | Elección | Razón |
|---|---|---|
| Granularidad de tipos | **Set canónico de 5**: `departamento`, `penthouse`, `casa`, `terreno`, `macrolote` | Reusa `normalizeUnitType()` y queda alineado con los filtros del sitio y con las cards de unidad. `Estudio` y `Local comercial` caen a `departamento` — pérdida aceptada. |
| Ubicación en la card | **Fila nueva (Row 3b)**, conserva el chip de dev-type | No se pierde información; +~22px de altura por card |
| Política de fuente | **Inventario + fallback** | `v_units` → `property_types` → `development_type`. Los 19 muestran chip. |
| Alcance | **Los 3 listados** de desarrollos | Consistencia: misma card, mismos datos |

## Arquitectura

### 1. `src/lib/supabase/development-aggregates.ts` (nuevo)

```
attachDevelopmentUnitAggregates(client, rows) → void (muta rows)
```

Una sola query bulk a `v_units` para todos los `development_id` a la vez:
`select development_id, bedrooms, unit_type, area_m2, lot_area_m2`, filtrada por
`approved_at is not null` + `deleted_at is null`.

Agrega por desarrollo y escribe en la row:

- `bedrooms_min` / `bedrooms_max` — **mueve aquí** la lógica que hoy está inline en
  `desarrollos/page.tsx:52-86`. La página queda sin bloque de agregación.
- `unit_types: string[]` — canónicos, dedup, en **orden fijo**
  `departamento → penthouse → casa → terreno → macrolote`.
- `area_min_m2: number` — mínimo de `area_m2 || lot_area_m2`, ignorando 0 y null.

Contrato de aislamiento: el helper es la única pieza que sabe de `v_units` para efectos de
agregados de listado. No consulta nada más, no formatea, no traduce. Devuelve datos crudos
canónicos; la traducción es responsabilidad de la card.

**`Number()` defensivo obligatorio**: `area_m2` es `NUMERIC` y Supabase lo serializa como
string (`"43.60"`). Sin coerción, `Math.min` sobre strings da basura.

**Fallo aislado**: la query va en `try/catch` con `console.error`. Si falla, los listados
rendean sin los agregados en vez de tirar la página — igual que el bloque actual.

### 2. Normalización de tipos

Reusa `normalizeUnitType()` de `src/lib/mappers/unit-to-property.ts` (ya exportada). No se
escribe normalizador nuevo.

Fallback cuando el desarrollo no tiene unidades: `resolveSpecType(row.property_types,
row.development_type)` de `development-to-property.ts`, que devuelve exactamente el mismo
union de 5 y ya maneja el caso `property_types` null. Produce un solo tipo.
Nubba → `Residencial horizontal` → `casa`.

### 3. Tipo `Property` (`src/types/property.ts`)

```ts
unitTypes?: Array<Property['specs']['type']>;  // solo kind='development'
areaMin?: number;                              // m², solo kind='development'
```

**`specs.area` se queda en 0.** Poblarlo encendería el cálculo de `price/m²` en la card
(`property.price.mxn / property.specs.area`), que dividiría el precio de la unidad más
barata entre el área de una unidad posiblemente distinta. Es una métrica fabricada.

### 4. `mapDevelopmentToProperty`

Lee `row.unit_types` y `row.area_min_m2` de forma defensiva (pueden no venir si el caller no
corrió el helper) y los mapea a `unitTypes` / `areaMin`. `areaMin` solo se setea si es
finito y > 0.

### 5. Card (`src/components/marketplace/MarketplaceCard.tsx`)

Ambos cambios solo para `kind === 'development'`.

**Row 2** — la fila de recámaras absorbe el área, sin altura extra:

```
1 – 3 rec · desde 44 m²
```

Respeta el toggle global m²↔sqft vía `useUnits()` + `m2ToSqft()`, igual que la fila de
specs de las unidades. Si no hay `bedroomsLabel`, la fila rendea solo el área.

**Row 3b** — pills en plural debajo del chip de dev-type. Estilo neutro
(`bg-[var(--propyte-dark-900)]/6`, sin borde) para no competir visualmente con el chip cyan
de tipo de desarrollo.

```
┌─────┐
│MIXTO│                       ← dev-type, sin cambio
└─────┘
┌─────────────┐┌─────┐
│DEPARTAMENTOS││CASAS│        ← nuevo, del inventario
└─────────────┘└─────┘
```

En `variant='compact'` (split map+list de `/propiedades`) las cards son de unidad, no de
desarrollo, así que el cambio no aplica ahí. Aun así el render va condicionado a
`kind === 'development'` para que sea correcto si en el futuro se mezclan.

### 6. i18n (`src/i18n/messages/{es,en}.json`)

- `marketplace.cardAreaFrom`: `"desde {area} {unit}"` / `"from {area} {unit}"`
- Namespace nuevo `unitTypesPlural`, 5 keys × 2 locales:

| key | es | en |
|---|---|---|
| `departamento` | Departamentos | Apartments |
| `penthouse` | Penthouses | Penthouses |
| `casa` | Casas | Houses |
| `terreno` | Terrenos | Land |
| `macrolote` | Macrolotes | Large lots |

Los valores que llegan a la card ya son canónicos lowercase (salen de `normalizeUnitType` /
`resolveSpecType`), así que **no** necesitan pasar por `normalizeI18nKey`. Aun así se accede
con un helper `safeUnitTypePlural` que cae al singular de `types` si la key faltara, para no
repetir el incidente de MISSING_MESSAGE → 500 de Turena (2026-05-25).

### 7. Callers

`attachDevelopmentUnitAggregates` se llama en los 3 listados:

- `src/app/[locale]/desarrollos/page.tsx` — reemplaza el bloque inline
- `src/app/[locale]/desarrollos/_components/CityDevelopmentsPage.tsx`
- `src/app/[locale]/desarrollos/_components/TaxonomyDevelopmentsPage.tsx`

Verificado: los dos últimos **no corren ningún agregado hoy**, así que además de tipos y m²
van a empezar a mostrar el rango de recámaras. Aprobado explícitamente por Luis.

`DevelopmentDetailPage.tsx` también usa el mapper pero es la página de detalle, que ya lee
sus propias unidades — no se toca.

`/propiedades` no cambia: sus cards son unidades y ya muestran tipo y área propios.

## Verificación

1. `npm run typecheck` — vitest no typechea; el gate es tsc
2. `npm run build` — build verde
3. Click-through en navegador (no curl) de `/es/desarrollos` y `/en/desarrollos`:
   - **Aldea Savia** → `DEPARTAMENTOS` + `CASAS`
   - **Ancestral** → `TERRENOS`, `desde 123 m²`
   - **Nubba** → `CASAS` por fallback, sin área
   - **LUA 3030 / Sanam Residential / Narai** → chip de tipo presente, **sin** m²
   - **The Landmark** → `desde 26 m²`
   - `/en` → `Apartments`, `Land`, `Houses`; toggle sqft convierte el área
4. Verificar que ninguna card de desarrollo muestre `$X/m²` (confirma que `specs.area`
   sigue en 0)

## Fuera de alcance

- Cambiar `v_developments` para exponer `unit_types` / `area_min_m2` como columnas. Es el
  hogar correcto a largo plazo (una sola fuente, cero query extra, sirve también a los
  filtros), pero toca una vista compartida con el Hub y requiere autorización de infra.
- Filtrar el listado por tipo de unidad. El filtro `tipo` existente usa
  `property_types` (`contains`), que está poblado en 7 de 19 — arreglarlo es trabajo aparte.
- Etiquetar `Local comercial` y `Estudio` con precisión. El set canónico de 5 los absorbe
  en `departamento` por decisión explícita.
