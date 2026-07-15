# Comparador de desarrollos/unidades — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el comparador existente (`ComparePanel`) con 4 filas nuevas — precio/m², ocupación de zona, ADR de zona y ROI vacacional — alimentadas on-demand por un endpoint `/api/compare` que reúne datos AirDNA reales y cálculo de yield.

**Architecture:** El modal client-side sigue leyendo la selección de `useCompare` (localStorage). Al abrirse, hace `fetch` a un endpoint server nuevo que arma el payload comparativo (datos base + unidades para precio/m², AirDNA por zona con cache por market, ROI vía `calculator.ts`). Funciones de métrica puras y aisladas; el endpoint nunca falla por métrica ausente (devuelve `null` → "—").

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl, Supabase (`real_estate_hub`/`investment_analytics`), zod, React (`CurrencyContext`).

**Spec:** `docs/superpowers/specs/2026-07-15-comparador-desarrollos-design.md`

**⚠️ Verificación (sin vitest):** Este repo NO tiene vitest — importar `vitest` rompe `tsc`/`next build`. NO agregar tests `.test.ts` al repo. Verificación de funciones puras = script scratch en Node fuera del repo (`$SCRATCH/verify-*.mjs`). Verificación de integración = `npx tsc --noEmit` + `next build` + standalone local + smoke Playwright.

**Rutas de scratch:** `$SCRATCH` = `C:\Users\Luis\AppData\Local\Temp\claude\c--Users-Luis\<session>\scratchpad`. Ajustar a la sesión activa.

---

## Task 0: Rama de trabajo

**⚠️ Decisión de Luis requerida antes de ejecutar:** El repo está en `feat/analista-zonas-enrich` (trabajo ajeno). El comparador debe ir en rama propia. Base recomendada: `origin/main` (prod). Confirmar con Luis antes de correr, porque implica salir del checkout actual.

- [ ] **Step 1: Crear rama desde main**

```bash
cd /c/Users/Luis/Projects/Propyte/Next_Propyte_web
git fetch origin
git checkout -b feat/comparador-desarrollos origin/main
```
Expected: `Switched to a new branch 'feat/comparador-desarrollos'`

- [ ] **Step 2: Verificar árbol limpio**

Run: `git status --short`
Expected: sin cambios (o solo untracked ajenos no relacionados).

---

## Task 1: Tipos + funciones puras de métrica

**Files:**
- Create: `src/lib/compare/metrics.ts`
- Create: `src/types/compare.ts`
- Verify (scratch, NO commit): `$SCRATCH/verify-metrics.mjs`

**Referencia obligatoria antes de escribir:** leer `src/lib/calculator.ts` para confirmar los nombres/firmas exactos de las funciones de renta vacacional y `getClosingCostRate`, y `src/lib/supabase/queries.ts` (línea ~1504 `getAirdnaMarketSummary`) para la forma exacta de `AirdnaZoneSummary`. El código de abajo asume: `calculateRevPAR(adr, occupancyRate)`, una función de renta neta vacacional, y `getClosingCostRate(state)`. Ajustar nombres a los reales.

- [ ] **Step 1: Definir tipos**

```typescript
// src/types/compare.ts
export type CompareKind = 'development' | 'unit'

export interface ComparisonMetrics {
  pricePerM2: number | null      // MXN por m²
  zoneOccupancy: number | null   // 0-100
  zoneAdr: number | null         // MXN
  roiNetYieldPct: number | null  // % anual, all-cash vacacional
}

export interface ComparisonItem {
  id: string
  kind: CompareKind
  name: string
  slug: string | null
  city: string | null
  zone: string | null
  priceBaseMxn: number | null    // desarrollo: price_min_mxn; unidad: price_mxn
  metrics: ComparisonMetrics
}

export interface ComparisonPayload {
  kind: CompareKind
  items: ComparisonItem[]
}
```

- [ ] **Step 2: Escribir funciones puras**

