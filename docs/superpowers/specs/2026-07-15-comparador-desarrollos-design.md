# Comparador de desarrollos/unidades — Diseño

**Fecha:** 2026-07-15
**Proyecto:** Next_Propyte_web (propyte.com)
**Origen:** Punto 1 de la auditoría surselecto.com vs propyte.com (2026-07-14). Sur Selecto tiene un comparador como feature diferenciadora, pero con datos flojos; la oportunidad es hacerlo bien con nuestros datos AirDNA reales.

## Objetivo

Extender el comparador **ya existente** en el repo para que, además de las filas actuales (precio, ubicación, amenidades, tipo), muestre las 4 filas que lo vuelven un instrumento de inversión real:

1. **Precio por m²**
2. **Ocupación de zona** (AirDNA)
3. **ADR de zona** (AirDNA)
4. **ROI proyectado** — calculado en vivo desde ocupación × ADR de la zona

No se construye desde cero. Se reusa la infraestructura existente.

## Lo que ya existe (no se toca la base)

- `src/hooks/useCompare.ts` — store en localStorage (`propyte:compare`), hasta 4 items, discriminador `kind: 'unit' | 'development'`, reset cross-kind.
- `src/components/marketplace/ComparePanel.tsx` — barra sticky + modal con tabla comparativa (precio, ubicación, amenidades, tipo).
- `src/components/marketplace/MarketplaceCard.tsx` — botón `GitCompare` por card, montado en `/desarrollos` y `/propiedades`.
- `src/lib/calculator.ts` — funciones puras de ROI/yield/RevPAR/cap-rate ya listas.
- `src/lib/supabase/queries.ts` — `getDevelopmentWithUnits`, `getUnits`, `getAirdnaMarketSummary`.
- i18n namespace `marketplace` (`src/i18n/messages/{es,en}.json`) con keys ya sembradas sin usar: `compareArea`, `compareRoi`, `compareCapRate`.

## Decisiones (confirmadas con Luis)

| Decisión | Elección |
|---|---|
| Formato | **Mejorar el modal actual** (no página dedicada) |
| Filas nuevas | Precio/m², Ocupación zona, ADR zona, ROI proyectado (las 4) |
| Fuente ROI | **Calculado en vivo con AirDNA** (ocupación × ADR → yield) |
| Feature-flag `DESARROLLOS_COMPARE` | **No gatear** — siempre visible (se puede gatear después) |

## Arquitectura

### Problema a resolver
El modal hoy renderiza desde los datos que ya trae la card. Ocupación/ADR de zona y el ROI calculado **no están** en ese payload. Meterlos en cada card infla el listado (AirDNA es una query por market). Solución: traerlos **on-demand al abrir el modal**, vía un endpoint dedicado.

### Flujo de datos
```
useCompare (localStorage: ids[] + kind)
        │  al abrir el modal
        ▼
GET /api/compare?kind=development|unit&ids=a,b,c
        │  (server)
        ▼
buildComparison(client, kind, ids) ──> ComparisonPayload
        │
        ├─ queries.ts: datos base + unidades (para precio/m² de desarrollos)
        ├─ queries.ts: getAirdnaMarketSummary(market)  [cache por market en el request]
        └─ calculator.ts: ROI/yield desde ADR+ocupación
        ▼
ComparePanel renderiza filas (skeleton mientras carga; "—" por métrica ausente)
```

### Componentes nuevos

- **`src/app/api/compare/route.ts`** — handler GET. Valida `kind` (enum) e `ids` (2–4, split por coma) con zod. Llama `buildComparison`. Devuelve `ComparisonPayload` JSON. Nunca 500 por métrica faltante: devuelve datos parciales por item. Locale-agnóstico (bajo `src/app/api/`, patrón de `/api/leads`, `/api/generate-pdf`).

- **`src/lib/compare/build-comparison.ts`** — orquestador server-side. Recibe supabase client + kind + ids. Trae items, resuelve zona→AirDNA (con cache por market dentro del request), calcula métricas. Devuelve `ComparisonPayload`.

- **`src/lib/compare/metrics.ts`** — **funciones puras** (unit-verificables sin red):
  - `pricePerM2(item, units)` → number | null
  - `resolveZoneAirdna(item, marketSummary)` → `{ occupancy, adr } | null`
  - `projectedVacationRoi({ price, adr, occupancy, state })` → `{ netYieldPct, annualNetRent } | null` (reusa `calculator.ts`)

