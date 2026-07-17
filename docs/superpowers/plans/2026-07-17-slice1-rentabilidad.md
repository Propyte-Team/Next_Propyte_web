# Slice 1 — Rediseño pestaña Rentabilidad · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar la pestaña "Rentabilidad" de la ficha de unidad en dos pestañas (**Rentabilidad** + **Esquemas de pago** shell), quitar toda resta de financiamiento y el "Flujo Anual", y desglosar Residencial/Vacacional/Proyección ROI con datos de los últimos 12 meses (gráficas de línea) y comparativa de zonas.

**Architecture:** Hoy `UnitInvestmentCalculator.tsx` mezcla rentabilidad + inputs de financiamiento + corrida + proyección. Este slice lo **separa**: la pestaña Rentabilidad queda **libre de financiamiento** (residencial/vacacional/proyección), y los inputs de financiamiento + corrida se **mueven** a un nuevo componente `EsquemasDePagoTab.tsx` (shell, que Slices 2-3 desarrollan). La Proyección ROI pasa a comparar Vacacional vs Residencial (plusvalía + rentas), sin cashflow de financiamiento. Se pasa el `AirdnaMarketSummary` completo a Rentabilidad para las gráficas 12m y la comparativa de zonas.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl 4, recharts 3, Tailwind. Sin vitest en el repo (rompe `tsc`/`build`): la lógica pura se valida con `node --test` temporal (borrar antes de commit) o con `tsc`+`next build`+standalone+Playwright. Base = `origin/main` en worktree `Next_Propyte_web_unidades` (rama `feat/unidades-rediseno`).

**Regla de datos (locked, del spec):** sin restar mensualidad; sin "Flujo Anual"; Proyección compara Vac vs Res.

**Gotcha de datos:** `AirdnaMarketSummary` (queries.ts:1658) tiene `occupancy_trend: {date,value}[]` (serie 12m) + `current_adr` + `adr_by_beds`, pero **NO** serie mensual de ADR. → El chart de línea 12m de **ocupación** sí se hace; el de **ADR 12m** se diseña con prop opcional `adrTrend` y **fallback a ADR actual** hasta que la serie exista (coordinar con la iniciativa del filtro 12m). No inventar la serie.

---

## File Structure

- **Modificar** `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx`
  - Pasar el `AirdnaMarketSummary` completo (no solo `current_occupancy`) al render.
  - Partir el tab `rentabilidad` en dos: `rentabilidad` (RentabilidadTab) + `esquemas` (EsquemasDePagoTab shell).
- **Crear** `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx`
  - Extraído de `UnitInvestmentCalculator`, sin financiamiento. 3 sub-tabs: Residencial, Vacacional, Proyección ROI.
- **Crear** `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx`
  - Shell: recibe los inputs de financiamiento + `CorridaFinanciera` (movidos del calculador). Slices 2-3 lo desarrollan.
- **Crear** `src/app/[locale]/propiedades/_components/rentabilidad/TrendChart.tsx`
  - Gráfica de línea 12m reutilizable (recharts Area), acepta serie `{label,value}[]` + formato (% o $).
- **Crear** `src/app/[locale]/propiedades/_components/rentabilidad/ZoneComparison.tsx`
  - Barras "esta zona vs zonas similares" (ADR u ocupación), a partir de `summary.zones`.
- **Modificar** `src/lib/calculator.ts`
  - Agregar `projectedTotalReturn(price, appreciationPct, annualNetRent, years)` (pura) para la comparativa Vac vs Res (plusvalía + rentas acumuladas).
- **Borrar (dentro de UnitInvestmentCalculator)** `CashflowTable`, uso de `buildCashflows`/`calculateRemainingBalanceActuarial` en Rentabilidad, fila `minusMonthlyLoan`, resta `- monthlyPayment`.
- **Modificar** `src/i18n/messages/es.json` y `src/i18n/messages/en.json` (namespace `simulator` + nuevas claves `rentabilidad`).
- **Modificar** `src/lib/visibility.ts` (o donde vivan `VISIBILITY_KEYS`) → agregar `PROPIEDADES_DETAIL_ESQUEMAS`.

> El componente `UnitInvestmentCalculator.tsx` queda **reemplazado** por `RentabilidadTab.tsx` + `EsquemasDePagoTab.tsx`. Borrarlo al final (Task 8) cuando nadie lo importe.

---

## Task 0: Setup del worktree (entorno)

**Files:** ninguno (setup local).

- [ ] **Step 1: Junction de node_modules + copiar env (Windows)**

```bash
WT="C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades"
MAIN="C:/Users/Luis/Projects/Propyte/Next_Propyte_web"
cmd //c mklink //J "$WT\\node_modules" "$MAIN\\node_modules"
cp "$MAIN"/.env* "$WT"/ 2>/dev/null; echo "env copiado"
```

