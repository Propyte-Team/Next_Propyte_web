# Slice 6 — Rentabilidad: desglose ROI + origen de datos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** La pestaña Rentabilidad EXPLICA y DESARROLLA por propiedad: Proyección con desglose año-a-año (paridad exacta con la gráfica) y tablas "Origen de los datos" en Residencial/Vacacional (fuente = "Análisis de mercado Propyte", SIN nombrar proveedores). Solo presentación — no cambia cálculos.

**Architecture:** Componente presentacional `DataSourceTable` (reutilizable) + desglose año-a-año inline en `ProyeccionPanel` (o `rentabilidad/ProjectionBreakdown.tsx`). Reusa `calculateProjectedValue`/`projectedTotalReturn`. i18n namespace `simulator`.

**Tech Stack:** TS, Next.js App Router, Tailwind, next-intl. No test runner → `tsc`+`build`+probe SSR (Tabs renderiza solo panel activo → montar panel directo). Git author propyte, rutas explícitas, sin push. Repo web `Next_Propyte_web_unidades` (rama `feat/unidades-rediseno`).

**RESTRICCIÓN:** ningún string nombra proveedores externos (AirDNA/AirROI/etc.). Fuente = "Análisis de mercado Propyte" / "Estimación Propyte" / "Cálculo Propyte". Validar con grep.

**Decomposición (leída de `calculator.ts`, paridad exacta):**
- `Valor propiedad(y) = calculateProjectedValue(price, appr, y)` = round(price·(1+appr/100)^y)
- `Rentas netas acum(y) = annualNet · y`
- `Retorno total(y) = (Valor propiedad(y) − price) + Rentas netas acum(y)`
- `Retorno %(y) = projectedTotalReturn(price, appr, annualNet, y)` = Retorno total(y)/price·100
- Año 10 Valor propiedad == "Valor proyectado (10 años)" ya mostrado; Retorno % año 5/10 == hitos.

---

## Task 1: i18n keys (`simulator`, es + en paridad)

- [ ] **Step 1:** Add to `src/i18n/messages/es.json` namespace `simulator`:
```jsonc
"breakdownTitle": "Desglose año por año",
"breakdownExplain": "El retorno combina plusvalía (apreciación) más rentas netas acumuladas. No incluye financiamiento.",
"colYear": "Año",
"colPropertyValue": "Valor propiedad",
"colRentsAccum": "Rentas netas acumuladas",
"colTotalReturn": "Retorno total",
"colReturnPct": "Retorno %",
"dataSourceTitle": "Origen de los datos",
"dsData": "Dato", "dsValue": "Valor", "dsSource": "Fuente", "dsPeriod": "Periodo",
"sourcePropyte": "Análisis de mercado Propyte",
"sourceEstimate": "Estimación Propyte",
"sourceCalc": "Cálculo Propyte",
"period12m": "últimos 12 meses",
"periodRecent": "análisis reciente",
"noteCityLevel": "* Algunos indicadores son referencia a nivel ciudad.",
"rowMonthlyRent": "Renta mensual (mediana)",
"rowOccupancyAssumed": "Ocupación asumida",
"rowYields": "Rendimiento bruto / neto / cap rate",
"rowAdr": "Tarifa diaria (ADR)",
"rowOccupancy": "Ocupación",
"rowRevpar": "RevPAR",
"rowEstIncome": "Ingreso mensual estimado"
```
- [ ] **Step 2:** Add the SAME keys to `en.json` (English): "Year-by-year breakdown" / "Return combines appreciation plus accumulated net rents. Financing not included." / "Year"/"Property value"/"Accumulated net rents"/"Total return"/"Return %" / "Data source"/"Data"/"Value"/"Source"/"Period" / "Propyte market analysis"/"Propyte estimate"/"Propyte calculation"/"last 12 months"/"recent analysis"/"* Some indicators are city-level references." / "Monthly rent (median)"/"Assumed occupancy"/"Gross / net yield / cap rate"/"Daily rate (ADR)"/"Occupancy"/"RevPAR"/"Estimated monthly income".
- [ ] **Step 3:** Parity: `node -e "const es=require('./src/i18n/messages/es.json').simulator,en=require('./src/i18n/messages/en.json').simulator;const a=Object.keys(es),b=Object.keys(en);const m=a.filter(k=>!(k in en)).concat(b.filter(k=>!(k in es)));console.log(m.length?'MISMATCH '+m:'OK')"` → OK.
- [ ] **Step 4:** Commit both json — `i18n(unidades): strings desglose ROI + origen de datos (es/en)`.

## Task 2: `DataSourceTable` (presentacional)

**Create:** `src/app/[locale]/propiedades/_components/rentabilidad/DataSourceTable.tsx`
- [ ] **Step 1:**
```tsx
'use client';
import { useTranslations } from 'next-intl';

export interface DataSourceRow { label: string; value: string; source: string; period?: string; }

export default function DataSourceTable({ rows, footnote }: { rows: DataSourceRow[]; footnote?: string }) {
  const t = useTranslations('simulator');
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 text-2xs font-semibold uppercase tracking-wider text-gray-600">{t('dataSourceTitle')}</div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="px-3 py-1.5 font-medium">{t('dsData')}</th>
            <th className="px-3 py-1.5 font-medium">{t('dsValue')}</th>
            <th className="px-3 py-1.5 font-medium">{t('dsSource')}</th>
            <th className="px-3 py-1.5 font-medium">{t('dsPeriod')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-3 py-1.5 text-gray-700">{r.label}</td>
              <td className="px-3 py-1.5 font-semibold text-[#1A2F3F]">{r.value}</td>
              <td className="px-3 py-1.5 text-gray-600">{r.source}</td>
              <td className="px-3 py-1.5 text-gray-500">{r.period ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote && <div className="px-3 py-1.5 text-2xs text-gray-500 border-t border-gray-100">{footnote}</div>}
    </div>
  );
}
```
- [ ] **Step 2:** `tsc --noEmit` clean. Commit.

