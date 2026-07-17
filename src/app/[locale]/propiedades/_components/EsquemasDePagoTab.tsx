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
