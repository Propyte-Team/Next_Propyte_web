# Métricas de inversión por unidad — ROI, renta y plusvalía

> Spec A1 del Bloque A. Fecha: 2026-07-27. Repo: `Next_Propyte_web` (propyte.com).
> A2 (`zone_scores` contaminado) y A3 (frescura de `fx_rates`) viven en `propyte-monorepo-scrapers` y tendrán su propio spec.

## 1. Problema

`real_estate_hub.v_units` expone `roi_annual`, `appreciation_annual` y `estimated_rent_mxn` como
passthrough de tres columnas de captura manual del Hub:

| Columna de la view | Origen real | Estado en prod (2026-07-27) |
|---|---|---|
| `roi_annual` | `Propyte_unidades.roi_anual_porcentaje` | NULL en las 1,479 filas |
| `appreciation_annual` | `Propyte_unidades.apreciacion_anual_porcentaje` | NULL en las 1,479 filas |
| `estimated_rent_mxn` | `Propyte_unidades.renta_mensual_estimada_mxn` | 1 fila con dato |

No hay pipeline detrás: son campos que alguien debía teclear y nadie teclea. Lo mismo pasa a nivel
desarrollo — `ext_roi_apreciacion`, `ext_roi_proyectado` y `ext_roi_renta_mensual` están en **0 de 21
desarrollos publicados**.

Consecuencias en el sitio:

- Los badges de ROI de las cards nunca aparecen (`property.roi.projected > 0` siempre es falso).
- Toda proyección cae a un 8% de plusvalía hardcodeado, en **dos** lugares independientes:
  `score.ts:44` (`DEFAULT_APPRECIATION_PCT`) y `generate-pdf/route.ts:195,203` (`|| 8`).
- `roi.projected`/`rentalMonthly` usan `Number(x) || 0`, así que "sin dato" y "cero" son
  indistinguibles para los consumidores.

Mientras tanto, `investment_analytics.development_financials` tiene **197 filas con el 100% de
`roi_annual_pct`, `roi_annual_pct_vac`, `cap_rate`, `rent_yield_*`, IRR y `occupancy_rate_*`**,
recalculadas el 2026-07-25 (ROI residencial 0–8.84%, vacacional 0–9.80%). El sitio ya la consulta en
tres lugares para `/mercado` y para `InvestmentSummary`, pero las cards y el detalle de unidad no la
usan para ROI.

## 2. Decisiones

| # | Decisión | Motivo |
|---|---|---|
| D1 | La resolución vive en la **capa de app**, en un módulo compartido. **Sin DDL** sobre `v_units`. | `v_units` es compartida con el Hub. Un `COALESCE(manual, modelo)` metería un número modelado dentro de un campo de captura manual del admin — alguien lo guarda y se vuelve dato duro — y arriesga viajar a Zoho, donde ya hubo precedente de columnas derivadas filtrándose al CRM. |
| D2 | Precedencia de **ROI**: manual (Hub) → `development_financials` (nivel desarrollo) → `null`. | Única fuente poblada y fresca. El nivel manual queda como override para el futuro aunque hoy no aporte filas. |
| D3 | Precedencia de **renta**: manual (Hub) → `rental_ml_estimates` por `(desarrollo, recámaras)` → `development_financials` (nivel desarrollo) → `null`. | El ML es más granular que el dato de desarrollo, y es lo que el lead magnet ya usa hoy (`edition-data.ts:62-81`). Invertir el orden le quitaría cobertura a algo que ya funciona. |
| D4 | El número único (badge de card) es **siempre residencial**. | `tipo_rendimiento` no sirve para elegir modalidad: sus valores son `Mixto (renta + plusvalía)` (12), `Plusvalía` (5), `Plusvalía pura` (1), `Uso propio` (1), `null` (37) — describe la tesis de inversión, no el tipo de renta. Cero unidades marcadas como vacacional. El residencial es además el conservador. El detalle de unidad conserva su vista dual actual (`RentabilidadTab`, `InvestmentSummary`). |
| D5 | **Sin dato ⇒ no se muestra.** Nada de fallback a ciudad ni de `0` como sentinela. | Cobertura hoy: 26 de las 56 unidades publicadas pertenecen a un desarrollo con fila en `development_financials`. Ocultar es honesto; un número de ciudad presentado como número de unidad, no. |
| D6 | La **plusvalía sale del contenido publicado** (badge de `MarketplaceCard`, `PriceTimeline`) y sobrevive solo como **supuesto editable inicializado en 5%**, rotulado como supuesto y no como proyección de Propyte. El PDF imprime ese supuesto rotulado. | No existe ninguna fuente de plusvalía en la BD y `zone_scores` no tiene serie histórica de precios para derivarla. Un slider que el usuario mueve es un supuesto suyo; un badge es una promesa nuestra. El 5% queda por encima del objetivo de inflación de Banxico sin prometer doble dígito. |
| D7 | El score del lead magnet pasa a `roi_annual ?? modelo ?? grossYield`, **sin sumar plusvalía**. | Elimina el 8% inventado del ranking. Cambia el Top 10: se entrega comparativa antes/después para validar antes de deployar. |