```typescript
// src/lib/compare/metrics.ts
import { calculateRevPAR, getClosingCostRate } from '@/lib/calculator'

/** Fila raw de AirDNA por zona (forma de getAirdnaMarketSummary().zones[]). */
export interface ZoneAirdnaRow {
  zone: string
  submarket: string
  occupancy: number | null // 0-100
  adr: number | null       // MXN
}

/** precio/m² de una sola unidad. null si falta área o precio. */
export function unitPricePerM2(priceMxn: number | null, areaM2: number | null): number | null {
  if (!priceMxn || !areaM2 || areaM2 <= 0) return null
  return priceMxn / areaM2
}

/** precio/m² de un desarrollo = promedio de (precio/m²) de sus unidades con área>0. */
export function developmentPricePerM2(
  units: Array<{ priceMxn: number | null; areaM2: number | null }>
): number | null {
  const values = units
    .map((u) => unitPricePerM2(u.priceMxn, u.areaM2))
    .filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Resuelve ocupación/ADR de la zona del item; fallback a nivel market. */
export function resolveZoneAirdna(
  itemZone: string | null,
  zones: ZoneAirdnaRow[],
  marketFallback: { occupancy: number | null; adr: number | null }
): { occupancy: number | null; adr: number | null } {
  if (itemZone) {
    const norm = (s: string) => s.trim().toLowerCase()
    const match = zones.find((z) => norm(z.zone) === norm(itemZone))
    if (match && (match.occupancy !== null || match.adr !== null)) {
      return { occupancy: match.occupancy, adr: match.adr }
    }
  }
  return marketFallback
}

/**
 * ROI vacacional all-cash (comparabilidad justa, sin apalancamiento).
 * netYieldPct = (RevPAR*365*(1-opCost)) / precio * 100
 */
export function projectedVacationRoi(params: {
  priceMxn: number | null
  adr: number | null
  occupancyPct: number | null // 0-100
  state: string | null
}): number | null {
  const { priceMxn, adr, occupancyPct, state } = params
  if (!priceMxn || priceMxn <= 0 || !adr || occupancyPct === null) return null
  const revpar = calculateRevPAR(adr, occupancyPct / 100) // MXN/noche
  const grossAnnual = revpar * 365
  // costos operativos vacacional: usar constante del repo si existe; default 0.35
  const opCostRate = 0.35
  const netAnnual = grossAnnual * (1 - opCostRate)
  return (netAnnual / priceMxn) * 100
}
```

- [ ] **Step 3: Verificar funciones puras (scratch, NO commit)**

Crear `$SCRATCH/verify-metrics.mjs` que replique las 4 funciones (o importe compilando) y ejercite fixtures:
```javascript
// Ejemplos esperados:
// unitPricePerM2(3_000_000, 60) === 50_000
// unitPricePerM2(3_000_000, 0) === null
// developmentPricePerM2([{priceMxn:3e6,areaM2:60},{priceMxn:4e6,areaM2:80}]) === 50000
// resolveZoneAirdna('Aldea Zama', [{zone:'Aldea Zama',occupancy:80,adr:2000}], {occupancy:null,adr:null}) → {80,2000}
// projectedVacationRoi({priceMxn:3e6,adr:2000,occupancyPct:70,state:'Quintana Roo'}) ≈ ((2000*0.7*365*0.65)/3e6)*100 ≈ 11.07
console.assert(...)
```
Run: `node $SCRATCH/verify-metrics.mjs`
Expected: sin AssertionError.

- [ ] **Step 4: tsc**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/compare/metrics.ts src/types/compare.ts
git commit -m "feat(compare): tipos y funciones puras de metricas del comparador"
```

---

## Task 2: Orquestador server `buildComparison`

**Files:**
- Create: `src/lib/compare/build-comparison.ts`

**Referencia obligatoria antes de escribir:** leer en `src/lib/supabase/queries.ts` las firmas exactas de `getDevelopmentWithUnits`, `getUnits`, `getAirdnaMarketSummary`; y en `src/lib/calculator.ts` el mapa `CITY_TO_MARKET_CODE`. Ajustar imports/firmas a lo real. El mapeo de fila→campos (price_min_mxn, area_m2, etc.) está en `src/lib/mappers/{development,unit}-to-property.ts`.

- [ ] **Step 1: Escribir el orquestador**

```typescript
// src/lib/compare/build-comparison.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { CITY_TO_MARKET_CODE } from '@/lib/calculator'
import { getAirdnaMarketSummary, getDevelopmentWithUnits, getUnits } from '@/lib/supabase/queries'
import {
  developmentPricePerM2,
  projectedVacationRoi,
  resolveZoneAirdna,
  unitPricePerM2,
  type ZoneAirdnaRow,
} from '@/lib/compare/metrics'
import type { CompareKind, ComparisonItem, ComparisonPayload } from '@/types/compare'

