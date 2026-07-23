'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Home, Plane, TrendingUp } from '@/lib/icons';
import {
  calculateGrossYield, calculateNetYield, calculateCapRate,
  calculateVacGrossYield, calculateVacNetYield, calculateVacNetRent,
  calculateProjectedValue, projectedTotalReturn, VAC, RES,
} from '@/lib/calculator';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import TrendChart from './rentabilidad/TrendChart';
import ZoneComparison from './rentabilidad/ZoneComparison';
import DataSourceTable from './rentabilidad/DataSourceTable';
import type { AirdnaMarketSummary, AirdnaZoneSummary } from '@/lib/supabase/queries';

interface RentabilidadTabProps {
  price: number;
  totalPropertyCost: number;
  monthlyRentRes: number;
  monthlyRentVac: number;
  airdna: AirdnaMarketSummary | null;
  appreciationDefault: number;
  locale: string;
}

export default function RentabilidadTab({
  price, totalPropertyCost, monthlyRentRes, monthlyRentVac, airdna, appreciationDefault, locale,
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
    };
  }, [monthlyRentRes, totalPropertyCost]);

  const vac = useMemo(() => {
    const occ = occupancyVac / 100;
    const effectiveMonthly = Math.round(monthlyRentVac * occ);
    const netMonthly = calculateVacNetRent(monthlyRentVac, occ);
    return {
      effectiveMonthly, netMonthly, annualNet: netMonthly * 12,
      grossYield: calculateVacGrossYield(monthlyRentVac, occ, totalPropertyCost),
      netYield: calculateVacNetYield(monthlyRentVac, occ, totalPropertyCost),
      adr: airdna?.current_adr ?? null,
      revpar: airdna?.current_adr != null ? Math.round(airdna.current_adr * occ) : null,
    };
  }, [monthlyRentVac, occupancyVac, totalPropertyCost, airdna]);

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
                grossYield={res.grossYield} netYield={res.netYield} capRate={res.capRate}
                annualNet={res.annualNet} zones={airdna?.zones ?? []} locale={locale}
              />
            ),
          },
          {
            id: 'vacacional', label: t('vacationTab'), icon: <Plane size={16} />,
            panel: (
              <VacacionalPanel
                netRent={vac.netMonthly}
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
                resAnnualNet={res.annualNet} vacAnnualNet={vac.annualNet}
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
  grossRent, effectiveRent, netRent, grossYield, netYield, capRate, annualNet, zones, locale,
}: { grossRent: number; effectiveRent: number; netRent: number; grossYield: number; netYield: number; capRate: number; annualNet: number; zones: AirdnaZoneSummary[]; locale: string }) {
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
      <DataSourceTable
        rows={[
          { label: t('rowMonthlyRent'), value: formatPrice(Math.round(grossRent)), source: t('sourcePropyte'), period: t('periodRecent') },
          { label: t('rowOccupancyAssumed'), value: `${Math.round(RES.OCCUPANCY * 100)}%`, source: t('sourceEstimate'), period: t('periodAssumption') },
          { label: t('rowYields'), value: `${formatPercentage(grossYield)} / ${formatPercentage(netYield)} / ${formatPercentage(capRate)}`, source: t('sourceCalc'), period: t('periodDerived') },
        ]}
        footnote={t('noteCityLevel')}
      />
      <ZoneComparison metric="occupancy" zones={zones} locale={locale} title={t('zoneCompareRes')} />
    </div>
  );
}

function VacacionalPanel({
  netRent, adr, revpar, occupancy, avgOcc12m, grossYield, netYield, occupancyTrend, zones, locale,
}: { netRent: number; adr: number | null; revpar: number | null; occupancy: number; avgOcc12m: number | null; grossYield: number; netYield: number; occupancyTrend: { label: string; value: number }[]; zones: AirdnaZoneSummary[]; locale: string }) {
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
      <DataSourceTable
        rows={[
          { label: t('rowAdr'), value: adr != null ? formatPrice(adr) : '—', source: t('sourcePropyte'), period: t('period12m') },
          { label: t('rowOccupancy'), value: `${Math.round(occupancy)}%`, source: t('sourcePropyte'), period: t('period12m') },
          { label: t('rowRevpar'), value: revpar != null ? formatPrice(revpar) : '—', source: t('sourceCalc'), period: t('periodDerived') },
          { label: t('rowEstIncome'), value: formatPrice(netRent), source: t('sourceEstimate'), period: t('periodDerived') },
        ]}
        footnote={t('noteCityLevel')}
      />
      <p className="text-2xs text-gray-600">{t('strLanguageNote')}</p>
    </div>
  );
}