## Task 3: Tablas de origen en Residencial + Vacacional (`RentabilidadTab.tsx`)

- [ ] **Step 1:** Import `DataSourceTable`. In `ResidencialPanel`, after the yields grid + before/after `ZoneComparison`, build rows (using `t` + `formatPrice`/`formatPercentage`):
  - `{ label: t('rowMonthlyRent'), value: formatPrice(grossRent), source: t('sourcePropyte'), period: t('periodRecent') }`
  - `{ label: t('rowOccupancyAssumed'), value: `${Math.round(RES.OCCUPANCY*100)}%`, source: t('sourceEstimate') }`
  - `{ label: t('rowYields'), value: `${formatPercentage(grossYield)} / ${formatPercentage(netYield)} / ${formatPercentage(capRate)}`, source: t('sourceCalc') }`
  - Render `<DataSourceTable rows={...} footnote={t('noteCityLevel')} />`. (Pass the needed values as props to ResidencialPanel; RES is importable from calculator.)
- [ ] **Step 2:** In `VacacionalPanel`, rows:
  - `{ label: t('rowAdr'), value: adr!=null?formatPrice(adr):'—', source: t('sourcePropyte'), period: t('period12m') }`
  - `{ label: t('rowOccupancy'), value: `${Math.round(occupancy)}%`, source: t('sourcePropyte'), period: t('period12m') }`
  - `{ label: t('rowRevpar'), value: revpar!=null?formatPrice(revpar):'—', source: t('sourceCalc') }`
  - `{ label: t('rowEstIncome'), value: formatPrice(netRent), source: t('sourceEstimate') }`
  - Render `<DataSourceTable rows={...} footnote={t('noteCityLevel')} />`.
- [ ] **Step 3:** `tsc --noEmit` clean.
- [ ] **Step 4:** Commit `RentabilidadTab.tsx` — `feat(unidades): tablas de origen de datos en Residencial/Vacacional`.

## Task 4: Desglose año-a-año en Proyección (`RentabilidadTab.tsx` — `ProyeccionPanel`)

- [ ] **Step 1:** In `ProyeccionPanel`, add a scenario toggle state `const [scenario, setScenario] = useState<'vac'|'res'>('vac');` and build the breakdown rows for the active scenario (reuse the EXISTING `chartData`/functions — same math):
```tsx
const annualNet = scenario === 'vac' ? vacAnnualNet : resAnnualNet;
const breakdown = Array.from({ length: 10 }, (_, i) => {
  const y = i + 1;
  const valor = calculateProjectedValue(price, appreciation, y);
  const rents = Math.round(annualNet * y);
  const total = (valor - price) + rents;
  return { y, valor, rents, total, pct: projectedTotalReturn(price, appreciation, annualNet, y) };
});
```
(`calculateProjectedValue` already imported; ensure `projectedTotalReturn` is imported — it already is.)
- [ ] **Step 2:** Render below the "Valor proyectado" card: a toggle (Residencial/Vacacional, reuse `t('residentialTab')`/`t('vacationTab')`) + `t('breakdownTitle')` + `t('breakdownExplain')` + a table:

| `colYear` | `colPropertyValue` | `colRentsAccum` | `colTotalReturn` | `colReturnPct` |

rows: `y` · `formatPrice(valor)` · `formatPrice(rents)` · `formatPrice(total)` · `+{pct.toFixed(0)}%`. Style like the sibling tables (text-xs, border-gray-100). Always visible (no colapsar).
- [ ] **Step 3 (probe — PARIDAD):** temp `src/app/[locale]/roi-probe/page.tsx` mounting `RentabilidadTab` (or a minimal harness calling the same breakdown) with known price/appreciation/annualNet; assert: `breakdown[9].valor === calculateProjectedValue(price, appr, 10)` (== the projected-10 card) and `breakdown[9].pct === milestones[10yr].vac` and `round(breakdown[y].total/price*100) === round(pct)`. Build, curl `/es/roi-probe`, confirm the printed values reconcile. Delete probe.
- [ ] **Step 4:** `rm -rf src/app/[locale]/roi-probe .next/types && tsc --noEmit && next build` clean.
- [ ] **Step 5:** Commit `RentabilidadTab.tsx` — `feat(unidades): desglose ROI año por año (paridad con la gráfica)`.

## Task 5: Gate final + anti-proveedor

- [ ] **Step 1:** `rm -rf .next/types && tsc --noEmit && next build`.
- [ ] **Step 2:** Parity `simulator` es/en → OK.
- [ ] **Step 3:** Anti-proveedor: `grep -riE "airdna|airroi|apify|inmuebles24" src/i18n/messages/es.json src/i18n/messages/en.json src/app/[locale]/propiedades/_components/rentabilidad/ src/app/[locale]/propiedades/_components/RentabilidadTab.tsx` → 0 resultados.
- [ ] **Step 4:** Report. No push.

## Self-Review (vs spec §2,§4,§7)
- Proyección desglole año-a-año visible + paridad exacta (decomposición de las funciones reales) ✓ · Res/Vac tablas de origen "Análisis de mercado Propyte" ✓ · sin proveedores (grep) ✓ · sin cambios de cálculo ✓ · i18n es/en ✓ · todo visible (no colapsado) ✓.