type MarketSummary = {
  current_occupancy: number | null
  current_adr: number | null
  zones: ZoneAirdnaRow[]
} | null

/** Trae y cachea el resumen AirDNA por market dentro de un solo request. */
async function airdnaResolver(client: SupabaseClient) {
  const cache = new Map<string, MarketSummary>()
  return async (city: string | null): Promise<MarketSummary> => {
    if (!city) return null
    const market = CITY_TO_MARKET_CODE[city]
    if (!market) return null
    if (cache.has(market)) return cache.get(market)!
    let summary: MarketSummary = null
    try {
      const raw = await getAirdnaMarketSummary(client, market)
      summary = raw
        ? { current_occupancy: raw.current_occupancy, current_adr: raw.current_adr, zones: raw.zones ?? [] }
        : null
    } catch {
      summary = null
    }
    cache.set(market, summary)
    return summary
  }
}

export async function buildComparison(
  client: SupabaseClient,
  kind: CompareKind,
  ids: string[]
): Promise<ComparisonPayload> {
  const getAirdna = await airdnaResolver(client)

  const items = await Promise.all(
    ids.map(async (id): Promise<ComparisonItem | null> => {
      if (kind === 'development') {
        const dev = await getDevelopmentWithUnits(client, id) // {development, units}
        if (!dev?.development) return null
        const d = dev.development
        const pricePerM2 = developmentPricePerM2(
          (dev.units ?? []).map((u) => ({ priceMxn: u.price_mxn ?? null, areaM2: u.area_m2 ?? null }))
        )
        const summary = await getAirdna(d.city)
        const { occupancy, adr } = resolveZoneAirdna(
          d.zone,
          summary?.zones ?? [],
          { occupancy: summary?.current_occupancy ?? null, adr: summary?.current_adr ?? null }
        )
        const priceBaseMxn = d.price_min_mxn ?? null
        return {
          id,
          kind,
          name: d.name,
          slug: d.slug ?? null,
          city: d.city ?? null,
          zone: d.zone ?? null,
          priceBaseMxn,
          metrics: {
            pricePerM2,
            zoneOccupancy: occupancy,
            zoneAdr: adr,
            roiNetYieldPct: projectedVacationRoi({ priceMxn: priceBaseMxn, adr, occupancyPct: occupancy, state: d.state ?? null }),
          },
        }
      } else {
        const units = await getUnits(client, { /* filtro por id: ver firma real */ } as never)
        const u = units.find((x) => String(x.id) === id)
        if (!u) return null
        const pricePerM2 = unitPricePerM2(u.price_mxn ?? null, u.area_m2 ?? null)
        const summary = await getAirdna(u.city ?? null)
        const { occupancy, adr } = resolveZoneAirdna(
          u.zone ?? null,
          summary?.zones ?? [],
          { occupancy: summary?.current_occupancy ?? null, adr: summary?.current_adr ?? null }
        )
        const priceBaseMxn = u.price_mxn ?? null
        return {
          id,
          kind,
          name: u.name ?? u.unit_type ?? id,
          slug: u.slug ?? null,
          city: u.city ?? null,
          zone: u.zone ?? null,
          priceBaseMxn,
          metrics: {
            pricePerM2,
            zoneOccupancy: occupancy,
            zoneAdr: adr,
            roiNetYieldPct: projectedVacationRoi({ priceMxn: priceBaseMxn, adr, occupancyPct: occupancy, state: u.state ?? null }),
          },
        }
      }
    })
  )

  return { kind, items: items.filter((x): x is ComparisonItem => x !== null) }
}
```

**Nota de implementación:** la obtención de unidades por id (rama `unit`) depende de la firma real de `getUnits`/mappers. Si no hay un `getUnitById`, resolver por `getUnits({ ids })` o crear un helper mínimo en queries.ts que filtre `v_units` por `id IN (...)`. Documentar en el commit cuál se usó.

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: exit 0. Corregir cualquier desajuste de firma contra queries.ts real.

- [ ] **Step 3: Commit**

```bash
git add src/lib/compare/build-comparison.ts src/lib/supabase/queries.ts
git commit -m "feat(compare): orquestador buildComparison con AirDNA cacheado por market"
```

---

## Task 3: Endpoint `GET /api/compare`

**Files:**
- Create: `src/app/api/compare/route.ts`

**Referencia obligatoria:** leer un route existente (ej. `src/app/api/leads/route.ts`) para copiar el patrón de creación del Supabase client server-side (probablemente `createPublicSupabaseClient` o el server client con cookies) y el estilo de respuesta.

- [ ] **Step 1: Escribir el handler**

```typescript
// src/app/api/compare/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPublicSupabaseClient } from '@/lib/supabase/server' // ← confirmar helper real
import { buildComparison } from '@/lib/compare/build-comparison'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  kind: z.enum(['development', 'unit']),
  ids: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .refine((arr) => arr.length >= 2 && arr.length <= 4, {
      message: 'Se requieren entre 2 y 4 ids',
    }),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    kind: searchParams.get('kind'),
    ids: searchParams.get('ids') ?? '',
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const client = createPublicSupabaseClient()
  const payload = await buildComparison(client, parsed.data.kind, parsed.data.ids)
  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
}
```

- [ ] **Step 2: tsc + build**

Run: `npx tsc --noEmit && npx next build`
Expected: exit 0 en ambos. (Recordar: un route de App Router SOLO exporta handlers/`dynamic` — no exportar helpers desde route.ts o `next build` truena.)

- [ ] **Step 3: Verificar en standalone local**

Levantar el standalone (patrón anidado Turbopack, ver memoria del proyecto) y probar:
```bash
curl "http://127.0.0.1:3000/api/compare?kind=development&ids=<slug1>,<slug2>"
```
Expected: 200 con JSON `{ kind, items: [...] }`, cada item con `metrics`. Probar también `ids` inválido → 400, y una ciudad sin AirDNA → métricas `null` sin 500.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/compare/route.ts
git commit -m "feat(compare): endpoint GET /api/compare con validacion zod"
```