- [ ] **Step 2: Verificar toolchain base (debe pasar en la base intacta)**

Run: `cd "$WT" && npx tsc --noEmit`
Expected: 0 errores propios (ignorar 9 errores pre-existentes de `api/*/pdf` + `lib/pdf/*` si falta `@react-pdf/renderer`/`sharp` en node_modules; si aparecen, `npm install --no-save @react-pdf/renderer sharp` en el worktree).

- [ ] **Step 3: Confirmar rama**

Run: `git -C "$WT" rev-parse --abbrev-ref HEAD`
Expected: `feat/unidades-rediseno`

---

## Task 1: Agregar la pestaña "Esquemas de pago" (shell) + visibility key

**Files:**
- Modify: `src/lib/visibility.ts` (VISIBILITY_KEYS)
- Create: `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx`
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` (array de tabs)

- [ ] **Step 1: Localizar VISIBILITY_KEYS y el patrón del gate**

Run: `grep -rn "PROPIEDADES_DETAIL_RENTABILIDAD" src/`
Expected: encuentra la definición (`VISIBILITY_KEYS`) y el uso en `UnitDetailPage.tsx`.

- [ ] **Step 2: Agregar la key nueva**

En el archivo de `VISIBILITY_KEYS`, junto a `PROPIEDADES_DETAIL_RENTABILIDAD`:

```ts
PROPIEDADES_DETAIL_ESQUEMAS: 'propiedades.detail.esquemas',
```

- [ ] **Step 3: Crear el shell EsquemasDePagoTab**

Crea `EsquemasDePagoTab.tsx`. Recibe las props que hoy usa la corrida + los inputs de financiamiento. Por ahora renderiza los inputs de financiamiento (movidos tal cual del calculador) + `CorridaFinanciera` si hay esquemas. Slices 2-3 lo reescriben.

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator } from '@/lib/icons';
import { calculateMonthlyPayment, calculateClosingCosts, getClosingCostRate } from '@/lib/calculator';
import { formatPrice } from '@/lib/formatters';
import CorridaFinanciera from './CorridaFinanciera';
import type { EsquemaPago } from '@/lib/esquemas-pago';

interface EsquemasDePagoTabProps {
  price: number;
  state: string;
  downPaymentMinPct: number;
  financingMonths: number[];
  interestRateDefault: number;
  esquemas: EsquemaPago[];
  listPrice: number;
}

export default function EsquemasDePagoTab({
  price, state, downPaymentMinPct, financingMonths, interestRateDefault, esquemas, listPrice,
}: EsquemasDePagoTabProps) {
  const t = useTranslations('simulator');
  const [downPaymentPct, setDownPaymentPct] = useState(Math.max(downPaymentMinPct || 20, 10));
  const [months, setMonths] = useState(financingMonths[1] || financingMonths[0] || 120);
  const [interestRate, setInterestRate] = useState(interestRateDefault || 9.5);

  const closingCostRate = getClosingCostRate(state);
  const closingCosts = calculateClosingCosts(price, state);
  const downPayment = price * (downPaymentPct / 100);
  const monthlyPayment = useMemo(
    () => calculateMonthlyPayment(price, downPaymentPct, months, interestRate),
    [price, downPaymentPct, months, interestRate],
  );

  return (
    <div className="space-y-6">
      {/* Inputs de financiamiento (movidos de la pestaña Rentabilidad). */}
      <div className="rounded-2xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-[#0E7490]" />
          <h3 className="text-sm font-bold text-[#2C2C2C]">{t('financingInputsTitle')}</h3>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">{t('downPayment')}</label>
            <span className="font-semibold text-[#2C2C2C]">{downPaymentPct}% ({formatPrice(downPayment)})</span>
          </div>
          <input type="range" min={10} max={100} step={1} value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))} className="w-full accent-[#A2F9FF]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('term')}</label>
          <div className="flex flex-wrap gap-2">
            {financingMonths.map((m) => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${months === m ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand' : 'border-gray-200 hover:border-propyte-brand text-gray-700'}`}>
                {t('termMonthsValue', { m })}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">{t('interestRate')}</label>
            <span className="font-semibold text-[#2C2C2C]">{interestRate.toFixed(1)}%</span>
          </div>
          <input type="range" min={0} max={15} step={0.5} value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full accent-[#A2F9FF]" />
        </div>
        <div className="bg-[#0F1923] rounded-2xl p-6 text-white">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('estMonthlyPayment')}</div>
          <div className="text-3xl font-extrabold">{monthlyPayment > 0 ? formatPrice(monthlyPayment) : '—'}</div>
          <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
            <div><div className="text-2xs text-gray-400 uppercase tracking-wider">{t('downShort')}</div><div className="font-bold">{formatPrice(downPayment)}</div></div>
            <div><div className="text-2xs text-gray-400 uppercase tracking-wider">{t('closing')}</div><div className="font-bold">{formatPrice(closingCosts)}</div><div className="text-2xs text-gray-400">{Math.round(closingCostRate * 100)}%</div></div>
            <div><div className="text-2xs text-gray-400 uppercase tracking-wider">{t('loanPrincipal')}</div><div className="font-bold">{formatPrice(price - downPayment)}</div></div>
          </div>
        </div>
        <p className="text-2xs text-gray-600 leading-relaxed">{t('financingDisclaimer')}</p>
      </div>

      {esquemas.length > 0 && <CorridaFinanciera listPrice={listPrice} esquemas={esquemas} />}
    </div>
  );
}
```

- [ ] **Step 4: Insertar el tab en UnitDetailPage**

En `UnitDetailPage.tsx`, junto al tab `rentabilidad` (aprox línea 569), agrega el tab `esquemas` (mismo patrón de gate). Importa `EsquemasDePagoTab` arriba. El panel usa las mismas props de financiamiento/esquemas que hoy recibe `UnitInvestmentCalculator`:

```tsx
...(isVisible(VISIBILITY_KEYS.PROPIEDADES_DETAIL_ESQUEMAS)
  ? [{
      id: 'esquemas',
      label: tProp('paymentSchemesTab'),
      panel: (
        <EsquemasDePagoTab
          price={property.price.mxn}
          state={property.location.state}
          downPaymentMinPct={property.financing.downPaymentMin ?? 20}
          financingMonths={property.financing.months ?? [60, 120, 180, 240]}
          interestRateDefault={property.financing.interestRate ?? 9.5}
          esquemas={property.financing.esquemas ?? []}
          listPrice={property.price.original ?? property.price.mxn}
        />
      ),
    }]
  : []),
