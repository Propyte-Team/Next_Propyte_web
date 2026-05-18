'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calculator, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';

const COLOR_PRINCIPAL = '#5CE0D2';
const COLOR_INTEREST = '#1A2F3F';

export default function MortgageCalculator() {
  const t = useTranslations('mortgageCalc');
  const locale = useLocale();
  const { format, currency } = useCurrency();

  // State (MXN values internamente; conversión a USD vía CurrencyContext)
  const [amount, setAmount] = useState(3_000_000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termYears, setTermYears] = useState(15);
  const [annualRate, setAnnualRate] = useState(11);

  const calc = useMemo(() => {
    const downPayment = amount * (downPaymentPct / 100);
    const principal = amount - downPayment;
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = termYears * 12;

    const monthlyPayment =
      monthlyRate === 0
        ? principal / totalMonths
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalPaid = monthlyPayment * totalMonths;
    const totalInterest = totalPaid - principal;

    return { downPayment, principal, monthlyPayment, totalPaid, totalInterest };
  }, [amount, downPaymentPct, termYears, annualRate]);

  const pieData = [
    { name: t('chartPrincipal'), value: Math.round(calc.principal), color: COLOR_PRINCIPAL },
    { name: t('chartInterest'), value: Math.round(calc.totalInterest), color: COLOR_INTEREST },
  ];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5CE0D2]/10 rounded-full mb-3">
            <Calculator size={14} className="text-[#0E7490]" />
            <span className="text-[#0E7490] text-xs font-semibold uppercase tracking-wide">
              {t('eyebrow')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">{t('title')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Inputs */}
          <div className="bg-[#F4F6F8] rounded-2xl p-6 md:p-8 space-y-6">
            <Slider
              label={t('amount')}
              value={amount}
              min={500_000}
              max={20_000_000}
              step={100_000}
              format={(v) => format(v)}
              onChange={setAmount}
            />
            <Slider
              label={t('downPayment')}
              value={downPaymentPct}
              min={5}
              max={80}
              step={5}
              format={(v) => `${v}% · ${format((amount * v) / 100)}`}
              onChange={setDownPaymentPct}
            />
            <Slider
              label={t('termYears')}
              value={termYears}
              min={5}
              max={25}
              step={1}
              format={(v) => `${v} ${t('yearsSuffix')}`}
              onChange={setTermYears}
            />
            <Slider
              label={t('annualRate')}
              value={annualRate}
              min={5}
              max={20}
              step={0.25}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={setAnnualRate}
            />
          </div>

          {/* Output */}
          <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-6 md:p-8 text-white">
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-wider text-[#5CE0D2] mb-1">
                {t('monthlyPayment')}
              </div>
              <div className="text-4xl md:text-5xl font-bold tabular-nums">
                {format(Math.round(calc.monthlyPayment))}
              </div>
              <div className="text-xs text-white/75 mt-1">{currency}/{t('monthShort')}</div>
            </div>

            <div className="h-44 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => format(typeof v === 'number' ? v : Number(v) || 0)}
                    contentStyle={{
                      background: 'rgba(15, 25, 35, 0.95)',
                      border: '1px solid rgba(92, 224, 210, 0.3)',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-sm">
              <KPI label={t('principal')} value={format(Math.round(calc.principal))} />
              <KPI label={t('totalInterest')} value={format(Math.round(calc.totalInterest))} />
              <KPI label={t('totalPaid')} value={format(Math.round(calc.totalPaid))} highlight />
              <KPI label={t('downPaymentValue')} value={format(Math.round(calc.downPayment))} />
            </div>

            <Link
              href={`/${locale}/contacto?asunto=financiamiento`}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
            >
              {t('ctaAdvisor')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mt-8 max-w-2xl mx-auto">
          {t('disclaimer')}
        </p>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-[#1A2F3F]">{label}</label>
        <span className="text-sm font-bold text-[#0E7490] tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5CE0D2]"
        aria-label={label}
      />
    </div>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        highlight ? 'border-t border-white/15 mt-2 pt-3 font-bold' : ''
      }`}
    >
      <span className={highlight ? 'text-white' : 'text-white/65'}>{label}</span>
      <span className={`tabular-nums ${highlight ? 'text-[#5CE0D2]' : 'text-white'}`}>{value}</span>
    </div>
  );
}