## 3. Arquitectura

### 3.1 Módulo nuevo — `src/lib/investment/resolve.ts`

Lib pura, sin acceso a base de datos, sin i18n. Recibe filas ya coercionadas a `number` (mismo
contrato que `edition-data.ts`).

```ts
export type InvestmentSource = 'manual' | 'model' | 'ml' | 'none';

export interface DevFinancialsSlice {
  roi_annual_pct: number | null;
  estimated_rent_residencial: number | null;
}

export interface ResolvedInvestment {
  roiPct: number | null;        // null = sin dato, NUNCA 0
  rentMonthly: number | null;   // null = sin dato, NUNCA 0
  roiSource: InvestmentSource;
  rentSource: InvestmentSource;
}

export function resolveUnitInvestment(
  unit: { roi_annual: number | null; estimated_rent_mxn: number | null },
  financials: DevFinancialsSlice | null,
  mlRent: number | null,
): ResolvedInvestment;
```

Reglas: un valor `<= 0` o no finito se trata como ausente. `roiSource`/`rentSource` existen para que
el UI pueda rotular la granularidad del dato y para que los tests afirmen la precedencia, no para
mostrarse crudos al usuario.

Constante nueva en `src/shared/constants/`: `APPRECIATION_ASSUMPTION_PCT = 5`, con comentario de que
es un supuesto editable y no un dato de mercado. Es el único lugar donde vive el número.

### 3.2 Flujo de datos

```
Detalle de unidad / desarrollo:
  getDevelopmentFinancials(client, development_id)  ← ya existe (queries.ts:1623)
  getMlRentalEstimateForUnit(...)                   ← ya existe (queries.ts:1646)
      → resolveUnitInvestment(row, fin, mlRent) → mapUnitRowToProperty(row, resolved)

Listados / cards:
  batch de development_financials                   ← ya existe (queries.ts:619, trae
    'development_id, cap_rate, estimated_rent_residencial, roi_annual_pct')
      → Map<development_id, DevFinancialsSlice>
      → resolveUnitInvestment(row, slice, mlRent: null) por fila
        (el ML es una consulta por unidad; en listados se pasa null a propósito —
         las cards solo muestran ROI, no renta)

Lead magnet:
  edition-data.ts reemplaza su relleno ad-hoc por resolveUnitInvestment (mismo resultado
  para renta, más cobertura de ROI).
```

El batch de `queries.ts:619` ya selecciona exactamente las dos columnas que el resolver necesita, así
que no requiere cambio de query. **A verificar en implementación**; si el select no alcanza, se
extiende ahí y no en un cuarto camino nuevo.

### 3.3 Cambios de tipos — el compilador hace la auditoría

En `src/types/property.ts`:

```ts
roi: {
  projected: number | null;      // era number
  rentalMonthly: number | null;  // era number
  // appreciation: number;       ← se elimina
}
```

