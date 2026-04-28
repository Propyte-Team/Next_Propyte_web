import { getTranslations } from 'next-intl/server';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import {
  getClosingCostRate,
  calculateClosingCosts,
  calculateTotalInvestment,
  calculateCashOnCash,
  calculateBreakeven,
  calculateIRR,
  calculateMonthlyPayment,
  calculateRemainingBalanceActuarial,
  buildCashflows,
  VAC,
  RES,
} from '@/lib/calculator';
import type { DevelopmentFinancialsRow } from '@/lib/supabase/types';

interface InvestmentSummaryProps {
  financials: DevelopmentFinancialsRow;
  locale: string;
  price?: number | null;
  state?: string | null;
  estimatedRent?: number | null;
  estimatedRentVac?: number | null;
  airdnaOccupancy?: number | null;
}

interface ComputedSet {
  rent: number;
  occupancy: number;
  expenseRatio: number;
  netMonthly: number;
  grossYield: number;
  netYield: number;
  capRate: number;
  cashOnCash: number;
  breakeven: number;
  irr5yr: number | null;
  irr10yr: number | null;
}

// Default financing assumptions for server-side InvestmentSummary (no user sliders here —
// FinancialSimulator on the client exposes tunables). Keep in sync with WP defaults.
const DEFAULT_APPRECIATION_PCT = 8;
const DEFAULT_DOWN_PAYMENT_PCT = 30;
const DEFAULT_INTEREST_RATE_PCT = 12;
const DEFAULT_LOAN_MONTHS = 120;

function computeMetrics(
  rent: number, price: number, totalInv: number,
  occupancy: number, expenseRatio: number,
): ComputedSet {
  const effectiveMonthly = rent * occupancy;
  const netMonthly = Math.round(effectiveMonthly * (1 - expenseRatio));
  const annualNet = netMonthly * 12;
  const annualGross = effectiveMonthly * 12;

  const grossYield = totalInv > 0 ? (annualGross / totalInv) * 100 : 0;
  const netYield = totalInv > 0 ? (annualNet / totalInv) * 100 : 0;
  const capRate = totalInv > 0 ? (annualNet / totalInv) * 100 : 0;
  const cashOnCash = calculateCashOnCash(annualNet, totalInv);
  const breakeven = calculateBreakeven(totalInv, netMonthly);

  // IRR — actuarial model: Next's numbers diverge from WP legacy by ~1-3 pp because
  // WP does not model the mortgage at all in its IRR. Documented in calculator.ts.
  const downPayment = price * (DEFAULT_DOWN_PAYMENT_PCT / 100);
  const closingCosts = totalInv - price; // totalInv = price + closingCosts
  const totalInvestedAtStart = downPayment + closingCosts;
  const monthlyPayment = calculateMonthlyPayment(
    price,
    DEFAULT_DOWN_PAYMENT_PCT,
    DEFAULT_LOAN_MONTHS,
    DEFAULT_INTEREST_RATE_PCT
  );
  const annualNetFlow = annualNet - monthlyPayment * 12;

  const cf5 = buildCashflows({
    totalInvested: totalInvestedAtStart,
    annualNetFlow,
    price,
    appreciationPct: DEFAULT_APPRECIATION_PCT,
    years: 5,
    remainingBalance: calculateRemainingBalanceActuarial(
      price,
      DEFAULT_DOWN_PAYMENT_PCT,
      DEFAULT_INTEREST_RATE_PCT,
      DEFAULT_LOAN_MONTHS,
      60
    ),
  });
  const irr5yr = calculateIRR(cf5);

  const cf10 = buildCashflows({
    totalInvested: totalInvestedAtStart,
    annualNetFlow,
    price,
    appreciationPct: DEFAULT_APPRECIATION_PCT,
    years: 10,
    remainingBalance: calculateRemainingBalanceActuarial(
      price,
      DEFAULT_DOWN_PAYMENT_PCT,
      DEFAULT_INTEREST_RATE_PCT,
      DEFAULT_LOAN_MONTHS,
      120
    ),
  });
  const irr10yr = calculateIRR(cf10);

  return {
    rent, occupancy, expenseRatio, netMonthly,
    grossYield, netYield, capRate, cashOnCash,
    breakeven: breakeven === Infinity ? 0 : breakeven,
    irr5yr, irr10yr,
  };
}