```

> Usa los MISMOS accessors que ya usa el tab `rentabilidad` para price/state/financing (cópialos exactos de ese bloque; ver `UnitDetailPage.tsx:569-588`). Si algún nombre difiere, respeta el existente.

- [ ] **Step 5: Verificar build + tab visible**

Run: `cd "$WT" && npx tsc --noEmit && npm run build`
Expected: exit 0. (Verificación en vivo del tab en Task 7.)

- [ ] **Step 6: Commit**

```bash
git -C "$WT" add src/lib/visibility.ts "src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx"
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): pestaña Esquemas de pago (shell) + gate de visibilidad"
```

---

## Task 2: Crear RentabilidadTab sin financiamiento (residencial + vacacional)

**Files:**
- Create: `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx`
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` (tab `rentabilidad` → `RentabilidadTab`)

- [ ] **Step 1: Crear RentabilidadTab (base residencial/vacacional, SIN resta de mensualidad)**

Copia la lógica de `res`/`vac` de `UnitInvestmentCalculator` PERO:
- `monthlyNet` = `netMonthly` (SIN `- monthlyPayment`).
- Elimina el panel de inputs de financiamiento y el prop `monthlyPayment` del `MetricsPanel`.
- Elimina la fila `minusMonthlyLoan`.

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Home, Plane, TrendingUp } from '@/lib/icons';
import {
  calculateGrossYield, calculateNetYield, calculateCapRate, calculateCashOnCash,
  calculateVacGrossYield, calculateVacNetYield, calculateVacNetRent,
  calculateProjectedValue, projectedTotalReturn, VAC, RES,
} from '@/lib/calculator';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import TrendChart from './rentabilidad/TrendChart';
import ZoneComparison from './rentabilidad/ZoneComparison';
import type { AirdnaMarketSummary } from '@/lib/supabase/queries';

interface RentabilidadTabProps {
  price: number;
  totalPropertyCost: number;   // price + closing (para yields)
  totalInvested: number;       // enganche default + closing (para cash-on-cash)
  monthlyRentRes: number;
  monthlyRentVac: number;
  airdna: AirdnaMarketSummary | null;
  appreciationDefault: number;
  locale: string;
}

