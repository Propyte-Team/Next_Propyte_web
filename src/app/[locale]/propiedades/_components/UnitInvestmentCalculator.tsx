'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Home, Plane, Calculator, TrendingUp } from 'lucide-react';
import {
  calculateMonthlyPayment,
  calculateClosingCosts,
  getClosingCostRate,
  calculateGrossYield,
  calculateNetYield,
  calculateCapRate,
  calculateCashOnCash,
  calculateROI,
  calculateProjectedValue,
  calculateIRR,
  calculateBreakeven,
  calculateVacGrossYield,
  calculateVacNetYield,
  calculateVacNetRent,
  buildCashflows,
  calculateRemainingBalanceActuarial,
  VAC,
  RES,
} from '@/lib/calculator';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import Tabs, { type TabItem } from '@/components/ui/Tabs';

interface UnitInvestmentCalculatorProps {
  price: number;
  state: string;
  monthlyRentRes: number;
  monthlyRentVac: number;
  airdnaOccupancy: number | null;
  downPaymentMinPct: number;
  financingMonths: number[];
  interestRateDefault: number;
  appreciationDefault: number;
  locale: string;
}

export default function UnitInvestmentCalculator({
  price, state, monthlyRentRes, monthlyRentVac, airdnaOccupancy,
  downPaymentMinPct, financingMonths, interestRateDefault, appreciationDefault, locale,
}: UnitInvestmentCalculatorProps) {
  const t = useTranslations('simulator');

  const [downPaymentPct, setDownPaymentPct] = useState(Math.max(downPaymentMinPct || 20, 10));
  const [months, setMonths] = useState(financingMonths[1] || financingMonths[0] || 120);
  const [interestRate, setInterestRate] = useState(interestRateDefault || 9.5);
  const [appreciation, setAppreciation] = useState(appreciationDefault || 8);
  const [occupancyVac, setOccupancyVac] = useState(
    airdnaOccupancy != null ? airdnaOccupancy : VAC.DEFAULT_OCCUPANCY * 100
  );

  const closingCostRate = getClosingCostRate(state);
  const closingCosts = calculateClosingCosts(price, state);
  const totalPropertyCost = price + closingCosts;
  const downPayment = price * (downPaymentPct / 100);
  const totalInvested = downPayment + closingCosts;

  const monthlyPayment = useMemo(
    () => calculateMonthlyPayment(price, downPaymentPct, months, interestRate),
    [price, downPaymentPct, months, interestRate]
  );

  // ── Residencial metrics ──
  const res = useMemo(() => {
    const effectiveMonthly = Math.round(monthlyRentRes * RES.OCCUPANCY);
    const netMonthly = Math.round(effectiveMonthly * (1 - RES.EXPENSE_RATIO));
    const annualGross = effectiveMonthly * 12;
    const annualNet = netMonthly * 12;
    return {
      effectiveMonthly,
      netMonthly,
      grossYield: calculateGrossYield(annualGross, totalPropertyCost),
      netYield: calculateNetYield(annualGross, totalPropertyCost, RES.EXPENSE_RATIO),
      capRate: calculateCapRate(annualNet, totalPropertyCost),
      cashOnCash: calculateCashOnCash(annualNet, totalInvested),
      monthlyNet: netMonthly - monthlyPayment,
      annualNet,
    };
  }, [monthlyRentRes, totalPropertyCost, totalInvested, monthlyPayment]);

  // ── Vacacional metrics ──
  const vac = useMemo(() => {
    const occ = occupancyVac / 100;
    const effectiveMonthly = Math.round(monthlyRentVac * occ);
    const netMonthly = calculateVacNetRent(monthlyRentVac, occ);
    const annualNet = netMonthly * 12;
    return {
      effectiveMonthly,
      netMonthly,
      grossYield: calculateVacGrossYield(monthlyRentVac, occ, totalPropertyCost),
      netYield: calculateVacNetYield(monthlyRentVac, occ, totalPropertyCost),
      capRate: calculateCapRate(annualNet, totalPropertyCost),
      cashOnCash: calculateCashOnCash(annualNet, totalInvested),
      monthlyNet: netMonthly - monthlyPayment,
      annualNet,
    };
  }, [monthlyRentVac, occupancyVac, totalPropertyCost, totalInvested, monthlyPayment]);

  // ── ROI Projection (uses residencial as the conservative base) ──
  const projection = useMemo(() => {
    const annualGrossRes = res.effectiveMonthly * 12;
    const roi1 = calculateROI(price, downPaymentPct, annualGrossRes, appreciation, 1);
    const roi5 = calculateROI(price, downPaymentPct, annualGrossRes, appreciation, 5);
    const roi10 = calculateROI(price, downPaymentPct, annualGrossRes, appreciation, 10);
    const projectedValue5 = calculateProjectedValue(price, appreciation, 5);
    const projectedValue10 = calculateProjectedValue(price, appreciation, 10);

    const cf5 = buildCashflows({
      totalInvested,
      annualNetFlow: res.monthlyNet * 12,
      price,
      appreciationPct: appreciation,
      years: 5,
      remainingBalance: calculateRemainingBalanceActuarial(price, downPaymentPct, interestRate, months, 60),
    });
    const cf10 = buildCashflows({
      totalInvested,
      annualNetFlow: res.monthlyNet * 12,
      price,
      appreciationPct: appreciation,
      years: 10,
      remainingBalance: calculateRemainingBalanceActuarial(price, downPaymentPct, interestRate, months, 120),
    });

    const irr5 = calculateIRR(cf5);
    const irr10 = calculateIRR(cf10);

    return {
      roi1, roi5, roi10, projectedValue5, projectedValue10, irr5, irr10, cf5, cf10,
    };
  }, [price, downPaymentPct, appreciation, totalInvested, res.effectiveMonthly, res.monthlyNet, interestRate, months]);

  const breakeven = calculateBreakeven(totalInvested, Math.max(res.monthlyNet, 0));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-[#2C2C2C]">
          {t('calculatorTitle')}
        </h2>
        <div className="text-xs text-gray-600">
          {t('priceLabel')}{' '}
          <span className="font-bold text-[#2C2C2C]">{formatPrice(price)}</span>
          {' · '}
          {t('totalInvestmentLabel')}{' '}
          <span className="font-bold text-[#2C2C2C]">{formatPrice(totalPropertyCost)}</span>
        </div>
      </div>

      <Tabs
        variant="pill"
        tablistLabel={t('scenarios')}
        items={[
          {
            id: 'residencial',
            label: t('residentialTab'),
            icon: <Home size={16} />,
            panel: (
              <MetricsPanel
                title={t('residentialHeading')}
                subtitle={t('residentialSubtitle')}
                grossRent={monthlyRentRes}
                effectiveRent={res.effectiveMonthly}
                netRent={res.netMonthly}
                monthlyPayment={monthlyPayment}
                grossYield={res.grossYield}
                netYield={res.netYield}
                capRate={res.capRate}
                cashOnCash={res.cashOnCash}
                monthlyNet={res.monthlyNet}
                breakeven={breakeven}
                locale={locale}
              />
            ),
          },
          {
            id: 'vacacional',
            label: t('vacationTab'),
            icon: <Plane size={16} />,
            panel: (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('occupancy')}
                      {airdnaOccupancy != null && (
                        <span className="ml-2 text-2xs font-bold text-[#0F766E] bg-propyte-cyan-100 px-2 py-0.5 rounded-full">Data</span>
                      )}
                    </label>
                    <span className="text-sm font-bold text-[#2C2C2C]">{occupancyVac.toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min={40} max={100} step={1}
                    value={occupancyVac}
                    onChange={(e) => setOccupancyVac(Number(e.target.value))}
                    className="w-full accent-[#A2F9FF]"
                  />
                </div>
                <MetricsPanel
                  title={t('vacationHeading')}
                  subtitle={t('vacationSubtitle')}
                  grossRent={monthlyRentVac}
                  effectiveRent={vac.effectiveMonthly}
                  netRent={vac.netMonthly}
                  monthlyPayment={monthlyPayment}
                  grossYield={vac.grossYield}
                  netYield={vac.netYield}
                  capRate={vac.capRate}
                  cashOnCash={vac.cashOnCash}
                  monthlyNet={vac.monthlyNet}
                  breakeven={calculateBreakeven(totalInvested, Math.max(vac.monthlyNet, 0))}
                  locale={locale}
                />
              </div>
            ),
          },
          {
            id: 'financiamiento',
            label: t('financingTab'),
            icon: <Calculator size={16} />,
            panel: (
              <div className="space-y-5">
                <Slider
                  label={t('downPayment')}
                  value={downPaymentPct}
                  display={`${downPaymentPct}% (${formatPrice(downPayment)})`}
                  min={10} max={100} step={1}
                  onChange={setDownPaymentPct}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('term')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {financingMonths.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                          months === m
                            ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand'
                            : 'border-gray-200 hover:border-propyte-brand text-gray-700'
                        }`}
                      >
                        {t('termMonthsValue', { m })}
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label={t('interestRate')}
                  value={interestRate}
                  display={`${interestRate.toFixed(1)}%`}
                  min={0} max={15} step={0.5}
                  onChange={setInterestRate}
                />

                <div className="bg-[#0F1923] rounded-2xl p-6 text-white">
                  <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">
                    {t('estMonthlyPayment')}
                  </div>
                  <div className="text-3xl font-extrabold">
                    {monthlyPayment > 0 ? formatPrice(monthlyPayment) : '—'}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
                    <FinKV label={t('downShort')} value={formatPrice(downPayment)} />
                    <FinKV label={t('closing')} value={formatPrice(closingCosts)} note={`${Math.round(closingCostRate * 100)}%`} />
                    <FinKV label={t('loanPrincipal')} value={formatPrice(price - downPayment)} />
                  </div>
                </div>

                <p className="text-2xs text-gray-600 leading-relaxed">
                  {t('financingDisclaimer')}
                </p>
              </div>
            ),
          },
          {
            id: 'proyeccion',
            label: t('roiProjectionTab'),
            icon: <TrendingUp size={16} />,
            panel: (
              <div className="space-y-5">
                <Slider
                  label={t('annualAppreciation')}
                  value={appreciation}
                  display={`${appreciation.toFixed(1)}%`}
                  min={0} max={20} step={0.5}
                  onChange={setAppreciation}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ProjTile
                    label={t('irr5')}
                    value={projection.irr5 != null ? formatPercentage(projection.irr5) : '—'}
                    highlight
                  />
                  <ProjTile
                    label={t('irr10')}
                    value={projection.irr10 != null ? formatPercentage(projection.irr10) : '—'}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <ProjTile
                    label={t('roi1yr')}
                    value={`${projection.roi1.toFixed(1)}%`}
                  />
                  <ProjTile
                    label={t('roi5yr')}
                    value={`${projection.roi5.toFixed(1)}%`}
                  />
                  <ProjTile
                    label={t('roi10yr')}
                    value={`${projection.roi10.toFixed(1)}%`}
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-600 mb-1">
                    {t('projected10yr')}
                  </div>
                  <div className="text-2xl font-bold text-[#2C2C2C]">{formatPrice(projection.projectedValue10)}</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-propyte-brand to-[#22C55E] rounded-full transition-all"
                      style={{ width: `${Math.min((projection.projectedValue10 / price) * 33, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-2xs text-gray-600 mt-1">
                    <span>{formatPrice(price)}</span>
                    <span>{formatPrice(projection.projectedValue10)}</span>
                  </div>
                </div>

                <CashflowTable
                  cashflows={projection.cf10}
                  locale={locale}
                  totalInvested={totalInvested}
                />

                <p className="text-2xs text-gray-600 leading-relaxed">
                  {t('roiDisclaimerCalc', { n: appreciation.toFixed(1) })}
                </p>
              </div>
            ),
          },
        ] satisfies TabItem[]}
      />
    </div>
  );
}

// ── Sub-components ──

interface MetricsPanelProps {
  title: string;
  subtitle: string;
  grossRent: number;
  effectiveRent: number;
  netRent: number;
  monthlyPayment: number;
  grossYield: number;
  netYield: number;
  capRate: number;
  cashOnCash: number;
  monthlyNet: number;
  breakeven: number;
  locale: string;
}

function MetricsPanel({
  title, subtitle, grossRent, effectiveRent, netRent, monthlyPayment,
  grossYield, netYield, capRate, cashOnCash, monthlyNet, breakeven,
}: MetricsPanelProps) {
  const t = useTranslations('simulator');

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-[#2C2C2C]">{title}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </div>

      <div className="bg-[#0F1923] rounded-2xl p-5 text-white">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            {t('grossRent')}
          </span>
          <span className="text-2xl font-bold">{formatPrice(Math.round(grossRent))}<span className="text-xs font-normal text-gray-400">/mo</span></span>
        </div>
        <div className="flex items-baseline justify-between text-sm pt-2 border-t border-white/10">
          <span className="text-gray-400">{t('effectiveAfterOcc')}</span>
          <span className="font-semibold">{formatPrice(effectiveRent)}/mo</span>
        </div>
        <div className="flex items-baseline justify-between text-sm pt-2">
          <span className="text-propyte-brand font-medium">{t('netAfterExpenses')}</span>
          <span className="font-bold text-propyte-brand">{formatPrice(netRent)}/mo</span>
        </div>
        {monthlyPayment > 0 && (
          <div className="flex items-baseline justify-between text-sm pt-2 border-t border-white/10 mt-2">
            <span className="text-gray-400">{t('minusMonthlyLoan')}</span>
            <span className="font-medium">−{formatPrice(monthlyPayment)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricTile label={t('grossYield')} value={formatPercentage(grossYield)} />
        <MetricTile label={t('netYield')} value={formatPercentage(netYield)} />
        <MetricTile label="Cap rate" value={formatPercentage(capRate)} />
        <MetricTile label="Cash-on-cash" value={formatPercentage(cashOnCash)} color={cashOnCash >= 0 ? '#22C55E' : '#EF4444'} />
        <MetricTile
          label={t('monthlyNetFlow')}
          value={formatPrice(Math.round(monthlyNet))}
          color={monthlyNet >= 0 ? '#22C55E' : '#EF4444'}
        />
        <MetricTile
          label={t('breakeven')}
          value={breakeven === Infinity ? '—' : `${breakeven} ${t('monthsShort')}`}
        />
      </div>
    </div>
  );
}

function MetricTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-2xs text-gray-600 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-bold" style={{ color: color || '#1A2F3F' }}>{value}</div>
    </div>
  );
}

function Slider({
  label, value, display, min, max, step, onChange,
}: {
  label: string; value: number; display: string;
  min: number; max: number; step: number; onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <label className="font-medium text-gray-700">{label}</label>
        <span className="font-semibold text-[#2C2C2C]">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#A2F9FF]"
      />
    </div>
  );
}

function FinKV({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-2xs text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="font-bold">{value}</div>
      {note && <div className="text-2xs text-gray-600">{note}</div>}
    </div>
  );
}

function ProjTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-[#0F1923] text-white' : 'bg-gray-50'}`}>
      <div className={`text-xl font-bold ${highlight ? 'text-propyte-brand' : 'text-[#1A2F3F]'}`}>{value}</div>
      <div className={`text-xs mt-1 ${highlight ? 'text-gray-600' : 'text-gray-600'}`}>{label}</div>
    </div>
  );
}

function CashflowTable({
  cashflows, totalInvested,
}: { cashflows: number[]; locale: string; totalInvested: number }) {
  const t = useTranslations('simulator');
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="text-sm font-bold text-[#2C2C2C]">
          {t('annualCashflow')}
        </div>
        <div className="text-2xs text-gray-600">
          {t('cashflowExplanation')}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white">
              <th className="px-3 py-2 text-left text-2xs uppercase tracking-wider text-gray-600 font-semibold">
                {t('yearLabel')}
              </th>
              <th className="px-3 py-2 text-right text-2xs uppercase tracking-wider text-gray-600 font-semibold">
                {t('cashflowLabel')}
              </th>
              <th className="px-3 py-2 text-right text-2xs uppercase tracking-wider text-gray-600 font-semibold">
                {t('cumulative')}
              </th>
            </tr>
          </thead>
          <tbody>
            {cashflows.map((cf, i) => {
              const cum = cashflows.slice(0, i + 1).reduce((s, n) => s + n, 0);
              const cumPositive = cum >= 0;
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-700 font-medium">{i}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${cf < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {cf < 0 ? '−' : ''}{formatPrice(Math.abs(Math.round(cf)))}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${cumPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {cum < 0 ? '−' : ''}{formatPrice(Math.abs(Math.round(cum)))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#0F1923] text-white">
              <td className="px-3 py-2 text-xs uppercase tracking-wider">
                {t('investedLabel')}
              </td>
              <td colSpan={2} className="px-3 py-2 text-right font-bold">
                {formatPrice(totalInvested)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