---

## Task 4: Strings i18n

**Files:**
- Modify: `src/i18n/messages/es.json` (namespace `marketplace`)
- Modify: `src/i18n/messages/en.json` (namespace `marketplace`)

- [ ] **Step 1: Agregar keys al namespace `marketplace` (es.json)**

```json
"comparePricePerM2": "Precio por m²",
"compareOccupancy": "Ocupación de zona",
"compareAdr": "Tarifa diaria (ADR)",
"compareRoi": "ROI proyectado (anual)",
"compareLoading": "Calculando comparación…",
"compareError": "No se pudo cargar la comparación",
"compareRetry": "Reintentar",
"compareMetricUnavailable": "—",
"compareAllCashNote": "ROI vacacional estimado, sin apalancamiento, con ocupación y ADR reales de la zona."
```
(Reusar `compareRoi` si ya existe; no duplicar.)

- [ ] **Step 2: Agregar las mismas keys en en.json (traducidas)**

```json
"comparePricePerM2": "Price per m²",
"compareOccupancy": "Zone occupancy",
"compareAdr": "Average daily rate (ADR)",
"compareRoi": "Projected ROI (annual)",
"compareLoading": "Calculating comparison…",
"compareError": "Couldn't load the comparison",
"compareRetry": "Retry",
"compareMetricUnavailable": "—",
"compareAllCashNote": "Estimated all-cash vacation ROI, using the zone's real occupancy and ADR."
```

- [ ] **Step 3: Verificar paridad de keys**

