# Métricas de inversión por unidad — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el ROI y la renta de una unidad salgan del modelo de `investment_analytics.development_financials` cuando no hay captura manual, que "sin dato" deje de ser `0`, y que desaparezcan los tres hardcodes del 8% de plusvalía.

**Architecture:** Un módulo puro nuevo (`src/lib/investment/resolve.ts`) resuelve la precedencia manual → modelo → nada. Los mappers reciben el resultado como parámetro opcional; nada de acceso a BD dentro del mapper. Cero DDL: `real_estate_hub.v_units` no se toca porque es compartida con el Hub y con el outbound a Zoho.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript strict, Supabase JS SDK, vitest, next-intl.

**Spec:** `docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md`

**Rama:** `fix/cotizacion-pendientes` (la actual del worktree `Next_Propyte_web_leadmagnet`; su HEAD `cf4d0cf` = `origin/main`). No cambiar de rama.

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/lib/investment/resolve.ts` | Precedencia de ROI y renta. Lib pura, sin red ni BD. | Crear |
| `src/lib/investment/resolve.test.ts` | Tests de precedencia y de "sin dato ≠ 0". | Crear |
| `src/lib/calculator.ts` | Ya alberga los supuestos `VAC`/`RES`; se le suman los dos nuevos. | Modificar |
| `src/types/property.ts:29-33` | `PropertyROI` pasa a nullable y pierde `appreciation`. | Modificar |
| `src/lib/supabase/queries.ts:616-623` | `getBatchFinancials` gana coerción NUMERIC. | Modificar |
| `src/lib/mappers/unit-to-property.ts` | Acepta el resuelto; emite `null` en vez de `0`. | Modificar |
| `src/lib/mappers/development-to-property.ts:326` | Mismo trato. | Modificar |
| `src/hooks/useFilters.ts:194,239` | Guardas de `null` en filtro y sort de ROI. | Modificar |
| Consumidores de badge (5 archivos) | `> 0` → `!= null`; fuera el badge de plusvalía. | Modificar |
| Simuladores (3 archivos) + i18n | Supuesto de plusvalía rotulado, desde constante. | Modificar |
| `src/app/api/generate-pdf/route.ts` | Fuera el `\|\| 8`; imprime el supuesto rotulado. | Modificar |
| `src/components/property/PriceTimeline.tsx` | Historial fabricado, sin importadores. | **Borrar** |
| `src/lib/lead-magnet/score.ts` + `.test.ts` | Nueva regla de `roiPct`, sin plusvalía. | Modificar |
| `src/lib/lead-magnet/edition-data.ts` | Reusa el resolver en vez de su relleno propio. | Modificar |

**Orden importa:** Task 1 y 2 no rompen nada. Task 3 rompe el build a propósito (`tsc` enumera los consumidores) y Tasks 4-11 lo reparan. No dejar el árbol a medias entre Task 3 y Task 11.

---

### Task 1: Módulo resolver + tests

**Files:**
- Create: `src/lib/investment/resolve.ts`
- Test: `src/lib/investment/resolve.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/investment/resolve.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveUnitInvestment } from './resolve';

const unit = (over: Partial<{ roi_annual: number | null; estimated_rent_mxn: number | null }> = {}) => ({
  roi_annual: null,
  estimated_rent_mxn: null,
  ...over,
});

const fin = (over: Partial<{ roi_annual_pct: number | null; estimated_rent_residencial: number | null }> = {}) => ({
  roi_annual_pct: null,
  estimated_rent_residencial: null,
  ...over,
});

