'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateMonthlyPayment,
  calculateROI,
  calculateCashOnCash,
  calculateBreakeven,
  calculateProjectedValue,
  calculateCapRate,
  calculateGrossYield,
  calculateNetYield,
  calculateIRR,
  getClosingCostRate,
  calculateClosingCosts,
  calculateVacNetRent,
  calculateVacGrossYield,
  calculateVacNetYield,
  VAC,
  RES,
} from '@/lib/calculator';
import { formatPrice, formatPercentage } from '@/lib/formatters';
import type { Property } from '@/types/property';

interface FinancialSimulatorProps {
  property: Property;
  mlEstimatedRent?: number;
  mlEstimatedRentVac?: number;
  state?: string;
  totalComparables?: number;
  dataFreshness?: string;
  airdnaOccupancy?: number;
  airdnaAdr?: number;
}

type RentalMode = 'residencial' | 'vacacional';

export default function FinancialSimulator({
  property, mlEstimatedRent, mlEstimatedRentVac, state,
  totalComparables, dataFreshness, airdnaOccupancy, airdnaAdr,
}: FinancialSimulatorProps) {
  const t = useTranslations('simulator');

  const [mode, setMode] = useState<RentalMode>('residencial');
  const [downPaymentPct, setDownPaymentPct] = useState(property.financing.downPaymentMin);
  const [months, setMonths] = useState(property.financing.months[1] || property.financing.months[0]);
  const [interestRate, setInterestRate] = useState(property.financing.interestRate);
  const [appreciation, setAppreciation] = useState(property.roi.appreciation);
  const [occupancy, setOccupancy] = useState(airdnaOccupancy ?? VAC.DEFAULT_OCCUPANCY * 100);

  // Rent values (read-only)
  const resRent = mlEstimatedRent || property.roi.rentalMonthly;
  const vacRentBase = mlEstimatedRentVac || (airdnaAdr ? airdnaAdr * 30 : resRent * 1.35);
  const monthlyRent = mode === 'residencial' ? resRent : vacRentBase;

  // Investment
  const price = property.price.mxn;
  const closingCostRate = getClosingCostRate(state || 'Quintana Roo');
  const closingCosts = calculateClosingCosts(price, state || 'Quintana Roo');
  const totalPropertyCost = price + closingCosts;
  const downPayment = price * (downPaymentPct / 100);
  const totalInvested = downPayment + closingCosts;

  const results = useMemo(() => {
    const monthly = calculateMonthlyPayment(price, downPaymentPct, months, interestRate);
    const occ = occupancy / 100;
    const isVac = mode === 'vacacional';

    // Effective rent after occupancy
    const effectiveMonthly = isVac ? monthlyRent * occ : monthlyRent * RES.OCCUPANCY;
    // Net rent after expenses
    const expenseRatio = isVac ? (VAC.EXPENSE_RATIO + VAC.PLATFORM_FEE + VAC.MGMT_FEE) : RES.EXPENSE_RATIO;
    const netMonthly = Math.round(effectiveMonthly * (1 - expenseRatio));

    const annualRent = effectiveMonthly * 12;
    const annualRentNet = netMonthly * 12;

    const grossYield = isVac
      ? calculateVacGrossYield(monthlyRent, occ, totalPropertyCost)
      : calculateGrossYield(monthlyRent * RES.OCCUPANCY * 12, totalPropertyCost);
    const netYield = isVac
      ? calculateVacNetYield(monthlyRent, occ, totalPropertyCost)
      : calculateNetYield(monthlyRent * RES.OCCUPANCY * 12, totalPropertyCost);
    const capRate = calculateCapRate(annualRentNet, totalPropertyCost);

    const cashOnCash = calculateCashOnCash(annualRentNet, totalInvested);
    const monthlyNet = netMonthly - monthly;
    const breakeven = calculateBreakeven(totalInvested, Math.max(monthlyNet, 0));

    const roi1 = calculateROI(price, downPaymentPct, annualRent, appreciation, 1);
    const roi3 = calculateROI(price, downPaymentPct, annualRent, appreciation, 3);
    const roi5 = calculateROI(price, downPaymentPct, annualRent, appreciation, 5);
    const projectedValue = calculateProjectedValue(price, appreciation, 5);

    // IRR
    const annualNetFlow = monthlyNet * 12;
    const sale5 = calculateProjectedValue(price, appreciation, 5);
    const remaining5 = Math.max(0, price * (1 - downPaymentPct / 100) - monthly * 60);
    const cf5 = [-totalInvested, ...Array(4).fill(annualNetFlow), annualNetFlow + sale5 - remaining5];
    const irr5 = calculateIRR(cf5);

    const sale10 = calculateProjectedValue(price, appreciation, 10);
    const remaining10 = Math.max(0, price * (1 - downPaymentPct / 100) - monthly * 120);
    const cf10 = [-totalInvested, ...Array(9).fill(annualNetFlow), annualNetFlow + sale10 - remaining10];
    const irr10 = calculateIRR(cf10);

    return {
      monthly, effectiveMonthly: Math.round(effectiveMonthly), netMonthly,
      grossYield, netYield, capRate, cashOnCash, monthlyNet, breakeven,
      roi1, roi3, roi5, projectedValue, irr5, irr10,
      expenseRatio, annualRent: Math.round(annualRent),
    };
  }, [price, downPaymentPct, months, interestRate, monthlyRent, appreciation, totalInvested, totalPropertyCost, mode, occupancy]);

  const freshnessDate = dataFreshness
    ? new Date(dataFreshness).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const hasAirdna = airdnaOccupancy != null;

  return (
    <div className="space-y-6">
      {/* ── Investment Overview Card ── */}
      <div className="bg-[#0F1923] rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {t('investmentAnalysis')}
            <span className="px-2 py-0.5 bg-[#5CE0D2]/20 text-[#5CE0D2] text-[10px] font-bold rounded-full uppercase tracking-wider">
              {mode === 'vacacional' ? 'Airbnb' : 'Long-term'}
            </span>
          </h2>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/5 rounded-lg p-0.5 mb-6">
          <button
            onClick={() => setMode('residencial')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === 'residencial' ? 'bg-[#5CE0D2] text-[#0F1923]' : 'text-gray-400 hover:text-white'}`}
          >
            Residencial
          </button>
          <button
            onClick={() => setMode('vacacional')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === 'vacacional' ? 'bg-[#5CE0D2] text-[#0F1923]' : 'text-gray-400 hover:text-white'}`}
          >
            Vacacional (Airbnb)
          </button>
        </div>

        {/* Investment breakdown */}
        <div className="space-y-3 mb-6">
          <Row label={t('propertyPrice')} value={formatPrice(price)} />
          <Row label={`${t('closingCosts')} (${Math.round(closingCostRate * 100)}%)`} value={formatPrice(closingCosts)} />
          <div className="border-t border-white/10 pt-3">
            <Row label={t('totalInvestment')} value={formatPrice(totalPropertyCost)} bold />
          </div>
        </div>

        {/* Rent estimate — read-only */}
        <div className="bg-[#5CE0D2]/10 border border-[#5CE0D2]/20 rounded-xl p-4 mb-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#5CE0D2] font-medium">
              {mode === 'vacacional' ? 'Renta bruta vacacional' : t('estimatedMonthlyRent')}
            </span>
            <span className="text-2xl font-bold text-white">
              {formatPrice(Math.round(monthlyRent))}<span className="text-sm font-normal text-gray-400">/mes</span>
            </span>
          </div>

          {/* Vacation: show occupancy + effective rent */}
          {mode === 'vacacional' && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Ocupación {hasAirdna ? '(AirDNA)' : '(estimada)'}
                </span>
                <span className="font-medium text-white">{occupancy.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Renta efectiva</span>
                <span className="font-medium text-white">{formatPrice(results.effectiveMonthly)}/mes</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            {mode === 'vacacional'
              ? `Estimación basada en ${hasAirdna ? 'datos AirDNA del mercado' : 'comparables vacacionales'}. ${hasAirdna ? `Ocupación real del mercado: ${airdnaOccupancy?.toFixed(1)}%.` : ''}`
              : `Valor promedio analizado en nuestra base de datos con más de ${(totalComparables || 10000).toLocaleString()} registros, actualizada al ${freshnessDate}.`
            }
          </p>
        </div>

        {/* Expense breakdown (vacation only) */}
        {mode === 'vacacional' && (
          <div className="bg-white/5 rounded-xl p-3 mb-6 space-y-1.5 text-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Desglose de gastos</div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gastos operativos</span>
              <span className="text-gray-300">{Math.round(VAC.EXPENSE_RATIO * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Comisión Airbnb</span>
              <span className="text-gray-300">{Math.round(VAC.PLATFORM_FEE * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Administración</span>
              <span className="text-gray-300">{Math.round(VAC.MGMT_FEE * 100)}%</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1.5">
              <span className="text-gray-300 font-medium">Total gastos</span>
              <span className="text-white font-bold">{Math.round(results.expenseRatio * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5CE0D2] font-medium">Renta neta</span>
              <span className="text-[#5CE0D2] font-bold">{formatPrice(results.netMonthly)}/mes</span>
            </div>
          </div>
        )}

        {/* Key metrics table */}
        <div className="rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <tbody>
              <MetricRow label="Yield bruto anual" value={formatPercentage(results.grossYield)} accent />
              <MetricRow label="Yield neto anual" value={formatPercentage(results.netYield)} />
              <MetricRow label="Cap rate" value={formatPercentage(results.capRate)} accent />
              <MetricRow label="Cash-on-cash" value={formatPercentage(results.cashOnCash)} color={results.cashOnCash >= 0 ? '#22C55E' : '#EF4444'} />
              <MetricRow label="Flujo neto mensual" value={formatPrice(Math.round(results.monthlyNet))} color={results.monthlyNet >= 0 ? '#22C55E' : '#EF4444'} accent />
              <MetricRow label="Punto de equilibrio" value={results.breakeven === Infinity ? '—' : `${results.breakeven} meses`} />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ROI Projection Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Retorno proyectado</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ProjectionBlock label="1 año" value={`${results.roi1.toFixed(1)}%`} />
          <ProjectionBlock label="3 años" value={`${results.roi3.toFixed(1)}%`} />
          <ProjectionBlock label="5 años" value={`${results.roi5.toFixed(1)}%`} highlight />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-xs text-gray-400 mb-1">TIR 5 años</div>
            <div className="text-xl font-bold text-[#5CE0D2]">{results.irr5 != null ? formatPercentage(results.irr5) : '—'}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-xs text-gray-400 mb-1">TIR 10 años</div>
            <div className="text-xl font-bold text-[#5CE0D2]">{results.irr10 != null ? formatPercentage(results.irr10) : '—'}</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-2">Valor proyectado (5 años)</div>
          <div className="text-xl font-bold text-[#2C2C2C] mb-2">{formatPrice(results.projectedValue)}</div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#5CE0D2] to-[#22C55E] rounded-full transition-all" style={{ width: `${Math.min((results.projectedValue / price) * 50, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{formatPrice(price)}</span>
            <span>{formatPrice(results.projectedValue)}</span>
          </div>
        </div>
      </div>

      {/* ── Financing Simulator ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">{t('title')}</h3>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium text-gray-700">{t('downPayment')}</label>
              <span className="font-semibold">{downPaymentPct}% ({formatPrice(downPayment)})</span>
            </div>
            <input type="range" min={10} max={100} value={downPaymentPct} onChange={e => setDownPaymentPct(Number(e.target.value))} className="w-full accent-[#5CE0D2]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('term')}</label>
            <div className="flex gap-2 flex-wrap">
              {property.financing.months.map(m => (
                <button key={m} onClick={() => setMonths(m)} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${months === m ? 'bg-[#5CE0D2] text-white border-[#5CE0D2]' : 'border-gray-200 hover:border-[#5CE0D2]'}`}>
                  {m} {t('months')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('interestRate')}</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={15} step={0.5} value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-24 h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none" />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          {/* Occupancy slider (vacation only) */}
          {mode === 'vacacional' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="font-medium text-gray-700">
                  Tasa de ocupación {hasAirdna && <span className="text-[10px] text-[#5CE0D2] ml-1">AirDNA</span>}
                </label>
                <span className="font-semibold">{occupancy.toFixed(0)}%</span>
              </div>
              <input type="range" min={40} max={100} step={1} value={occupancy} onChange={e => setOccupancy(Number(e.target.value))} className="w-full accent-[#5CE0D2]" />
            </div>
          )}

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium text-gray-700">{t('appreciation')}</label>
              <span className="font-semibold">{appreciation}%</span>
            </div>
            <input type="range" min={0} max={20} step={0.5} value={appreciation} onChange={e => setAppreciation(Number(e.target.value))} className="w-full accent-[#5CE0D2]" />
          </div>

          {results.monthly > 0 && (
            <div className="bg-[#0F1923] rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">{t('monthlyPayment')}</span>
              <span className="text-xl font-bold text-white">{formatPrice(results.monthly)}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed px-2">{t('disclaimer')}</p>
    </div>
  );
}

// ── Sub-components ──

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold text-white' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>{value}</span>
    </div>
  );
}

function MetricRow({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  return (
    <tr className={accent ? 'bg-white/[0.03]' : ''}>
      <td className="px-4 py-3 text-gray-400 text-sm">{label}</td>
      <td className="px-4 py-3 text-right font-bold text-sm" style={color ? { color } : { color: '#5CE0D2' }}>{value}</td>
    </tr>
  );
}

function ProjectionBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-[#0F1923] text-white' : 'bg-gray-50'}`}>
      <div className="text-xl font-bold text-[#5CE0D2]">{value}</div>
      <div className="text-xs mt-1 text-gray-400">{label}</div>
    </div>
  );
}