export default function RentabilidadTab({
  price, totalPropertyCost, totalInvested, monthlyRentRes, monthlyRentVac,
  airdna, appreciationDefault, locale,
}: RentabilidadTabProps) {
  const t = useTranslations('simulator');
  const [appreciation, setAppreciation] = useState(appreciationDefault || 8);
  const occupancyVac = airdna?.current_occupancy != null ? airdna.current_occupancy : VAC.DEFAULT_OCCUPANCY * 100;

  const res = useMemo(() => {
    const effectiveMonthly = Math.round(monthlyRentRes * RES.OCCUPANCY);
    const netMonthly = Math.round(effectiveMonthly * (1 - RES.EXPENSE_RATIO));
    const annualGross = effectiveMonthly * 12;
    const annualNet = netMonthly * 12;
    return {
      effectiveMonthly, netMonthly, annualNet,
      grossYield: calculateGrossYield(annualGross, totalPropertyCost),
      netYield: calculateNetYield(annualGross, totalPropertyCost, RES.EXPENSE_RATIO),
      capRate: calculateCapRate(annualNet, totalPropertyCost),
      cashOnCash: calculateCashOnCash(annualNet, totalInvested),
    };
  }, [monthlyRentRes, totalPropertyCost, totalInvested]);

  const vac = useMemo(() => {
    const occ = occupancyVac / 100;
    const effectiveMonthly = Math.round(monthlyRentVac * occ);
    const netMonthly = calculateVacNetRent(monthlyRentVac, occ);
    const annualNet = netMonthly * 12;
    return {
      effectiveMonthly, netMonthly, annualNet,
      grossYield: calculateVacGrossYield(monthlyRentVac, occ, totalPropertyCost),
      netYield: calculateVacNetYield(monthlyRentVac, occ, totalPropertyCost),
      capRate: calculateCapRate(annualNet, totalPropertyCost),
      cashOnCash: calculateCashOnCash(annualNet, totalInvested),
      adr: airdna?.current_adr ?? null,
      revpar: airdna?.current_adr != null ? Math.round(airdna.current_adr * occ) : null,
    };
  }, [monthlyRentVac, occupancyVac, totalPropertyCost, totalInvested, airdna]);

  const occupancyTrend = (airdna?.occupancy_trend ?? []).map((p) => ({
    label: formatMonthShort(p.date, locale), value: Math.round(p.value),
  }));

  return (
    <div>
      <Tabs
        variant="pill"
        tablistLabel={t('scenarios')}
        items={[
          {
            id: 'residencial', label: t('residentialTab'), icon: <Home size={16} />,
            panel: (
              <ResidencialPanel
                grossRent={monthlyRentRes} effectiveRent={res.effectiveMonthly} netRent={res.netMonthly}
                grossYield={res.grossYield} netYield={res.netYield} capRate={res.capRate} cashOnCash={res.cashOnCash}
                annualNet={res.annualNet} zones={airdna?.zones ?? []} locale={locale}
              />
            ),
          },
          {
            id: 'vacacional', label: t('vacationTab'), icon: <Plane size={16} />,
            panel: (
              <VacacionalPanel
                grossRent={monthlyRentVac} effectiveRent={vac.effectiveMonthly} netRent={vac.netMonthly}
                adr={vac.adr} revpar={vac.revpar} occupancy={occupancyVac}
                avgOcc12m={airdna?.avg_occupancy_12m ?? null}
                grossYield={vac.grossYield} netYield={vac.netYield}
                occupancyTrend={occupancyTrend} zones={airdna?.zones ?? []} locale={locale}
              />
            ),
          },
          {
            id: 'proyeccion', label: t('roiProjectionTab'), icon: <TrendingUp size={16} />,
            panel: (
              <ProyeccionPanel
                price={price} appreciation={appreciation} setAppreciation={setAppreciation}
                resAnnualNet={res.annualNet} vacAnnualNet={vac.annualNet} locale={locale}
              />
            ),
          },
        ] satisfies TabItem[]}
      />
    </div>
  );
}

function formatMonthShort(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', { month: 'short' }).replace('.', '');
  } catch { return dateStr; }
}
```

- [ ] **Step 2: Sub-paneles ResidencialPanel y VacacionalPanel (en el mismo archivo)**

```tsx
function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-2xs text-gray-600 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-bold" style={{ color: color || '#1A2F3F' }}>{value}</div>
      {sub && <div className="text-2xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function ResidencialPanel({
  grossRent, effectiveRent, netRent, grossYield, netYield, capRate, cashOnCash, annualNet, zones, locale,
}: { grossRent: number; effectiveRent: number; netRent: number; grossYield: number; netYield: number; capRate: number; cashOnCash: number; annualNet: number; zones: import('@/lib/supabase/queries').AirdnaZoneSummary[]; locale: string }) {
  const t = useTranslations('simulator');
  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-[#2C2C2C]">{t('residentialHeading')}</div>
        <div className="text-xs text-gray-600">{t('residentialSubtitle')}</div>
      </div>
      <div className="bg-[#0F1923] rounded-2xl p-5 text-white">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider">{t('grossRent')}</span>
          <span className="text-2xl font-bold">{formatPrice(Math.round(grossRent))}<span className="text-xs font-normal text-gray-400">/mo</span></span>
        </div>
        <div className="flex items-baseline justify-between text-sm pt-2 border-t border-white/10">
          <span className="text-gray-400">{t('effectiveAfterOcc')}</span><span className="font-semibold">{formatPrice(effectiveRent)}/mo</span>
        </div>
        <div className="flex items-baseline justify-between text-sm pt-2">
          <span className="text-propyte-brand font-medium">{t('netAfterExpenses')}</span><span className="font-bold text-propyte-brand">{formatPrice(netRent)}/mo</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label={t('grossYield')} value={formatPercentage(grossYield)} />
        <KpiTile label={t('netYield')} value={formatPercentage(netYield)} />
        <KpiTile label="Cap rate" value={formatPercentage(capRate)} />
        <KpiTile label={t('annualNetIncome')} value={formatPrice(annualNet)} />
      </div>
      <ZoneComparison metric="occupancy" zones={zones} locale={locale} title={t('zoneCompareRes')} />
    </div>
  );
}