Quitar el campo (en vez de dejarlo siempre en `null`) obliga a `tsc --noEmit` a enumerar cada
consumidor. Consumidores conocidos a tocar:

| Archivo | Qué cambia |
|---|---|
| `lib/mappers/unit-to-property.ts:334-338` | emite `null` en vez de `0`; deja de mapear `appreciation` |
| `lib/mappers/development-to-property.ts:326` | igual, sobre `roi_appreciation` |
| `components/ui/PropertyCard.tsx:83-85` | guarda `!= null` en vez de `> 0` |
| `components/marketplace/MarketplaceCard.tsx:435-453` | igual + se elimina el badge de plusvalía |
| `components/property/Highlights.tsx:37-38` | guarda `!= null` antes del `>= 10` |
| `components/property/ContactSidebar.tsx:24` | `??` en vez de `\|\|` |
| `components/property/PriceTimeline.tsx:17-23` | deja de derivar el hito de entrega de la plusvalía |
| `components/property/FinancialSimulator.tsx:50` | slider arranca en `APPRECIATION_ASSUMPTION_PCT` + rótulo |
| `app/[locale]/propiedades/_components/RentabilidadTab.tsx:206` | igual |
| `app/[locale]/propiedades/_components/UnitDetailPage.tsx:158,582,701` | igual |
| `app/api/generate-pdf/route.ts:195,203,240` | mata el `\|\| 8`; imprime el supuesto con su rótulo |
| `hooks/useFilters.ts:194,239` | **ver 3.4** |
| `lib/lead-magnet/score.ts:44,63` | elimina `DEFAULT_APPRECIATION_PCT`; nueva regla de `roiPct` |
| `components/playground/preview/mockProperty.ts:35` | mock al día |

### 3.4 Bug latente que este cambio destapa

`useFilters.ts:194` filtra con `p.roi.projected < filters.roiMin`. Con `projected: null`, JS evalúa
`null < 5` como **verdadero** (coerción a 0), así que las unidades sin dato **pasarían** el filtro de
ROI mínimo en lugar de quedar fuera. Igual en el sort de `:239`, donde `null` arrastraría al fondo por
coerción y no por decisión. Ambos casos se resuelven con guarda explícita de `null` y quedan cubiertos
por test.

### 3.5 Etiquetado en UI

El ROI del modelo es **por desarrollo**, no por unidad. Donde se muestre, se rotula como estimación a
nivel desarrollo, atribuida a "Análisis de mercado Propyte" — nunca al proveedor de datos. Claves i18n
nuevas en `es.json` y `en.json` en el mismo commit.

## 4. Manejo de errores

- Fallo al leer `development_financials` o `rental_ml_estimates` ⇒ se trata como ausencia (`null`), no
  se lanza. El sitio renderiza sin la métrica; nunca sustituye por un número.
- `resolveUnitInvestment` es total: no lanza para ninguna combinación de entradas.
- El PDF sin ROI imprime la sección sin la métrica, no un `0%` ni un `—` numérico.

## 5. Testing

Unitarios (vitest):

- `resolve.test.ts`: precedencia de ROI (manual > modelo > none), precedencia de renta (manual > ML >
  modelo > none), `0` y negativos tratados como ausentes, desarrollo sin financials, `financials: null`.
- `useFilters`: unidad con `roi.projected: null` **no** pasa `roiMin`; el sort no la coloca por coerción.
- `score.test.ts`: se reescribe el caso de `:26` que hoy afirma el fallback del 8%.

Verificación manual antes de merge:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. `npm test`
5. Runtime con `next start` (no solo build verde): una unidad **con** dato de ROI y una **sin**, en
   card, detalle y PDF.
6. Comparativa Top 10 antes/después del cambio de score, para validación de Luis.

## 6. Fuera de alcance

- DDL o cambios sobre `real_estate_hub.v_units`.
- Backfill de las columnas manuales del Hub.
- Fuente real de plusvalía: requiere serie histórica de precios por zona construida desde las corridas
  de los scrapers. Proyecto aparte.
- A2 (`zone_scores`) y A3 (`fx_rates`): otro repo, otro spec.