Run (o script scratch): comparar que `marketplace` tenga el mismo set de keys en es/en.
Expected: mismo conteo, sin faltantes.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(compare): i18n filas nuevas del comparador (es/en)"
```

---

## Task 5: Extender `ComparePanel` (fetch + filas nuevas)

**Files:**
- Modify: `src/components/marketplace/ComparePanel.tsx`

**Referencia obligatoria antes de editar:** leer el `ComparePanel.tsx` completo para entender cómo lee la selección (`useCompare`), cómo estructura la tabla actual (filas precio/ubicación/amenidades/tipo), y cómo se formatea la moneda (¿usa `useCurrency`/`CurrencyContext`?). Seguir ese patrón exacto.

- [ ] **Step 1: Agregar estado de fetch al abrir el modal**

Al abrir el modal, con `items` de `useCompare` (ids + kind), hacer fetch:
```typescript
const [data, setData] = useState<ComparisonPayload | null>(null)
const [state, setState] = useState<'idle' | 'loading' | 'error' | 'ok'>('idle')

useEffect(() => {
  if (!open || items.length < 2) return
  const kind = items[0].kind
  const ids = items.map((i) => i.id).join(',')
  const controller = new AbortController()
  setState('loading')
  fetch(`/api/compare?kind=${kind}&ids=${encodeURIComponent(ids)}`, { signal: controller.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject(r)))
    .then((payload: ComparisonPayload) => { setData(payload); setState('ok') })
    .catch((e) => { if (e?.name !== 'AbortError') setState('error') })
  return () => controller.abort()
}, [open, items])
```

- [ ] **Step 2: Renderizar estados loading/error**

- `loading` → skeleton de filas (reusar el patrón de skeleton del repo si existe, o filas con pulse).
- `error` → `t('compareError')` + botón `t('compareRetry')` que re-dispara el effect (bump de un `retryKey`).

- [ ] **Step 3: Agregar las 4 filas nuevas a la tabla**

Para cada item, ubicar su métrica por `id` en `data.items`. Formatear:
- Precio/m²: moneda por `CurrencyContext` + `/m²`. `null` → `t('compareMetricUnavailable')`.
- Ocupación: `${value.toFixed(0)}%`.
- ADR: moneda por `CurrencyContext`.
- ROI: `${value.toFixed(1)}%` + nota al pie `t('compareAllCashNote')`.

Usar las keys de Task 4 para los labels de fila. Mantener el mismo markup/clases que las filas existentes.

- [ ] **Step 4: tsc + build**

Run: `npx tsc --noEmit && npx next build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketplace/ComparePanel.tsx
git commit -m "feat(compare): filas precio/m2, ocupacion, ADR y ROI en el modal comparador"
```

---

## Task 6: Verificación end-to-end (standalone + Playwright)

**Files:** ninguno (verificación).

- [ ] **Step 1: Build + standalone**

Run: `npx next build` y levantar el standalone local en `127.0.0.1:3000`.
Expected: build exit 0; home + `/desarrollos` = 200.

- [ ] **Step 2: Smoke Playwright del comparador**

En `/es/desarrollos`: seleccionar 2–3 desarrollos con el botón comparar → abrir el modal → verificar:
- Aparecen las 4 filas nuevas.
- Al menos un item muestra ocupación/ADR/ROI con datos reales (ej. una zona de Tulum/Cancún).
- Un item de ciudad sin AirDNA muestra "—" en esas filas pero SÍ precio y precio/m².
- Cambiar moneda MXN↔USD reformatea precio/m² y ADR.
- Repetir en `/en/desarrollos` (labels en inglés).

- [ ] **Step 3: Verificar API directo**

Run: `curl "http://127.0.0.1:3000/api/compare?kind=development&ids=<a>,<b>,<c>"`
Expected: 200, JSON con métricas; `ids` con 1 solo elemento → 400.

- [ ] **Step 4: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "chore(compare): ajustes de verificacion e2e"
```

---

## Notas de deploy (fuera de este plan, decisión de Luis)

- El sitio despliega desde `main` (Hostinger auto-deploy). NO push a main sin OK explícito.
- Cambios de runtime (endpoint nuevo + fetch) NO van a prod sin validar en standalone local — `next build` verde ≠ runtime-safe (lección documentada). El plan ya valida standalone en Task 6.
- Al terminar: PR de `feat/comparador-desarrollos` o push a main según indique Luis.