function VacacionalPanel({
  grossRent, effectiveRent, netRent, adr, revpar, occupancy, avgOcc12m, grossYield, netYield, occupancyTrend, zones, locale,
}: { grossRent: number; effectiveRent: number; netRent: number; adr: number | null; revpar: number | null; occupancy: number; avgOcc12m: number | null; grossYield: number; netYield: number; occupancyTrend: { label: string; value: number }[]; zones: import('@/lib/supabase/queries').AirdnaZoneSummary[]; locale: string }) {
  const t = useTranslations('simulator');
  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-[#2C2C2C]">{t('vacationHeading')} <span className="text-gray-500 font-normal">(Airbnb)</span></div>
        <div className="text-xs text-gray-600">{t('vacationSubtitleStr')}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiTile label="ADR" value={adr != null ? formatPrice(adr) : '—'} sub={t('perNight')} />
        <KpiTile label={t('occupancy')} value={`${Math.round(occupancy)}%`} sub={avgOcc12m != null ? `${t('avg12m')}: ${Math.round(avgOcc12m)}%` : undefined} />
        <KpiTile label="RevPAR" value={revpar != null ? formatPrice(revpar) : '—'} />
        <KpiTile label={t('estMonthlyIncome')} value={formatPrice(netRent)} />
      </div>
      {occupancyTrend.length > 1 && (
        <TrendChart title={t('occupancy12m')} data={occupancyTrend} format="pct" />
      )}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label={t('grossYield')} value={formatPercentage(grossYield)} />
        <KpiTile label={t('netYield')} value={formatPercentage(netYield)} />
      </div>
      <ZoneComparison metric="adr" zones={zones} locale={locale} title={t('zoneCompareVac')} />
      <p className="text-2xs text-gray-600">{t('strLanguageNote')}</p>
    </div>
  );
}
```

- [ ] **Step 3: Cambiar el tab `rentabilidad` en UnitDetailPage a RentabilidadTab**

Reemplaza el panel del tab `rentabilidad` (hoy `<UnitInvestmentCalculator .../>`) por `<RentabilidadTab .../>`, pasando el `airdna` summary completo (ver Task 4 para el plumbing del summary). Provisionalmente pasa `airdna={null}` para compilar; Task 4 lo conecta. Calcula `totalPropertyCost`/`totalInvested` con los helpers existentes (`calculateClosingCosts`, `getClosingCostRate`) como hoy hace el calculador (`UnitInvestmentCalculator.tsx:62-66`).

- [ ] **Step 4: Verificar build**

Run: `cd "$WT" && npx tsc --noEmit && npm run build`
Expected: exit 0 (fallará si faltan claves i18n → se agregan en Task 6; para compilar, `projectedTotalReturn`/`ProyeccionPanel` llegan en Task 3, `TrendChart`/`ZoneComparison` en Tasks 4-5. Ordena: haz Tasks 3-5 antes del build final, o stubea con `null`/`<></>`).

- [ ] **Step 5: Commit**

```bash
git -C "$WT" add "src/app/[locale]/propiedades/_components/RentabilidadTab.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx"
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): RentabilidadTab sin resta de financiamiento (residencial/vacacional)"
```

---

## Task 3: Proyección ROI — comparativa Vacacional vs Residencial (sin Flujo Anual)

**Files:**
- Modify: `src/lib/calculator.ts` (nueva función pura `projectedTotalReturn`)
- Modify: `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx` (`ProyeccionPanel`)

- [ ] **Step 1: Escribir test pura (temporal, node:test)**

Create `src/lib/calculator.projection.test.mts` (temporal, se borra antes de commit):

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectedTotalReturn } from './calculator';

test('projectedTotalReturn suma plusvalía + rentas acumuladas sobre inversión', () => {
  // precio 1,000,000; apreciación 10%/año; renta neta anual 50,000; 5 años
  // plusvalía = 1,000,000*(1.1^5 - 1) = 610,510; rentas = 250,000
  // retorno % = (610,510 + 250,000) / 1,000,000 * 100 ≈ 86.05
  const r = projectedTotalReturn(1_000_000, 10, 50_000, 5);
  assert.ok(Math.abs(r - 86.05) < 0.5, `esperado ~86.05, got ${r}`);
});
```

- [ ] **Step 2: Correr el test → debe fallar (función no existe)**

Run: `cd "$WT" && node --test src/lib/calculator.projection.test.mts`
Expected: FAIL (`projectedTotalReturn is not a function` / no export).