describe('resolveUnitInvestment', () => {
  it('el manual del Hub gana sobre el modelo', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 11 }), fin({ roi_annual_pct: 7 }), null);
    expect(r.roiPct).toBe(11);
    expect(r.roiSource).toBe('manual');
  });

  it('sin manual usa el modelo de desarrollo', () => {
    const r = resolveUnitInvestment(unit(), fin({ roi_annual_pct: 7.4 }), null);
    expect(r.roiPct).toBe(7.4);
    expect(r.roiSource).toBe('model');
  });

  it('sin ninguna fuente devuelve null, NUNCA 0', () => {
    const r = resolveUnitInvestment(unit(), null, null);
    expect(r.roiPct).toBeNull();
    expect(r.rentMonthly).toBeNull();
    expect(r.roiSource).toBe('none');
    expect(r.rentSource).toBe('none');
  });

  it('renta: manual > ML por recámaras > modelo de desarrollo', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 30_000 }), fin({ estimated_rent_residencial: 20_000 }), 25_000).rentMonthly).toBe(30_000);
    expect(resolveUnitInvestment(unit(), fin({ estimated_rent_residencial: 20_000 }), 25_000).rentMonthly).toBe(25_000);
    expect(resolveUnitInvestment(unit(), fin({ estimated_rent_residencial: 20_000 }), null).rentMonthly).toBe(20_000);
  });

  it('marca el origen de la renta', () => {
    expect(resolveUnitInvestment(unit(), null, 25_000).rentSource).toBe('ml');
    expect(resolveUnitInvestment(unit(), fin({ estimated_rent_residencial: 20_000 }), null).rentSource).toBe('model');
  });

  it('0, negativos y no-finitos cuentan como ausentes', () => {
    expect(resolveUnitInvestment(unit({ roi_annual: 0 }), fin({ roi_annual_pct: 7 }), null).roiPct).toBe(7);
    expect(resolveUnitInvestment(unit({ roi_annual: -3 }), fin({ roi_annual_pct: 7 }), null).roiPct).toBe(7);
    expect(resolveUnitInvestment(unit({ roi_annual: NaN }), fin({ roi_annual_pct: 7 }), null).roiPct).toBe(7);
    expect(resolveUnitInvestment(unit(), fin({ roi_annual_pct: 0 }), null).roiPct).toBeNull();
  });

  it('tolera financials null y campos ausentes', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 9 }), null, null);
    expect(r.roiPct).toBe(9);
    expect(r.rentMonthly).toBeNull();
  });

  it('descarta strings: los NUMERIC sin coercionar no deben pasar como dato', () => {
    // Supabase devuelve NUMERIC como string. Si llega sin coercionar es un bug
    // del llamador, y el resolver debe negarse en vez de propagar '7.4'.
    const r = resolveUnitInvestment(unit(), { roi_annual_pct: '7.4' as unknown as number, estimated_rent_residencial: null }, null);
    expect(r.roiPct).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test:unit -- src/lib/investment/resolve.test.ts`
Expected: FAIL — `Failed to resolve import "./resolve"`.

- [ ] **Step 3: Implementación mínima**

Crear `src/lib/investment/resolve.ts`:

```ts
// src/lib/investment/resolve.ts
// Resuelve ROI y renta mensual de una unidad con precedencia explícita.
// Lib pura: no toca red ni base de datos. Recibe números YA coercionados
// (ver coerceNumericFields en lib/supabase/queries.ts).
// Spec: docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md §3.1

export type InvestmentSource = 'manual' | 'model' | 'ml' | 'none';

export interface UnitInvestmentFields {
  roi_annual: number | null;
  estimated_rent_mxn: number | null;
}

/** Subconjunto de investment_analytics.development_financials que el sitio necesita.
 *  Solo residencial: el badge de card muestra siempre el escenario conservador
 *  (spec D4 — tipo_rendimiento no distingue modalidad de renta). */
export interface DevFinancialsSlice {
  roi_annual_pct: number | null;
  estimated_rent_residencial: number | null;
}

export interface ResolvedInvestment {
  /** null = sin dato. NUNCA 0 como sentinela. */
  roiPct: number | null;
  /** null = sin dato. NUNCA 0 como sentinela. */
  rentMonthly: number | null;
  roiSource: InvestmentSource;
  rentSource: InvestmentSource;
}

/** Un valor sirve solo si es number finito y > 0. Strings (NUMERIC sin coercionar),
 *  null, 0, negativos y NaN se tratan como ausentes. */
function usable(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export function resolveUnitInvestment(
  unit: UnitInvestmentFields,
  financials: DevFinancialsSlice | null,
  mlRent: number | null,
): ResolvedInvestment {
  const manualRoi = usable(unit.roi_annual);
  const modelRoi = usable(financials?.roi_annual_pct);

  const manualRent = usable(unit.estimated_rent_mxn);
  const mlRentUsable = usable(mlRent);
  const modelRent = usable(financials?.estimated_rent_residencial);

  return {
    roiPct: manualRoi ?? modelRoi,
    rentMonthly: manualRent ?? mlRentUsable ?? modelRent,
    roiSource: manualRoi != null ? 'manual' : modelRoi != null ? 'model' : 'none',
    rentSource:
      manualRent != null ? 'manual'
        : mlRentUsable != null ? 'ml'
          : modelRent != null ? 'model'
            : 'none',
  };
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm run test:unit -- src/lib/investment/resolve.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/investment/resolve.ts src/lib/investment/resolve.test.ts
git commit -m "feat(investment): resolver de ROI y renta con precedencia manual → modelo"
```

---

### Task 2: Constantes de supuestos

**Files:**
- Modify: `src/lib/calculator.ts:22-34`

- [ ] **Step 1: Agregar las constantes**

Después del bloque `export const RES = {...} as const;` (línea 34), insertar:

```ts
// ── Supuestos editables por el usuario (NO son datos de mercado) ──
// No existe fuente de plusvalía en la BD (spec 2026-07-27 §D6). Este número es
// el valor inicial de los sliders y debe rotularse como supuesto en el UI.
// Decisión Luis 2026-07-27: 5% — por encima del objetivo de inflación de
// Banxico, sin prometer doble dígito. Es el ÚNICO lugar donde vive.
export const APPRECIATION_ASSUMPTION_PCT = 5;

// Uplift de renta vacacional sobre la residencial cuando no hay dato de AirDNA
// ni del ML. Vivía inline en FinancialSimulator.tsx:55.
export const VAC_RENT_UPLIFT = 1.35;
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos (las constantes aún no tienen consumidores).

- [ ] **Step 3: Commit**

```bash
git add src/lib/calculator.ts
git commit -m "refactor(calculator): supuestos de plusvalía y uplift vacacional como constantes nombradas"
```

---

### Task 3: Tipos nullable — el compilador enumera los consumidores

**Files:**
- Modify: `src/types/property.ts:29-33`

- [ ] **Step 1: Cambiar `PropertyROI`**

Reemplazar:

```ts
export interface PropertyROI {
  projected: number;
  rentalMonthly: number;
  appreciation: number;
}
```

por:

```ts
/** null = sin dato. NUNCA 0 como sentinela: `0` significaba "no sabemos" y los
 *  consumidores no podían distinguirlo de un cero real.
 *  `appreciation` se eliminó: no hay fuente de plusvalía en la BD y el supuesto
 *  editable vive en APPRECIATION_ASSUMPTION_PCT (lib/calculator.ts).
 *  Spec: docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md */
export interface PropertyROI {
  projected: number | null;
  rentalMonthly: number | null;
}
```

- [ ] **Step 2: Correr tsc y GUARDAR la lista de errores**

Run: `npx tsc --noEmit 2>&1 | tee /tmp/roi-consumers.txt; wc -l < /tmp/roi-consumers.txt`
Expected: FALLA con errores en los archivos de Tasks 4-11. Esa lista es la auditoría: al final de Task 11 debe quedar vacía. Si aparece un archivo que este plan no menciona, **detenerse y reportarlo** antes de improvisar.

- [ ] **Step 3: Commit del tipo (árbol rojo, intencional)**

```bash
git add src/types/property.ts
git commit -m "refactor(types): PropertyROI nullable y sin appreciation

Rompe el build a propósito: tsc enumera los consumidores que confundían
0 con 'sin dato'. Se repara en los commits siguientes."
```

---

### Task 4: Mappers emiten null

**Files:**
- Modify: `src/lib/mappers/unit-to-property.ts:193` (firma) y `:334-338` (bloque `roi`)
- Modify: `src/lib/mappers/development-to-property.ts:226` (firma) y `:326`

- [ ] **Step 1: `unit-to-property.ts` — importar el tipo y extender la firma**

Agregar al inicio del archivo, junto a los demás imports:

```ts
import type { ResolvedInvestment } from '@/lib/investment/resolve';
```

Reemplazar la línea 193:

```ts
export function mapUnitToProperty(row: UnitRow, locale?: string): Property {
```

por:

```ts
/** `resolved` viene de resolveUnitInvestment. Omitirlo deja las métricas de
 *  inversión en null: el mapper NO consulta la base de datos. */
export function mapUnitToProperty(
  row: UnitRow,
  locale?: string,
  resolved?: ResolvedInvestment,
): Property {
```

- [ ] **Step 2: `unit-to-property.ts` — reemplazar el bloque `roi`**

Reemplazar las líneas 334-338:

```ts
    roi: {
      projected: Number(row.roi_annual) || 0,
      rentalMonthly: Number(row.estimated_rent_mxn) || 0,
      appreciation: Number(row.appreciation_annual) || 0,
    },
```

por:

```ts
    roi: {
      projected: resolved?.roiPct ?? null,
      rentalMonthly: resolved?.rentMonthly ?? null,
    },
```

- [ ] **Step 3: `development-to-property.ts` — mismo trato**

Reemplazar la línea 326 y sus vecinas del bloque `roi` por:

```ts
    roi: {
      projected: resolved?.roiPct ?? null,
      rentalMonthly: resolved?.rentMonthly ?? null,
    },
```

y extender la firma de `mapDevelopmentToProperty` (línea 226) igual que en el Step 1, con el mismo import.

- [ ] **Step 4: Verificar que estos dos archivos ya no aparecen en tsc**

Run: `npx tsc --noEmit 2>&1 | grep -E "unit-to-property|development-to-property"`
Expected: sin salida (los errores restantes son de los consumidores).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mappers/unit-to-property.ts src/lib/mappers/development-to-property.ts
git commit -m "refactor(mappers): las métricas de inversión llegan por parámetro y valen null sin dato"
```

---

### Task 5: Coerción del batch de financials

**Files:**
- Modify: `src/lib/supabase/queries.ts:616-623`
- Test: `src/lib/supabase/batch-financials.test.ts`

`getBatchFinancials` existe pero **nadie lo llama** y **no coerciona NUMERIC**. Sin coerción los valores llegan como string, `usable()` los descarta y el ROI nunca sale en listados: fallo silencioso, build verde.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/supabase/batch-financials.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { coerceBatchFinancialsRow } from './queries';

describe('coerceBatchFinancialsRow', () => {
  it('convierte los NUMERIC string de Supabase a number', () => {
    const out = coerceBatchFinancialsRow({
      development_id: 'abc',
      cap_rate: '5.20',
      estimated_rent_residencial: '18000.00',
      roi_annual_pct: '7.40',
    });
    expect(out.roi_annual_pct).toBe(7.4);
    expect(out.estimated_rent_residencial).toBe(18000);
    expect(out.cap_rate).toBe(5.2);
    expect(out.development_id).toBe('abc');
  });

  it('deja null como null y no inventa 0', () => {
    const out = coerceBatchFinancialsRow({
      development_id: 'abc', cap_rate: null, estimated_rent_residencial: null, roi_annual_pct: null,
    });
    expect(out.roi_annual_pct).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run test:unit -- src/lib/supabase/batch-financials.test.ts`
Expected: FAIL — `coerceBatchFinancialsRow is not a function`.

- [ ] **Step 3: Implementar**

Reemplazar `getBatchFinancials` (líneas 616-623) por:

```ts
const BATCH_FINANCIALS_NUMERIC_KEYS = [
  'cap_rate', 'estimated_rent_residencial', 'roi_annual_pct',
] as const;

/** Exportada solo para test: coerciona una fila del batch NUMERIC→number.
 *  Sin esto los valores llegan como string y el resolver los descarta en
 *  silencio (el ROI simplemente no aparecería). */
export function coerceBatchFinancialsRow(row: Record<string, unknown>) {
  return coerceNumericFields(row, BATCH_FINANCIALS_NUMERIC_KEYS) as {
    development_id: string;
    cap_rate: number | null;
    estimated_rent_residencial: number | null;
    roi_annual_pct: number | null;
  };
}

export async function getBatchFinancials(client: Client, developmentIds: string[]) {
  if (developmentIds.length === 0) return [];
  const { data } = await inv(client)
    .from('development_financials')
    .select('development_id, cap_rate, estimated_rent_residencial, roi_annual_pct')
    .in('development_id', developmentIds);
  return (data || []).map((r) => coerceBatchFinancialsRow(r as Record<string, unknown>));
}

/** Map development_id → slice, listo para resolveUnitInvestment. */
export async function getFinancialsMap(client: Client, developmentIds: string[]) {
  const rows = await getBatchFinancials(client, [...new Set(developmentIds)]);
  return new Map(rows.map((r) => [r.development_id, {
    roi_annual_pct: r.roi_annual_pct,
    estimated_rent_residencial: r.estimated_rent_residencial,
  }]));
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm run test:unit -- src/lib/supabase/batch-financials.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/queries.ts src/lib/supabase/batch-financials.test.ts
git commit -m "fix(queries): getBatchFinancials coerciona NUMERIC y expone getFinancialsMap"
```

---

### Task 6: Cablear los listados

**Files:**
- Modify: `src/app/[locale]/propiedades/page.tsx:46`
- Modify: `src/app/[locale]/page.tsx:88`
- Modify: `src/app/[locale]/promociones/page.tsx:63`
- Modify: `src/app/[locale]/financiamiento/page.tsx:94`

Patrón idéntico en los cuatro. Ejemplo con `propiedades/page.tsx:46`, que hoy dice:

```ts
        properties = rawUnits.map((u) => mapUnitToProperty(u, locale));
```

- [ ] **Step 1: Aplicar el patrón en `propiedades/page.tsx`**

Agregar el import:

```ts
import { getFinancialsMap } from '@/lib/supabase/queries';
import { resolveUnitInvestment } from '@/lib/investment/resolve';
```

y reemplazar la línea del `.map`:

```ts
        const finMap = await getFinancialsMap(
          supabase,
          rawUnits.map((u) => u.development_id).filter((id): id is string => !!id),
        );
        properties = rawUnits.map((u) => mapUnitToProperty(
          u,
          locale,
          // mlRent = null a propósito: el ML es una consulta por unidad y las
          // cards solo muestran ROI, no renta (spec §3.2).
          resolveUnitInvestment(u, finMap.get(u.development_id ?? '') ?? null, null),
        ));
```

Si en ese scope el cliente Supabase se llama distinto (`client`, `sb`), usar el nombre local — no crear uno nuevo.

- [ ] **Step 2: Repetir en los otros tres**

Mismo bloque en `page.tsx:88` (`discountedUnits`), `promociones/page.tsx:63` (`items`) y `financiamiento/page.tsx:94` (ahí el map es por fila dentro de un loop: resolver el `finMap` **antes** del loop y pasar `resolveUnitInvestment(row, finMap.get(row.development_id ?? '') ?? null, null)` en la llamada existente).

- [ ] **Step 3: Verificar en runtime, no solo en build**

```bash
npm run build && npm start
```
Luego, en otra terminal:
```bash
curl -s localhost:3000/es/propiedades | grep -o "ROI [0-9.]*%" | sort -u | head
```
Expected: al menos un `ROI x%`. Si sale vacío, el `finMap` no está pegando: revisar que `development_id` de la fila sea el mismo string que la clave del map (uuid vs text).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/propiedades/page.tsx" "src/app/[locale]/page.tsx" "src/app/[locale]/promociones/page.tsx" "src/app/[locale]/financiamiento/page.tsx"
git commit -m "feat(listados): ROI del modelo de desarrollo en las cards"
```

---

### Task 7: Cablear el detalle de unidad

**Files:**
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx:89,158`

El detalle ya consulta `getDevelopmentFinancials` y el ML por unidad; solo hay que pasárselos al mapper.

- [ ] **Step 1: Pasar el resuelto al mapper**

Reemplazar la línea 89:

```ts
  const property = mapUnitToProperty(row, locale);
```

por:

```ts
  const property = mapUnitToProperty(row, locale, resolveUnitInvestment(
    row,
    devFinancials
      ? { roi_annual_pct: devFinancials.roi_annual_pct, estimated_rent_residencial: devFinancials.estimated_rent_residencial }
      : null,
    mlEstimate?.estimated_rent_residencial ?? null,
  ));
```

con el import `import { resolveUnitInvestment } from '@/lib/investment/resolve';`.

**Precondición:** `devFinancials` y `mlEstimate` deben estar resueltos ANTES de la línea 89. Si hoy se obtienen después, mover esos `await` arriba — sin duplicar las consultas.

- [ ] **Step 2: Ajustar la renta con `??` estricto**

La línea 158 dice:

```ts
  const monthlyRentRes = estRentRes ?? property.roi.rentalMonthly ?? 0;
```

Dejarla así: el `?? 0` final es correcto para los cálculos aritméticos que siguen. Verificar únicamente que los componentes que **muestran** la renta chequen `> 0` antes de renderizar.

- [ ] **Step 3: Verificar en runtime**

```bash
npm start
```
Abrir una unidad de un desarrollo **con** fila en `development_financials` y otra **sin**. La primera muestra ROI; la segunda no muestra la métrica (ni `0%`, ni `—`).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx"
git commit -m "feat(detalle): ROI y renta resueltos con modelo y ML"
```

---

### Task 8: Guardas de null en los badges

**Files:**
- Modify: `src/components/ui/PropertyCard.tsx:83`
- Modify: `src/components/marketplace/MarketplaceCard.tsx:435,445,450-453`
- Modify: `src/components/property/Highlights.tsx:37`
- Modify: `src/components/property/ContactSidebar.tsx:24`
- Modify: `src/components/playground/preview/mockProperty.ts:35`

- [ ] **Step 1: `PropertyCard.tsx:83`**

`{property.roi.projected > 0 && (` → `{property.roi.projected != null && (`

- [ ] **Step 2: `MarketplaceCard.tsx`**

- `:435` — `{variant === 'compact' && property.roi.projected > 0 && (` → `... property.roi.projected != null && (`
- `:445` — `{property.roi.projected > 0 && (` → `{property.roi.projected != null && (`
- `:450-453` — **borrar el bloque completo** del badge de plusvalía (`property.roi.appreciation > 0` y su `+{...}% {tMkt('cardAppreciation')}`). La clave i18n `cardAppreciation` queda huérfana: borrarla de `src/messages/es.json` y `en.json` en el mismo commit.

- [ ] **Step 3: `Highlights.tsx:37`**

`if (property.roi.projected >= 10) {` → `if (property.roi.projected != null && property.roi.projected >= 10) {`

- [ ] **Step 4: `ContactSidebar.tsx:24`**

`const rentDisplay = smartRentEstimate || property.roi.rentalMonthly;` → `const rentDisplay = smartRentEstimate ?? property.roi.rentalMonthly;`

Y donde se renderice `rentDisplay`, envolverlo en `{rentDisplay != null && rentDisplay > 0 && (...)}` si no lo está ya.

- [ ] **Step 5: `mockProperty.ts:35`**

`roi: { projected: 12, rentalMonthly: 38000, appreciation: 8 },` → `roi: { projected: 12, rentalMonthly: 38000 },`

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit 2>&1 | grep -E "PropertyCard|MarketplaceCard|Highlights|ContactSidebar|mockProperty"`
Expected: sin salida.

- [ ] **Step 7: Commit**

```bash
git add src/components src/messages/es.json src/messages/en.json
git commit -m "fix(cards): distinguir 'sin dato' de cero; fuera el badge de plusvalía"
```

---

### Task 9: Filtro y orden de ROI a prueba de null

**Files:**
- Modify: `src/hooks/useFilters.ts:194,239`
- Test: `src/hooks/useFilters.test.ts`

`null < 5` es `true` en JS (coerciona a 0): hoy una unidad **sin** dato pasaría el filtro `roiMin`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/hooks/useFilters.test.ts` con un test de la función pura de filtrado. Si el filtro vive dentro del hook y no está exportado, **extraer primero** el predicado a `export function passesRoiMin(projected: number | null, roiMin: number): boolean` en el mismo archivo y testear eso:

```ts
import { describe, it, expect } from 'vitest';
import { passesRoiMin } from './useFilters';

describe('passesRoiMin', () => {
  it('una unidad sin dato de ROI NO pasa un filtro de ROI mínimo', () => {
    expect(passesRoiMin(null, 5)).toBe(false);
  });

  it('sin filtro activo, todas pasan', () => {
    expect(passesRoiMin(null, 0)).toBe(true);
  });

  it('compara normal cuando hay dato', () => {
    expect(passesRoiMin(7, 5)).toBe(true);
    expect(passesRoiMin(3, 5)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run test:unit -- src/hooks/useFilters.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Agregar en `useFilters.ts`:

```ts
/** Sin dato de ROI, la unidad NO satisface un mínimo de ROI. Ojo: `null < n` es
 *  true en JS por coerción a 0 — de ahí el guard explícito. */
export function passesRoiMin(projected: number | null, roiMin: number): boolean {
  if (!roiMin) return true;
  return projected != null && projected >= roiMin;
}
```

Reemplazar la línea 194:

```ts
      if (filters.roiMin && p.roi.projected < filters.roiMin) return fail('roiMin');
```

por:

```ts
      if (!passesRoiMin(p.roi.projected, filters.roiMin)) return fail('roiMin');
```

Y el sort de la línea 239:

```ts
        result.sort((a, b) => b.roi.projected - a.roi.projected);
```

por:

```ts
        // Sin dato va al final por decisión, no por coerción de null a 0.
        result.sort((a, b) => (b.roi.projected ?? -Infinity) - (a.roi.projected ?? -Infinity));
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm run test:unit -- src/hooks/useFilters.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFilters.ts src/hooks/useFilters.test.ts
git commit -m "fix(filtros): sin dato de ROI no pasa el filtro de ROI mínimo"
```

---

### Task 10: Plusvalía como supuesto rotulado en los simuladores

**Files:**
- Modify: `src/components/property/FinancialSimulator.tsx:50,55`
- Modify: `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx:25,30,33`
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx:582`
- Modify: `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Claves i18n nuevas**

En `src/messages/es.json`, namespace `simulator`:

```json
"appreciationAssumptionNote": "Supuesto editable, no una proyección de Propyte. Muévelo para ver otros escenarios."
```

En `src/messages/en.json`, mismo namespace:

```json
"appreciationAssumptionNote": "Editable assumption, not a Propyte projection. Move it to explore other scenarios."
```

- [ ] **Step 2: `FinancialSimulator.tsx`**

Import: `import { APPRECIATION_ASSUMPTION_PCT, VAC_RENT_UPLIFT } from '@/lib/calculator';`

- `:50` — `const [appreciation, setAppreciation] = useState(property.roi.appreciation);` → `const [appreciation, setAppreciation] = useState(APPRECIATION_ASSUMPTION_PCT);`
- `:54` — `const resRent = mlEstimatedRent || property.roi.rentalMonthly;` → `const resRent = mlEstimatedRent ?? property.roi.rentalMonthly ?? 0;`
- `:55` — `: resRent * 1.35)` → `: resRent * VAC_RENT_UPLIFT)`

Y junto al slider de plusvalía, renderizar la nota: `<p className="text-2xs text-gray-600">{t('appreciationAssumptionNote')}</p>`.

- [ ] **Step 3: `RentabilidadTab.tsx`**

- `:25` — borrar `appreciationDefault: number;` de las props.
- `:30` — quitar `appreciationDefault` de la desestructuración.
- `:33` — `const [appreciation, setAppreciation] = useState(appreciationDefault || 8);` → `const [appreciation, setAppreciation] = useState(APPRECIATION_ASSUMPTION_PCT);` con el import de `@/lib/calculator`.

En `ProyeccionPanel` (`:204-206`), agregar la misma nota debajo del control de plusvalía.

- [ ] **Step 4: `UnitDetailPage.tsx:582`**

Borrar la línea `appreciationDefault={property.roi.appreciation}`.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit 2>&1 | grep -E "FinancialSimulator|RentabilidadTab|UnitDetailPage"`
Expected: sin salida.

Run: `grep -rn "|| 8" src/components src/app | grep -i apprec`
Expected: sin salida.

- [ ] **Step 6: Commit**

```bash
git add src/components/property/FinancialSimulator.tsx "src/app/[locale]/propiedades/_components/RentabilidadTab.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx" src/messages/es.json src/messages/en.json
git commit -m "feat(simuladores): plusvalía como supuesto rotulado, desde constante única"
```

---

### Task 11: PDF sin el 8% fantasma

**Files:**
- Modify: `src/app/api/generate-pdf/route.ts:164,195,203,240`
- Modify: `src/app/api/generate-cotizacion-pdf/route.ts:65`

- [ ] **Step 1: Cablear el mapper en `generate-pdf`**

`:164` — `const property = mapUnitToProperty(row);` → pasar el resuelto igual que en Task 7 (el route ya trae `row`; obtener financials con `getDevelopmentFinancials(supabase, row.development_id)` si aún no lo hace, y ML con `getMlRentalEstimateForUnit` si está disponible; si no, `null`).

- [ ] **Step 2: Reemplazar el `|| 8` de las dos IRR**

`:195` y `:203` — `appreciationPct: property.roi.appreciation || 8,` → `appreciationPct: APPRECIATION_ASSUMPTION_PCT,` con `import { APPRECIATION_ASSUMPTION_PCT } from '@/lib/calculator';`

- [ ] **Step 3: Rotular el supuesto en el PDF**

`:240` ya hace `roiProjected: property.roi.projected || null` → cambiar a `?? null` (con `null` el `||` es equivalente, pero `??` es lo correcto y no descarta un 0 legítimo futuro).

Agregar al payload:

```ts
    appreciationAssumptionPct: APPRECIATION_ASSUMPTION_PCT,
```

y en el documento PDF, donde se muestren IRR 5y/10y, imprimir la nota: `IRR calculada con un supuesto de plusvalía de X% anual.` Agregar la clave a `pdf` en ambos `messages/*.json`:

```json
"appreciationAssumptionNote": "IRR calculada con un supuesto de plusvalía de {pct}% anual."
```

(en `en.json`: `"IRR calculated with an assumed {pct}% annual appreciation."`)

- [ ] **Step 4: `generate-cotizacion-pdf/route.ts:65`** — pasar el resuelto igual que arriba.

- [ ] **Step 5: Auditar el PDF renderizándolo, no por HTTP 200**

```bash
npm start
curl -s -o /tmp/ficha.pdf "localhost:3000/api/generate-pdf?slug=<slug-con-roi>&locale=es"
python -c "import fitz; d=fitz.open('/tmp/ficha.pdf'); d[0].get_pixmap(dpi=110).save('/tmp/ficha.png')"
```
Abrir `/tmp/ficha.png` y confirmar visualmente que el ROI aparece y que la nota del supuesto está impresa. Un 200 no prueba nada.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/generate-pdf/route.ts src/app/api/generate-cotizacion-pdf/route.ts src/messages/es.json src/messages/en.json
git commit -m "fix(pdf): fuera el 8% hardcodeado; el supuesto de plusvalía va impreso y rotulado"
```

---

### Task 12: Borrar PriceTimeline

**Files:**
- Delete: `src/components/property/PriceTimeline.tsx`

- [ ] **Step 1: Confirmar que sigue sin importadores**

Run: `grep -rn "PriceTimeline" src/ --include=*.tsx --include=*.ts | grep -v "components/property/PriceTimeline.tsx"`
Expected: **sin salida**. Si aparece algo, detenerse: el componente dejó de estar muerto y hay que decidir con Luis antes de borrar.

- [ ] **Step 2: Borrar**

```bash
git rm src/components/property/PriceTimeline.tsx
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: borrar PriceTimeline — historial de precios fabricado y sin importadores

generatePriceHistory inventaba eventos fechados con multiplicadores fijos
(x0.82 'Preventa Etapa 1' en 2025-06, +11%, x1.03 'Publicado', -3%) idénticos
para toda unidad, con apariencia de historial real. No hay serie histórica de
precio por unidad en la BD. Componente muerto: cero importadores."
```

---

### Task 13: Score del lead magnet sin plusvalía inventada

**Files:**
- Modify: `src/lib/lead-magnet/score.ts:20-23,44,63`
- Modify: `src/lib/lead-magnet/score.test.ts:14-15,26-27`
- Modify: `src/lib/lead-magnet/edition-data.ts:14-17,62-83`

- [ ] **Step 1: Reescribir el test del fallback**

En `score.test.ts`, reemplazar el caso de `:26`:

```ts
  it('roi cae a yield + appreciation (default 8) cuando roi_annual es null', () => {
    const c = computeComponents(unit({ roi_annual: null, appreciation_annual: null }));
```

por:

```ts
  it('sin roi_annual, el roi es el yield bruto — sin sumar plusvalía inventada', () => {
    const u = unit({ roi_annual: null });
    const c = computeComponents(u);
    expect(c.roiPct).toBeCloseTo(c.grossYieldPct, 6);
  });
```

Y quitar `appreciation_annual: 8,` del helper `unit()` (`:15`).

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run test:unit -- src/lib/lead-magnet/score.test.ts`
Expected: FAIL — hoy `roiPct` trae el +8.

- [ ] **Step 3: Implementar en `score.ts`**

- `:22` — borrar `appreciation_annual: number | null;` de `LeadMagnetUnitInput`.
- `:44` — borrar `export const DEFAULT_APPRECIATION_PCT = 8;`
- `:63` — reemplazar:

```ts
  const roiPct = u.roi_annual ?? grossYieldPct + (u.appreciation_annual ?? DEFAULT_APPRECIATION_PCT);
```

por:

```ts
  // Sin ROI capturado ni del modelo, el proxy es el yield bruto. NO se suma
  // plusvalía: no hay fuente de ese dato (spec 2026-07-27 §D6/§D7).
  const roiPct = u.roi_annual ?? grossYieldPct;
```

- [ ] **Step 4: `edition-data.ts` — usar el resolver**

- `:14-17` — quitar `'appreciation_annual'` de `UNIT_NUMERIC_KEYS`.
- `:62-83` — reemplazar `fillEstimatedRent` por una versión que delegue en el resolver, conservando su firma para no tocar a los llamadores:

```ts
/** Rellena roi_annual y estimated_rent_mxn faltantes usando el resolver común
 *  (manual → ML por recámaras → modelo de desarrollo). El valor nativo de
 *  v_units gana cuando existe. Decisión Luis 2026-07-23: sin el cruce con ML el
 *  pool elegible era 1/54 unidades. */
export function fillEstimatedRent(
  units: LeadMagnetUnitInput[],
  ml: RentalMlEstimateRow[],
  financials?: Map<string, DevFinancialsSlice>,
): LeadMagnetUnitInput[] {
  const byKey = new Map<string, number>();
  for (const m of ml) {
    if (m.estimated_rent_residencial != null && m.estimated_rent_residencial > 0 && m.bedrooms != null) {
      byKey.set(`${m.development_id}|${m.bedrooms}`, m.estimated_rent_residencial);
    }
  }
  return units.map((u) => {
    const mlRent = u.development_id != null && u.bedrooms != null
      ? byKey.get(`${u.development_id}|${u.bedrooms}`) ?? null
      : null;
    const r = resolveUnitInvestment(u, financials?.get(u.development_id ?? '') ?? null, mlRent);
    return { ...u, roi_annual: r.roiPct, estimated_rent_mxn: r.rentMonthly };
  });
}
```

con los imports `resolveUnitInvestment` y `type DevFinancialsSlice` de `@/lib/investment/resolve`.

En `buildEditionData` (`:86-95`), agregar `getFinancialsMap` al `Promise.all` (usando los `development_id` del pool) y pasarlo como tercer argumento. Los tests existentes de `edition-data.test.ts` que llaman con 2 argumentos siguen compilando porque el tercero es opcional.

- [ ] **Step 5: Correr toda la suite**

Run: `npm run test:unit`
Expected: PASS. Si `edition-data.test.ts:38-40` falla, revisar: el resolver ahora **también** rellena `roi_annual`, así que las aserciones de `estimated_rent_mxn` deben seguir valiendo lo mismo. Si un caso esperaba `null` y ahora trae número, es porque el mock inyecta financials: ajustar el mock, no el resolver.

- [ ] **Step 6: Commit**

```bash
git add src/lib/lead-magnet/
git commit -m "fix(lead-magnet): el score deja de sumar un 8% de plusvalía inventado"
```

---

### Task 14: Comparativa Top 10 antes/después

**Files:**
- Create: `<scratchpad>/top10-diff.mjs` (script desechable, NO va al repo)

- [ ] **Step 1: Generar el Top 10 nuevo**

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
" # o, más simple: usar el endpoint del lead magnet ya existente contra la BD de prod en modo lectura
```

Camino recomendado, sin escribir scripts nuevos: correr `npm start` y pegarle al endpoint que genera la edición del lead magnet en modo preview, guardando el JSON:

```bash
curl -s "localhost:3000/api/lead-magnet/preview" > /tmp/top10-nuevo.json
```

Si ese endpoint no existe, generar la edición con el mismo `buildEditionData` desde un script en el scratchpad, apuntando a prod con la anon key (**solo lectura**).

- [ ] **Step 2: Generar el Top 10 anterior**

```bash
git stash && npm run build && npm start
curl -s "localhost:3000/api/lead-magnet/preview" > /tmp/top10-viejo.json
git stash pop
```

- [ ] **Step 3: Tabla comparativa para Luis**

Emitir una tabla con: posición, slug, desarrollo, ciudad, `roiPct` antes, `roiPct` después, y el delta de posición. **No deployar hasta que Luis la valide.**

- [ ] **Step 4: Commit** — nada que commitear (script desechable en el scratchpad).

---

### Task 15: Gates finales

- [ ] **Step 1: Estáticos**

```bash
npx tsc --noEmit
npm run lint
npm run test:unit
rm -rf .next/cache && npm run build
```
Expected: los cuatro verdes. El `rm -rf .next/cache` importa: sin eso el build puede servir artefactos viejos y dar un verde falso.

- [ ] **Step 2: Runtime — el gate que un build verde no cubre**

```bash
npm start
```

Verificar a mano:

| Ruta | Qué confirmar |
|---|---|
| `/es/propiedades` | hay cards con badge de ROI y cards sin badge; ninguna muestra `ROI 0%` |
| `/es/propiedades?roiMin=8` | ninguna unidad **sin** dato de ROI aparece en los resultados |
| detalle de unidad con financials | ROI visible; slider de plusvalía en 5% con su nota |
| detalle de unidad sin financials | sin métrica de ROI, sin `0%` ni `—` |
| ficha PDF | ROI impreso + nota del supuesto (verificar renderizando a imagen) |

- [ ] **Step 3: Confirmar que el tsc de Task 3 quedó limpio**

Run: `npx tsc --noEmit 2>&1 | wc -l`
Expected: `0`.

- [ ] **Step 4: Reportar a Luis antes de push**

Push a `main` dispara el auto-deploy de Hostinger sin gate de CI. No hacer push sin la validación del Top 10 (Task 14) y de la tabla de runtime.

---

## Self-review

**Cobertura del spec:**

| Requisito | Task |
|---|---|
| D1 capa de app, sin DDL | 1, 4 (el mapper recibe por parámetro; ninguna task toca la view) |
| D2 precedencia de ROI | 1 |
| D3 precedencia de renta (con ML) | 1, 13 |
| D4 residencial siempre | 1 (`DevFinancialsSlice` solo expone residencial) |
| D5 sin dato ⇒ no se muestra | 3, 4, 8, 9 |
| D6 plusvalía fuera; supuesto 5% rotulado | 2, 8, 10, 11 |
| D7 score sin plusvalía + antes/después | 13, 14 |
| D8 borrar PriceTimeline | 12 |
| D9 constante `VAC_RENT_UPLIFT` rotulada | 2, 10 |
| §3.2 coerción del batch | 5 |
| §3.4 bug de `null < roiMin` | 9 |
| §3.5 etiquetado del dato | 10, 11 |
| §4 errores ⇒ ausencia, nunca número | 1 (`usable`), 4 (`?? null`) |
| §5 gates | 15 |

**Consistencia de tipos:** `ResolvedInvestment` / `DevFinancialsSlice` / `resolveUnitInvestment` se definen en Task 1 y se usan con esos mismos nombres en Tasks 4, 6, 7, 11 y 13. `getFinancialsMap` se define en Task 5 y se consume en 6, 7 y 13. `APPRECIATION_ASSUMPTION_PCT` y `VAC_RENT_UPLIFT` se definen en Task 2 y se consumen en 10 y 11.

**Riesgos conocidos:**

1. **Task 6 Step 1** asume el nombre del cliente Supabase en cada page. Si difiere, usar el local — está anotado en el step.
2. **Task 11** asume que `generate-pdf` puede obtener financials en ese scope. Si el route no tiene el cliente a mano, pasar `null` y dejar el PDF sin ROI antes que inventar el número.
3. **Task 14** depende de que exista un endpoint de preview del lead magnet. Si no existe, el fallback es un script en el scratchpad — nunca uno commiteado al repo.
