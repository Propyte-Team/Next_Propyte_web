'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
                effectiveRent={vac.effectiveMonthly} netRent={vac.netMonthly}
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
      <ZoneComparison metric="occupancy" zones={zones} locale={locale} title={t('zoneCompareRes')} />
    </div>
  );
}

function VacacionalPanel({
  effectiveRent, netRent, adr, revpar, occupancy, avgOcc12m, grossYield, netYield, occupancyTrend, zones, locale,
}: { effectiveRent: number; netRent: number; adr: number | null; revpar: number | null; occupancy: number; avgOcc12m: number | null; grossYield: number; netYield: number; occupancyTrend: { label: string; value: number }[]; zones: AirdnaZoneSummary[]; locale: string }) {
  const t = useTranslations('simulator');
  void effectiveRent;
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

function ProyeccionPanel({
  price, appreciation, setAppreciation, resAnnualNet, vacAnnualNet,
}: { price: number; appreciation: number; setAppreciation: (n: number) => void; resAnnualNet: number; vacAnnualNet: number }) {
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