- [ ] **Step 3: Implementar `projectedTotalReturn` en calculator.ts**

```ts
/**
 * Retorno total proyectado como % sobre el precio: plusvalía acumulada +
 * rentas netas acumuladas, en `years`. NO resta financiamiento.
 */
export function projectedTotalReturn(
  price: number,
  appreciationPct: number,
  annualNetRent: number,
  years: number,
): number {
  if (price <= 0) return 0;
  const appreciation = calculateProjectedValue(price, appreciationPct, years) - price;
  const rents = annualNetRent * years;
  return ((appreciation + rents) / price) * 100;
}
```

- [ ] **Step 4: Correr el test → debe pasar**

Run: `cd "$WT" && node --test src/lib/calculator.projection.test.mts`
Expected: PASS.

- [ ] **Step 5: Escribir `ProyeccionPanel` (en RentabilidadTab.tsx)**

Comparativa Vac vs Res a 5 y 10 años (plusvalía + rentas). Sin `CashflowTable`.

```tsx
function ProyeccionPanel({
  price, appreciation, setAppreciation, resAnnualNet, vacAnnualNet, locale,
}: { price: number; appreciation: number; setAppreciation: (n: number) => void; resAnnualNet: number; vacAnnualNet: number; locale: string }) {
  const t = useTranslations('simulator');
  const rows = [5, 10].map((yrs) => ({
    yrs,
    vac: projectedTotalReturn(price, appreciation, vacAnnualNet, yrs),
    res: projectedTotalReturn(price, appreciation, resAnnualNet, yrs),
  }));
  const projected10 = calculateProjectedValue(price, appreciation, 10);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <label className="font-medium text-gray-700">{t('annualAppreciation')}</label>
          <span className="font-semibold text-[#2C2C2C]">{appreciation.toFixed(1)}%</span>
        </div>
        <input type="range" min={0} max={20} step={0.5} value={appreciation}
          onChange={(e) => setAppreciation(Number(e.target.value))} className="w-full accent-[#A2F9FF]" />
      </div>

      {rows.map((r) => (
        <div key={r.yrs} className="rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{t('horizonYears', { n: r.yrs })}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xs text-gray-600 mb-1">{t('vacationTab')}</div>
              <div className="text-2xl font-bold text-[#0E7490]">+{r.vac.toFixed(0)}%</div>
              <div className="text-2xs text-gray-600">{t('appreciationPlusRents')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xs text-gray-600 mb-1">{t('residentialTab')}</div>
              <div className="text-2xl font-bold text-[#1A2F3F]">+{r.res.toFixed(0)}%</div>
              <div className="text-2xs text-gray-600">{t('appreciationPlusRents')}</div>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs text-gray-600 mb-1">{t('projected10yr')}</div>
        <div className="text-2xl font-bold text-[#2C2C2C]">{formatPrice(projected10)}</div>
      </div>

      <p className="text-2xs text-gray-600 leading-relaxed">{t('roiDisclaimerCompare', { n: appreciation.toFixed(1) })}</p>
    </div>
  );
}
```

Añade el import de `projectedTotalReturn` y `calculateProjectedValue` en RentabilidadTab.tsx (si no está).

- [ ] **Step 6: Borrar el test temporal + verificar build**

Run: `cd "$WT" && rm src/lib/calculator.projection.test.mts && npx tsc --noEmit`
Expected: 0 errores propios. (`node:test .mts` no lo toma `tsc` del build, pero se borra igual por higiene.)

- [ ] **Step 7: Commit**

```bash
git -C "$WT" add src/lib/calculator.ts "src/app/[locale]/propiedades/_components/RentabilidadTab.tsx"
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): Proyección ROI compara Vacacional vs Residencial (plusvalía+rentas), sin Flujo Anual"
```

---

## Task 4: Charts 12m + plumbing del AirdnaMarketSummary

**Files:**
- Create: `src/app/[locale]/propiedades/_components/rentabilidad/TrendChart.tsx`
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` (guardar y pasar el summary completo)

- [ ] **Step 1: Crear TrendChart (recharts Area, reusa el patrón de DataInsights)**

```tsx
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/formatters';

interface TrendChartProps {
  title: string;
  data: { label: string; value: number }[];
  format: 'pct' | 'mxn';
}

export default function TrendChart({ title, data, format }: TrendChartProps) {
  const fmt = (v: number) => (format === 'pct' ? `${v}%` : formatPrice(v));
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-bold text-gray-900">{title}</div>
        <span className="text-2xs text-[#0E7490] bg-propyte-cyan-100 px-2 py-0.5 rounded-full font-bold">dato real</span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5CE0D2" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#5CE0D2" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F4F6F8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmt} domain={format === 'pct' ? [0, 100] : ['auto', 'auto']} />
            <Tooltip formatter={(v: number) => [fmt(v), title]} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#0E7490" strokeWidth={2.5} fill="url(#trendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Pasar el summary completo desde UnitDetailPage**