- **`src/types/compare.ts`** (o dentro de la lib) — `ComparisonItem`, `ComparisonPayload`, `ComparisonMetric`.

### Componentes modificados

- **`src/components/marketplace/ComparePanel.tsx`** — al abrir el modal, `fetch('/api/compare?...')`. Estados: `loading` (skeleton de filas), `error` (mensaje + reintento), `ok`. Agrega las 4 filas nuevas a la tabla. Formateo con formatters compartidos: moneda MXN/USD según `CurrencyContext`, % por locale. Opcional (no bloqueante): resaltar el mejor valor por fila.

- **`src/i18n/messages/{es,en}.json`** — extender namespace `marketplace`: reusar `compareArea`/`compareRoi`; agregar `comparePricePerM2`, `compareOccupancy`, `compareAdr`, `compareLoading`, `compareError`, `compareRetry`, `compareMetricUnavailable` ("—" con tooltip opcional).

## Definiciones de cálculo (explícitas, para comparabilidad)

Todas las métricas se calculan en **MXN**; el display convierte a USD vía `CurrencyContext`. Para que la comparación sea justa entre items se usan supuestos idénticos y **sin apalancamiento** (all-cash), documentados en la UI como nota al pie.

- **Precio base:** desarrollo → `price_min_mxn` (precio de entrada); unidad → `price_mxn`.
- **Precio/m²:**
  - Unidad → `price_mxn / area_m2` (si `area_m2 > 0`, si no → `null` → "—").
  - Desarrollo → promedio de (`price_mxn / area_m2`) sobre sus **unidades disponibles** con `area_m2 > 0` (vía `getDevelopmentWithUnits`); sin unidades con área → `null`.
- **Ocupación / ADR de zona:** `item.city → CITY_TO_MARKET_CODE → market → getAirdnaMarketSummary(market)`. Del `summary.zones[]` se hace match a la zona del item (`MARKET_SUBMARKET_TO_ZONE` / nombre normalizado). Fallback: `current_occupancy` / `current_adr` a nivel market si no hay match de zona. Sin AirDNA → `null` en esas 3 filas.
- **ROI proyectado (vacacional, all-cash):**
  - `RevPAR = ADR × (ocupacion/100)`
  - `ingresoBrutoAnual = RevPAR × 365`
  - `ingresoNetoAnual = ingresoBrutoAnual × (1 − costosOperativos)` (usar la función de renta neta vacacional de `calculator.ts`; costos operativos = default del repo)
  - `netYieldPct = ingresoNetoAnual / precioBase × 100`
  - Fila muestra `netYieldPct`. Si falta ADR u ocupación → "—".

## Manejo de errores y casos borde

- **kind mixto:** imposible por diseño de `useCompare` (reset cross-kind). El endpoint recibe un solo `kind`.
- **1 item o >4:** el panel ya limita el rango; el endpoint valida 2–4 y responde 400 si se sale.
- **Item borrado / id inválido:** se omite del payload; el panel muestra los que sí resolvieron.
- **AirDNA ausente para la ciudad/zona:** las filas de ocupación/ADR/ROI muestran "—"; precio y precio/m² siguen visibles. Sin 500.
- **Sin unidades con área (desarrollo):** precio/m² → "—".

## Verificación

⚠️ Este repo **no tiene vitest** — `tsconfig include:**/*.ts` toma los `.test.ts` y romper `tsc`/`next build` al importar `vitest` (decisión documentada en memoria). No hay TDD clásico. Plan de verificación:

1. **Funciones puras** (`metrics.ts`): script scratch en Node (fuera del repo, en scratchpad) que las ejercita con fixtures — no se commitea.
2. `npx tsc --noEmit` = 0.
3. `next build` exit 0.
4. Correr el **standalone local** (patrón anidado de Turbopack) y probar `GET /api/compare` con ids reales.
5. **Smoke Playwright** del modal en `/desarrollos`: seleccionar 2–3, abrir, verificar filas nuevas con datos + estado "—" cuando aplique.

## Fuera de alcance (YAGNI)

- Página dedicada `/comparar` compartible por URL (Luis eligió solo modal).
- Gatear con `DESARROLLOS_COMPARE` (queda siempre visible).
- Resaltado "mejor valor" es opcional, no bloqueante.
- Filas de cap-rate/IRR/RevPAR sueltas (el ROI vacacional ya las resume).
