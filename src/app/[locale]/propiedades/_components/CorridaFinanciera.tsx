'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { buildAmortizationSchedule, engancheMxn } from '@/lib/calculator';
import { formatPrice } from '@/lib/formatters';

const COLOR_CAPITAL = '#5CE0D2';
const COLOR_INTEREST = '#1A2F3F';
const PREVIEW_ROWS = 12;

interface CorridaFinancieraProps {
  price: number;
  downPaymentPct: number;
  months: number[];
  annualRate: number;
  esquema?: string;
}

export default function CorridaFinanciera({
  price, downPaymentPct, months, annualRate, esquema,
}: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const termOptions = months.length > 0 ? months : [12];
  const [term, setTerm] = useState(termOptions[0]);
  const [expanded, setExpanded] = useState(false);

  const down = engancheMxn(price, downPaymentPct);
  const principal = Math.max(0, price - down);
  const schedule = useMemo(
    () => buildAmortizationSchedule(principal, annualRate, term),
    [principal, annualRate, term],
  );

  const chartData = useMemo(
    () => schedule.rows.map((r) => ({
      mes: r.mes,
      [t('colCapital')]: Math.round(r.capital),
      [t('colInterest')]: Math.round(r.interes),
    })),
    [schedule, t],
  );

  const visibleRows = expanded ? schedule.rows : schedule.rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{t('title')}</h3>
        <p className="text-xs text-gray-600">{t('subtitle')}</p>
      </div>

      {termOptions.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('term')}</label>
          <div className="flex flex-wrap gap-2">
            {termOptions.map((m) => (
              <button
                key={m}
                onClick={() => { setTerm(m); setExpanded(false); }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  term === m
                    ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand'
                    : 'border-gray-200 hover:border-propyte-brand text-gray-700'
                }`}
              >
                {t('months', { m })}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KV label={t('downPayment')} value={formatPrice(down)} note={`${downPaymentPct}%`} />
        <KV label={t('financedAmount')} value={formatPrice(principal)} />
        <KV label={t('monthlyPayment')} value={formatPrice(Math.round(schedule.cuota))} highlight />
        <KV label={t('totalInterest')} value={schedule.tieneInteres ? formatPrice(Math.round(schedule.totalIntereses)) : '—'} />
      </div>

      {!schedule.tieneInteres && (
        <p className="text-2xs text-gray-600">{t('noInterest')}</p>
      )}

      {schedule.tieneInteres && (
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{t('chartTitle')}</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatPrice(v)} tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => formatPrice(Number(v) || 0)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={t('colCapital')} stackId="a" fill={COLOR_CAPITAL} />
                <Bar dataKey={t('colInterest')} stackId="a" fill={COLOR_INTEREST} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-2xs uppercase tracking-wider text-gray-600">
              <th className="px-3 py-2 text-left">{t('colMonth')}</th>
              <th className="px-3 py-2 text-right">{t('colPayment')}</th>
              {schedule.tieneInteres && <th className="px-3 py-2 text-right">{t('colInterest')}</th>}
              <th className="px-3 py-2 text-right">{t('colCapital')}</th>
              <th className="px-3 py-2 text-right">{t('colBalance')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r, idx) => (
              <tr key={r.mes} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-gray-700 font-medium">{r.mes}</td>
                <td className="px-3 py-2 text-right">{formatPrice(Math.round(r.cuota))}</td>
                {schedule.tieneInteres && (
                  <td className="px-3 py-2 text-right text-gray-500">{formatPrice(Math.round(r.interes))}</td>
                )}
                <td className="px-3 py-2 text-right font-semibold">{formatPrice(Math.round(r.capital))}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatPrice(Math.round(r.saldo))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schedule.rows.length > PREVIEW_ROWS && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-sm font-semibold text-[#0E7490] hover:underline"
        >
          {expanded ? t('showLess') : t('showAll', { n: schedule.rows.length })}
        </button>
      )}

      {esquema && <p className="text-2xs text-gray-600 leading-relaxed">{esquema}</p>}
      <p className="text-2xs text-gray-500 leading-relaxed">{t('disclaimer')}</p>
    </div>
  );
}

function KV({ label, value, note, highlight }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-[#0F1923] text-white' : 'bg-gray-50'}`}>
      <div className={`text-2xs uppercase tracking-wider ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-propyte-brand' : 'text-[#1A2F3F]'}`}>{value}</div>
      {note && <div className={`text-2xs ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{note}</div>}
    </div>
  );
}