En `UnitDetailPage.tsx`, hoy solo se guarda `airdnaOccupancy` (línea 148). Guarda también el summary completo:

```tsx
let airdnaSummary: AirdnaMarketSummary | null = null;
// ...dentro del try, tras obtener airdnaResult:
if (airdnaResult) { airdnaOccupancy = airdnaResult.current_occupancy; airdnaSummary = airdnaResult; }
```

Asegura el import de `AirdnaMarketSummary` (ya se importa `getAirdnaMarketSummary` de `@/lib/supabase/queries`; agrega el tipo). Pasa `airdna={airdnaSummary}` al `<RentabilidadTab>` (reemplaza el `null` provisional del Task 2).

- [ ] **Step 3: Verificar build + que la gráfica renderiza con datos reales (standalone)**

Run: `cd "$WT" && npx tsc --noEmit && npm run build`
Expected: exit 0. Render en vivo se valida en Task 7.

- [ ] **Step 4: Commit**

```bash
git -C "$WT" add "src/app/[locale]/propiedades/_components/rentabilidad/TrendChart.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx"
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): chart de ocupación 12m + plumbing de AirdnaMarketSummary a Rentabilidad"
```

---

## Task 5: Comparativa de zonas similares

**Files:**
- Create: `src/app/[locale]/propiedades/_components/rentabilidad/ZoneComparison.tsx`

- [ ] **Step 1: Confirmar el shape de `AirdnaZoneSummary`**

Run: `grep -n "interface AirdnaZoneSummary" -A 8 src/lib/supabase/queries.ts`
Expected: campos como `name`, `occupancy`, `adr` (usa los nombres reales que devuelva; ajusta el componente abajo a esos nombres).

- [ ] **Step 2: Crear ZoneComparison (barras esta-zona vs zonas similares)**

