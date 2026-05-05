'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

/**
 * Tasas anuales nominales referenciales 2026. Compounding anual.
 * Real Estate Propyte = IRR promedio observado en desarrollos preventa
 * Riviera Maya (Opción B actuarial, ver SPECKIT-METAMORFOSIS sec 33.4).
 *
 * NO son recomendación financiera. Disclaimer en footer del componente.
 */
const INSTRUMENTS = [
  { id: 'propyte', rate: 0.12, color: '#5CE0D2', highlight: true },
  { id: 'fibras', rate: 0.085, color: '#1A2F3F' },
  { id: 'bolsa', rate: 0.10, color: '#1A2F3F' },
  { id: 'cetes', rate: 0.105, color: '#1A2F3F' },
  { id: 'banco', rate: 0.05, color: '#1A2F3F' },
] as const;

export default function InvestmentComparison() {
  const t = useTranslations('comparison');
  const locale = useLocale();
  const { format, currency } = useCurrency();

  const [capital, setCapital] = useState(1_000_000);
  const [years, setYears] = useState(10);

  const data = useMemo(
    () =>
      INSTRUMENTS.map((inst) => {
        const fv = capital * Math.pow(1 + inst.rate, years);
        const profit = fv - capital;
        return {
          id: inst.id,
          name: t(`labels.${inst.id}`),
          rate: inst.rate,
          fv: Math.round(fv),
          profit: Math.round(profit),
          color: inst.color,
          highlight: 'highlight' in inst && inst.highlight === true,
        };
      }).sort((a, b) => b.fv - a.fv),
    [capital, years, t],
  );

  const winner = data[0];
  const winnerProfit = winner.profit;
  const winnerLabel = winner.name;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5CE0D2]/10 rounded-full mb-3">
            <TrendingUp size={14} className="text-[#0F766E]" />
            <span className="text-[#0F766E] text-xs font-semibold uppercase tracking-wide">
              {t('eyebrow')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">{t('title')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Inputs */}
          <div className="bg-[#F4F6F8] rounded-2xl p-6 space-y-6">
            <Slider
              label={t('inputCapital')}
              value={capital}
              min={100_000}
              max={20_000_000}
              step={100_000}
              format={(v) => format(v)}
              onChange={setCapital}
            />
            <Slider
              label={t('inputYears')}
              value={years}
              min={1}
              max={30}
              step={1}
              format={(v) => `${v} ${t('yearsSuffix')}`}
              onChange={setYears}
            />
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs uppercase tracking-wider text-gray-600 mb-2">
                {t('winnerLabel')}
              </div>
              <div className="text-2xl font-bold text-[#0F766E]">{winnerLabel}</div>
              <div className="text-sm text-gray-700 mt-1 tabular-nums">
                +{format(winnerProfit)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
            <div className="h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                  <CartesianGrid horizontal={false} stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickFormatter={(v) => format(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#1A2F3F', fontWeight: 600 }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(v, name) => [format(typeof v === 'number' ? v : Number(v) || 0), name]}
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: '#1A2F3F', fontWeight: 600 }}
                  />
                  <Bar dataKey="fv" radius={[0, 6, 6, 0]}>
                    {data.map((d) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-100">
              {data.map((d) => (
                <div
                  key={d.id}
                  className={`text-center p-2 rounded-lg ${
                    d.highlight ? 'bg-[#5CE0D2]/10 ring-1 ring-[#5CE0D2]/30' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-[10px] text-gray-600 uppercase tracking-wide">{d.name}</div>
                  <div className="text-sm font-bold text-[#1A2F3F] tabular-nums">
                    {(d.rate * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href={`/${locale}/contacto?asunto=inversion`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
          >
            {t('ctaAdvisor')}
            <ArrowRight size={16} />
          </Link>
        </div>

        <p className="text-xs text-gray-600 text-center mt-6 max-w-3xl mx-auto">
          {t('disclaimer', { currency })}
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
        <span className="text-sm font-bold text-[#0F766E] tabular-nums">{format(value)}</span>
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