function ProyeccionPanel({
  price, appreciation, setAppreciation, resAnnualNet, vacAnnualNet,
}: { price: number; appreciation: number; setAppreciation: (n: number) => void; resAnnualNet: number; vacAnnualNet: number }) {
  const t = useTranslations('simulator');
  const [scenario, setScenario] = useState<'vac' | 'res'>('vac');
  const annualNetSel = scenario === 'vac' ? vacAnnualNet : resAnnualNet;
  const breakdown = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const y = i + 1;
    const valor = calculateProjectedValue(price, appreciation, y);
    const rents = Math.round(annualNetSel * y);
    const total = (valor - price) + rents;
    const pct = projectedTotalReturn(price, appreciation, annualNetSel, y);
    return { y, valor, rents, total, pct };
  }), [price, appreciation, annualNetSel]);
  const chartData = useMemo(
    () => Array.from({ length: 10 }, (_, i) => {
      const yr = i + 1;
      return {
        year: yr,
        vac: Math.round(projectedTotalReturn(price, appreciation, vacAnnualNet, yr)),
        res: Math.round(projectedTotalReturn(price, appreciation, resAnnualNet, yr)),
      };
    }),
    [price, appreciation, vacAnnualNet, resAnnualNet],
  );
  const milestones = [5, 10].map((yrs) => ({
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

      {/* Línea de tiempo: retorno acumulado (plusvalía + rentas) Vacacional vs Residencial */}
      <div>
        <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{t('projectionTimelineTitle')}</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F4" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10 }}
                interval={0}
                tickMargin={4}
                height={30}
                label={{ value: t('years'), position: 'insideBottom', offset: -2, fontSize: 10, fill: '#6B7280' }}
              />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={44} />
              <Tooltip formatter={(v) => `+${Number(v) || 0}%`} labelFormatter={(v) => t('horizonYears', { n: Number(v) })} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="res" name={t('residentialTab')} stroke="#1A2F3F" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="vac" name={t('vacationTab')} stroke="#0E7490" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hitos exactos a 5 y 10 años */}
      <div className="grid grid-cols-2 gap-3">
        {milestones.map((m) => (
          <div key={m.yrs} className="rounded-xl border border-gray-100 p-4">
            <div className="text-2xs text-gray-600 uppercase tracking-wider mb-2">{t('horizonYears', { n: m.yrs })}</div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[#0E7490]">{t('vacationTab')}</span>
              <span className="font-bold text-[#0E7490]">+{m.vac.toFixed(0)}%</span>
            </div>
            <div className="flex items-baseline justify-between text-sm mt-1">
              <span className="text-[#1A2F3F]">{t('residentialTab')}</span>
              <span className="font-bold text-[#1A2F3F]">+{m.res.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs text-gray-600 mb-1">{t('projected10yr')}</div>
        <div className="text-2xl font-bold text-[#2C2C2C]">{formatPrice(projected10)}</div>
      </div>

      {/* Desglose año por año */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="text-sm font-semibold text-[#2C2C2C]">{t('breakdownTitle')}</div>
          <div className="inline-flex rounded-full border border-gray-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setScenario('res')}
              className={`px-3 py-1 rounded-full border transition-colors ${scenario === 'res' ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand' : 'border-gray-200 text-gray-700 hover:border-propyte-brand'}`}
            >
              {t('residentialTab')}
            </button>
            <button
              type="button"
              onClick={() => setScenario('vac')}
              className={`px-3 py-1 rounded-full border transition-colors ${scenario === 'vac' ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand' : 'border-gray-200 text-gray-700 hover:border-propyte-brand'}`}
            >
              {t('vacationTab')}
            </button>
          </div>
        </div>
        <p className="text-2xs text-gray-600 mb-2">{t('breakdownExplain')}</p>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50">
                <th className="px-3 py-1.5 font-medium">{t('colYear')}</th>
                <th className="px-3 py-1.5 font-medium">{t('colPropertyValue')}</th>
                <th className="px-3 py-1.5 font-medium">{t('colRentsAccum')}</th>
                <th className="px-3 py-1.5 font-medium">{t('colTotalReturn')}</th>
                <th className="px-3 py-1.5 font-medium">{t('colReturnPct')}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.y} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 text-gray-700">{b.y}</td>
                  <td className="px-3 py-1.5 text-gray-700">{formatPrice(b.valor)}</td>
                  <td className="px-3 py-1.5 text-gray-700">{formatPrice(b.rents)}</td>
                  <td className="px-3 py-1.5 font-semibold text-[#1A2F3F]">{formatPrice(b.total)}</td>
                  <td className="px-3 py-1.5 font-semibold text-[#0E7490]">+{b.pct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-2xs text-gray-600 leading-relaxed">{t('roiDisclaimerCompare', { n: appreciation.toFixed(1) })}</p>
    </div>
  );
}