```tsx
'use client';

import { formatPrice } from '@/lib/formatters';
import type { AirdnaZoneSummary } from '@/lib/supabase/queries';

interface ZoneComparisonProps {
  metric: 'adr' | 'occupancy';
  zones: AirdnaZoneSummary[];
  locale: string;
  title: string;
}

export default function ZoneComparison({ metric, zones, title }: ZoneComparisonProps) {
  // Ajustar `z.adr`/`z.occupancy`/`z.name` a los nombres reales del Step 1.
  const rows = zones
    .map((z) => ({ name: z.name, value: metric === 'adr' ? z.adr : z.occupancy }))
    .filter((r) => r.value != null && r.value > 0)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 4);
  if (rows.length < 2) return null;
  const max = Math.max(...rows.map((r) => r.value as number));
  const fmt = (v: number) => (metric === 'adr' ? formatPrice(v) : `${Math.round(v)}%`);
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-sm font-bold text-gray-900 mb-3">{title}</div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.name} className="text-xs">
            <div className="flex justify-between mb-1"><span className="text-gray-700">{r.name}</span><span className="font-bold text-gray-900">{fmt(r.value as number)}</span></div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${((r.value as number) / max) * 100}%`, background: i === 0 ? '#0E7490' : '#94D8D0' }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-2xs text-gray-500 mt-2">* nivel ciudad cuando no hay desglose de zona</p>
    </div>
  );
}
```

- [ ] **Step 3: Verificar build**

Run: `cd "$WT" && npx tsc --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git -C "$WT" add "src/app/[locale]/propiedades/_components/rentabilidad/ZoneComparison.tsx"
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): comparativa de zonas similares (ADR/ocupación) en Rentabilidad"
```

---

## Task 6: i18n (es/en) + limpieza de claves obsoletas

**Files:**
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Agregar las claves nuevas en `simulator` (es.json y en.json)**

Nuevas claves usadas en este slice (agrega a AMBOS con su traducción):

```
annualNetIncome        es: "Ingreso neto anual"           en: "Annual net income"
estMonthlyIncome       es: "Ingreso mensual est."          en: "Est. monthly income"
occupancy12m           es: "Ocupación · últimos 12 meses"  en: "Occupancy · last 12 months"
avg12m                 es: "Prom. 12m"                     en: "12m avg"
perNight               es: "por noche · MXN"               en: "per night · MXN"
vacationSubtitleStr    es: "Renta vacacional — tarifa por noche y ocupación"  en: "Vacation rental — nightly rate & occupancy"
strLanguageNote        es: "Cifras de renta vacacional (ADR, ocupación, temporada); concepto distinto al residencial." en: "Vacation-rental figures (ADR, occupancy, seasonality); different from long-term residential."
zoneCompareRes         es: "Comparativa con zonas similares" en: "Comparison with similar zones"
zoneCompareVac         es: "ADR vs zonas similares"          en: "ADR vs similar zones"
horizonYears           es: "Horizonte {n} años"             en: "{n}-year horizon"
appreciationPlusRents  es: "plusvalía + rentas"             en: "appreciation + rents"
roiDisclaimerCompare   es: "Proyección a apreciación {n}% anual; compara plusvalía + rentas de cada esquema. No incluye financiamiento." en: "Projection at {n}% annual appreciation; compares each scheme's appreciation + rents. Excludes financing."
```

Y en `property` (namespace de la ficha, `tProp`): `paymentSchemesTab` → es: `"Esquemas de pago"`, en: `"Payment plans"`.

- [ ] **Step 2: Verificar paridad de claves es/en**

Run:
```bash
cd "$WT" && node -e "const es=require('./src/i18n/messages/es.json'),en=require('./src/i18n/messages/en.json');const c=(o)=>Object.keys(o).reduce((n,k)=>n+(typeof o[k]==='object'&&o[k]?c(o[k]):1),0);console.log('es',c(es),'en',c(en))"
```
Expected: ambos conteos IGUALES.

- [ ] **Step 3: Commit**

```bash
git -C "$WT" add src/i18n/messages/es.json src/i18n/messages/en.json
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "i18n(unidades): claves de Rentabilidad rediseñada (es/en en paridad)"
```

---

## Task 7: Verificación runtime (standalone + Playwright) y limpieza

**Files:** ninguno nuevo (validación).

- [ ] **Step 1: Build de producción y standalone local**

Run: `cd "$WT" && npm run build`
Expected: exit 0, prerender de páginas de unidad sin errores.

- [ ] **Step 2: Correr el standalone y validar la ficha**

Levanta el standalone (patrón del repo: copiar `.next/static` + `public/.` + `.env*`, `node .next/standalone/.../server.js` con PORT/HOSTNAME). Navega a una ficha de unidad con datos reales (ej. una unidad de Tulum con AirDNA). Verifica:
- Existen DOS pestañas: **Rentabilidad** y **Esquemas de pago**.
- Rentabilidad tiene 3 sub-pestañas (Residencial / Vacacional / Proyección ROI).
- **NO** aparece "− Mensualidad préstamo" ni la tabla "Flujo Anual" en Rentabilidad.
- Vacacional muestra ADR, ocupación, RevPAR y la **gráfica de ocupación 12m** con datos.
- Proyección muestra Vac vs Res a 5 y 10 años.
- Esquemas de pago muestra los inputs de financiamiento + corrida (shell).
- es/en cargan sin claves faltantes (revisar consola: sin `MISSING_MESSAGE`).

- [ ] **Step 3: (opcional) smoke Playwright**

Navega es/en a 1-2 slugs, screenshot de la pestaña Rentabilidad; confirma 200 y ausencia de "Flujo anual"/"Mensualidad préstamo".

- [ ] **Step 4: Confirmar que nada importa ya `UnitInvestmentCalculator`**

Run: `grep -rn "UnitInvestmentCalculator" src/`
Expected: sin resultados (o solo el archivo mismo). Si limpio, borra el archivo.

```bash
git -C "$WT" rm "src/app/[locale]/propiedades/_components/UnitInvestmentCalculator.tsx"
git -C "$WT" -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "chore(unidades): eliminar UnitInvestmentCalculator (reemplazado por RentabilidadTab + EsquemasDePagoTab)"
```

- [ ] **Step 5: (NO push todavía)** Reportar a Luis para revisión en vivo antes de `git push origin HEAD:main`. El deploy a main lo autoriza Luis explícitamente.

---

## Self-Review (cobertura del spec §3)

- §3.1 Residencial (renta + comparativa zonas + charts) → Task 2 (panel) + Task 5 (zonas). *Chart 12m residencial:* no hay serie residencial mensual en el summary → se omite el chart en Residencial (solo Vacacional tiene `occupancy_trend`); comparativa de zonas sí. **Confirmar con Luis si se requiere chart residencial** (dependería de nueva serie).
- §3.2 Vacacional (ADR/ocupación/RevPAR + comparativa + charts + lenguaje STR) → Tasks 2, 4, 5. *ADR 12m:* sin serie → KPI de ADR actual + chart de ocupación 12m; `TrendChart` acepta serie MXN para cuando exista ADR mensual.
- §3.3 Proyección (plusvalía + Vac vs Res, sin Flujo Anual) → Task 3.
- §3 "sin restar mensualidad" → Task 2 (elimina `- monthlyPayment` y `minusMonthlyLoan`).
- §4 "pestaña Esquemas existe (shell)" → Task 1.
- Verificación (tsc/build/standalone/i18n parity) → Tasks 6-7.

**Dependencia abierta:** serie mensual de ADR (y posible serie residencial) — coordinar con la iniciativa del filtro 12m ya en `origin/main`; el diseño no la bloquea (fallbacks definidos).
