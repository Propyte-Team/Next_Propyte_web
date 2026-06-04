'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { TrendingUp, ArrowRight } from '@/lib/icons';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import type { ComparatorRates } from '@/lib/market-stats';

/**
 * Metadatos de cada instrumento (id/label/estilo). Las TASAS llegan por prop
 * `rates` desde el Hub (herramienta de mercado) — NO se hardcodean aquí.
 * Este componente solo se monta cuando hay las 5 tasas reales (gate en la
 * página). NO es recomendación financiera; disclaimer en el footer.
 */
const INSTRUMENTS = [
  { id: 'propyte', key: 'inmobiliaria', color: '#5CE0D2', highlight: true },
  { id: 'fibras', key: 'fibras', color: 'rgba(255,255,255,0.16)' },
  { id: 'bolsa', key: 'bolsa', color: 'rgba(255,255,255,0.16)' },
  { id: 'cetes', key: 'cetes', color: 'rgba(255,255,255,0.16)' },
  { id: 'banco', key: 'banco', color: 'rgba(255,255,255,0.16)' },
] as const;

export default function InvestmentComparison({ rates }: { rates: ComparatorRates }) {
  const t = useTranslations('comparison');
  const locale = useLocale();
  // Comparativa de inversión es calculadora interna MXN — no muestra precio
  // de propiedad. Usa formatMxn como helper puro.
  const { formatMxn } = useCurrency();
  const format = formatMxn;
  const currency = 'MXN';

  const [capital, setCapital] = useState(1_000_000);
  const [years, setYears] = useState(10);

  const data = useMemo(
    () =>
      INSTRUMENTS.map((inst) => {
        const rate = rates[inst.key];
        const fv = capital * Math.pow(1 + rate, years);
        const profit = fv - capital;
        return {
          id: inst.id,
          name: t(`labels.${inst.id}`),
          rate,
          fv: Math.round(fv),
          profit: Math.round(profit),
          color: inst.color,
          highlight: 'highlight' in inst && inst.highlight === true,
        };
      }).sort((a, b) => b.fv - a.fv),
    [capital, years, t, rates],
  );

  const winner = data[0];
  const winnerProfit = winner.profit;
  const winnerLabel = winner.name;

  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 right-20 w-80 h-80 bg-propyte-brand/15 rounded-full blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-10 w-96 h-96 bg-[#A2F9FF]/10 rounded-full blur-3xl" />
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-3">
            <TrendingUp size={14} className="text-propyte-brand" />
            <span className="text-propyte-brand text-xs font-semibold uppercase tracking-wide">
              {t('eyebrow')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('title')}</h2>
          <p className="text-white/60 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Inputs */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-6">
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
            <div className="pt-4 border-t border-white/12">
              <div className="text-xs uppercase tracking-wider text-white/50 mb-2">
                {t('winnerLabel')}
              </div>
              <div className="text-2xl font-bold text-propyte-brand">{winnerLabel}</div>
              <div className="text-sm text-white/80 mt-1 tabular-nums">
                +{format(winnerProfit)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6">
            <div className="h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.10)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                    tickFormatter={(v) => format(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    formatter={(v, name) => [format(typeof v === 'number' ? v : Number(v) || 0), name]}
                    contentStyle={{
                      background: '#0F1923',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                    itemStyle={{ color: 'rgba(255,255,255,0.85)' }}
                  />
                  <Bar dataKey="fv" radius={[0, 6, 6, 0]}>
                    {data.map((d) => (
                      <Cell
                        key={d.id}
                        fill={d.color}
                        style={d.highlight ? { filter: 'drop-shadow(0 0 6px rgba(92,224,210,0.7))' } : undefined}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/10">
              {data.map((d) => (
                <div
                  key={d.id}
                  className={`text-center p-2 rounded-lg ${
                    d.highlight ? 'bg-propyte-brand/12 ring-1 ring-propyte-brand/35' : 'bg-white/5'
                  }`}
                >
                  <div className="text-2xs text-white/55 uppercase tracking-wide">{d.name}</div>
                  <div className={`text-sm font-bold tabular-nums ${d.highlight ? 'text-propyte-brand' : 'text-white'}`}>
                    {(d.rate * 100).toFixed(1)}%
                    {d.highlight && rates.reReferential && (
                      <span className="text-[#A2F9FF] font-semibold" title={t('referentialNote')}> *</span>
                    )}
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

        <p className="text-xs text-white/55 text-center mt-6 max-w-3xl mx-auto">
          {t('disclaimer', { currency })}
        </p>
        {rates.reReferential && (
          <p className="text-xs text-white/45 text-center mt-2 max-w-3xl mx-auto">
            {t('referentialNote')}
          </p>
        )}
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
        <label className="text-sm font-semibold text-white/85">{label}</label>
        <span className="text-sm font-bold text-propyte-brand tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#5CE0D2]"
        aria-label={label}
      />
    </div>
  );
}