export default async function InvestmentSummary({
  financials, locale, price, state, estimatedRent, estimatedRentVac, airdnaOccupancy,
}: InvestmentSummaryProps) {
  const t = await getTranslations({ locale, namespace: 'simulator' });

  // Single-source-of-truth: precomputed (trigger SQL) tiene prioridad sobre
  // ML comparables del frontend. El backend ya cruzó airdna_metrics + rental_estimates
  // y guardó el resultado en development_financials al aprobar el desarrollo.
  const rentRes = financials.estimated_rent_residencial || estimatedRent;
  const rentVac = financials.estimated_rent_vacacional || estimatedRentVac;
  const hasPrice = price && price > 0;
  const hasState = !!state;
  const canCompute = hasPrice && hasState && rentRes && rentRes > 0;

  if (!canCompute && !financials.rent_yield_gross) return null;

  const closingRate = hasState ? getClosingCostRate(state) : 0.08;
  const closingCosts = hasPrice ? calculateClosingCosts(price, state || 'Quintana Roo') : 0;
  const totalInv = hasPrice ? calculateTotalInvestment(price, state || 'Quintana Roo') : 0;

  // Compute both scenarios
  const res = canCompute ? computeMetrics(rentRes, price, totalInv, RES.OCCUPANCY, RES.EXPENSE_RATIO) : null;
  const vacOccupancy = (airdnaOccupancy != null ? airdnaOccupancy / 100 : financials.occupancy_rate_vac ?? VAC.DEFAULT_OCCUPANCY);
  const vacCostRatio = VAC.EXPENSE_RATIO + VAC.PLATFORM_FEE + VAC.MGMT_FEE;
  const vac = canCompute && rentVac && rentVac > 0
    ? computeMetrics(rentVac, price, totalInv, vacOccupancy, vacCostRatio)
    : null;

  const showDual = res && vac;

  // Single-source-of-truth: precomputed (trigger SQL) tiene prioridad.
  // Solo usamos `res` (computed local) cuando el campo precomputed no existe
  // o es 0 (caso edge: aprobación reciente sin recompute aún).
  const fin = financials;
  const displayMetrics = {
    rent: fin.estimated_rent_residencial || res?.rent || 0,
    occupancy: fin.occupancy_rate_res || res?.occupancy || 0.95,
    expenseRatio: res?.expenseRatio ?? 0.20,
    netMonthly: fin.monthly_net_flow || res?.netMonthly || 0,
    grossYield: fin.rent_yield_gross || res?.grossYield || 0,
    netYield: fin.rent_yield_net || res?.netYield || 0,
    capRate: fin.cap_rate || res?.capRate || 0,
    cashOnCash: fin.cash_on_cash_pct || res?.cashOnCash || 0,
    breakeven: fin.breakeven_months || res?.breakeven || 0,
    irr5yr: fin.irr_5yr ?? res?.irr5yr ?? null,
    irr10yr: fin.irr_10yr ?? res?.irr10yr ?? null,
  };

  const monthLabel = t('monthlyLabel');
  const rows: Array<{ label: string; resValue: string; vacValue?: string; resColor?: string; vacColor?: string }> = [
    {
      label: t('monthlyRent'),
      resValue: formatPrice(displayMetrics.rent),
      vacValue: vac ? formatPrice(vac.rent) : undefined,
    },
    {
      label: t('occupancy'),
      resValue: `${Math.round((res?.occupancy ?? 0.95) * 100)}%`,
      vacValue: vac ? `${Math.round(vac.occupancy * 100)}%` : undefined,
    },
    {
      label: t('expenses'),
      resValue: `${Math.round((res?.expenseRatio ?? 0.20) * 100)}%`,
      vacValue: vac ? `${Math.round(vac.expenseRatio * 100)}%` : undefined,
    },
    {
      label: t('netCashFlow'),
      resValue: formatPrice(displayMetrics.netMonthly),
      vacValue: vac ? formatPrice(vac.netMonthly) : undefined,
      resColor: (displayMetrics.netMonthly ?? 0) >= 0 ? '#22C55E' : '#EF4444',
      vacColor: vac ? ((vac.netMonthly ?? 0) >= 0 ? '#22C55E' : '#EF4444') : undefined,
    },
    {
      label: t('grossYield'),
      resValue: formatPercentage(displayMetrics.grossYield),
      vacValue: vac ? formatPercentage(vac.grossYield) : undefined,
    },
    {
      label: t('netYield'),
      resValue: formatPercentage(displayMetrics.netYield),
      vacValue: vac ? formatPercentage(vac.netYield) : undefined,
    },
    {
      label: t('capRate'),
      resValue: formatPercentage(displayMetrics.capRate),
      vacValue: vac ? formatPercentage(vac.capRate) : undefined,
    },
    {
      label: t('cashOnCash'),
      resValue: formatPercentage(displayMetrics.cashOnCash),
      vacValue: vac ? formatPercentage(vac.cashOnCash) : undefined,
      resColor: (displayMetrics.cashOnCash ?? 0) >= 0 ? '#22C55E' : '#EF4444',
      vacColor: vac ? ((vac.cashOnCash ?? 0) >= 0 ? '#22C55E' : '#EF4444') : undefined,
    },
    {
      label: t('breakeven'),
      resValue: displayMetrics.breakeven ? `${displayMetrics.breakeven} ${monthLabel}` : '—',
      vacValue: vac ? (vac.breakeven ? `${vac.breakeven} ${monthLabel}` : '—') : undefined,
    },
    {
      label: t('irr5yr'),
      resValue: displayMetrics.irr5yr != null ? formatPercentage(displayMetrics.irr5yr) : '—',
      vacValue: vac ? (vac.irr5yr != null ? formatPercentage(vac.irr5yr) : '—') : undefined,
    },
    {
      label: t('irr10yr'),
      resValue: displayMetrics.irr10yr != null ? formatPercentage(displayMetrics.irr10yr) : '—',
      vacValue: vac ? (vac.irr10yr != null ? formatPercentage(vac.irr10yr) : '—') : undefined,
    },
  ];

  return (
    <div className="bg-[#F4F6F8] rounded-xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-[#2C2C2C]">
          {showDual ? t('residentialVsVacation') : t('investmentAnalysis')}
        </h2>
        <span className="px-2 py-0.5 bg-[#5CE0D2]/15 text-[#5CE0D2] text-xs font-medium rounded-full">
          {res ? t('comparablesBased') : t('mlEstimated')}
        </span>
      </div>

      {/* Investment breakdown */}
      {canCompute && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('propertyPrice')}</span>
            <span className="font-medium">{formatPrice(price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('closingCosts')} ({Math.round(closingRate * 100)}%)</span>
            <span className="font-medium">{formatPrice(closingCosts)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
            <span className="font-semibold text-gray-700">{t('totalInvestment')}</span>
            <span className="font-bold text-gray-900">{formatPrice(totalInv)}</span>
          </div>
        </div>
      )}

      {/* Comparative table */}
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0F1923] text-white">
              <th className="px-4 py-3 text-left font-medium text-gray-300">{t('metric')}</th>
              <th className="px-4 py-3 text-right font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  {t('residencial')}
                </span>
              </th>
              {showDual && (
                <th className="px-4 py-3 text-right font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    {t('vacacional')}
                    {airdnaOccupancy != null && (
                      <span className="px-1.5 py-0.5 bg-[#5CE0D2]/20 text-[#5CE0D2] text-[9px] rounded">AirDNA</span>
                    )}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5 text-gray-500">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-bold" style={row.resColor ? { color: row.resColor } : { color: '#5CE0D2' }}>
                  {row.resValue}
                </td>
                {showDual && (
                  <td className="px-4 py-2.5 text-right font-bold" style={row.vacColor ? { color: row.vacColor } : { color: '#5CE0D2' }}>
                    {row.vacValue || '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vacation expense note */}
      {showDual && (
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-400">
          <span>Residencial: gastos {Math.round(RES.EXPENSE_RATIO * 100)}%</span>
          <span>|</span>
          <span>Vacacional: gastos {Math.round(VAC.EXPENSE_RATIO * 100)}% + Airbnb {Math.round(VAC.PLATFORM_FEE * 100)}% + mgmt {Math.round(VAC.MGMT_FEE * 100)}%</span>
          {airdnaOccupancy != null && (
            <>
              <span>|</span>
              <span className="text-[#5CE0D2]">Ocupación {Math.round(airdnaOccupancy)}% (AirDNA)</span>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        {res
          ? t('marketAnalysis', { rate: Math.round(closingRate * 100), state: state || '' })
          : t('mlDisclaimer')
        }
        {' · v'}{financials.model_version}
      </p>
    </div>
  );
}
