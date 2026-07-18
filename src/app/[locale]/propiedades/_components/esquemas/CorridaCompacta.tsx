'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronRight } from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';
import type { AmortSchedule } from '@/lib/calculator';
import { aggregateByYear, type AnnualRow } from '@/lib/corrida-anual';

const COLOR_CAPITAL = '#5CE0D2';
const COLOR_INTEREST = '#1A2F3F';

interface CorridaCompactaProps {
  schedule: AmortSchedule;
  currency?: string;
}

export default function CorridaCompacta({ schedule, currency = 'MXN' }: CorridaCompactaProps) {
  const t = useTranslations('corrida');
  const [byYear, setByYear] = useState(true);
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());
  const fmt = (n: number) => formatPrice(Math.round(n), currency);

  const annual = useMemo(() => aggregateByYear(schedule.rows), [schedule]);
  const chartData = useMemo(
    () => annual.map((y) => ({
      label: t('year', { n: y.anio }),
      [t('colCapital')]: Math.round(y.capital),
      [t('colInterest')]: Math.round(y.interes),
    })),
    [annual, t],
  );

  const toggleYear = (anio: number) =>
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(anio)) next.delete(anio); else next.add(anio);
      return next;
    });

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KV label={t('monthlyPayment')} value={fmt(schedule.cuota)} highlight />
        <KV label={t('totalInterest')} value={schedule.tieneInteres ? fmt(schedule.totalIntereses) : '—'} />
        <KV label={t('totalPaid')} value={fmt(schedule.totalPagado)} />
      </div>

      {!schedule.tieneInteres && <p className="text-2xs text-gray-600">{t('noInterest')}</p>}

      {/* Barras por año */}
      {schedule.tieneInteres && (
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{t('chartTitle')}</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => formatPrice(v, currency)} tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => formatPrice(Number(v) || 0, currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={t('colCapital')} stackId="a" fill={COLOR_CAPITAL} />
                <Bar dataKey={t('colInterest')} stackId="a" fill={COLOR_INTEREST} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Toggle año/mes */}
      <div className="flex gap-2">
        <ToggleBtn active={byYear} onClick={() => setByYear(true)}>{t('viewByYear')}</ToggleBtn>
        <ToggleBtn active={!byYear} onClick={() => setByYear(false)}>{t('viewByMonth')}</ToggleBtn>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-100 overflow-x-auto">
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 text-2xs uppercase tracking-wider text-gray-600">
                <th className="px-3 py-2 text-left">{byYear ? t('colYear') : t('colMonth')}</th>
                <th className="px-3 py-2 text-right">{t('colPayment')}</th>
                {schedule.tieneInteres && <th className="px-3 py-2 text-right">{t('colInterest')}</th>}
                <th className="px-3 py-2 text-right">{t('colCapital')}</th>
                <th className="px-3 py-2 text-right">{t('colBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {byYear
                ? annual.map((y, idx) => (
                  <YearRows
                    key={y.anio}
                    y={y}
                    idx={idx}
                    open={openYears.has(y.anio)}
                    onToggle={() => toggleYear(y.anio)}
                    tieneInteres={schedule.tieneInteres}
                    fmt={fmt}
                    yearLabel={t('year', { n: y.anio })}
                  />
                ))
                : schedule.rows.map((r, idx) => (
                  <tr key={r.mes} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-gray-700 font-medium">{r.mes}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.cuota)}</td>
                    {schedule.tieneInteres && <td className="px-3 py-2 text-right text-gray-500">{fmt(r.interes)}</td>}
                    <td className="px-3 py-2 text-right font-semibold">{fmt(r.capital)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fmt(r.saldo)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-2xs text-gray-500 leading-relaxed">{t('disclaimer')}</p>
    </div>
  );
}

function YearRows({
  y, idx, open, onToggle, tieneInteres, fmt, yearLabel,
}: {
  y: AnnualRow; idx: number; open: boolean; onToggle: () => void;
  tieneInteres: boolean; fmt: (n: number) => string; yearLabel: string;
}) {
  const cols = tieneInteres ? 5 : 4;
  return (
    <>
      <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-[#F0FDFA]`} onClick={onToggle}>
        <td className="px-3 py-2 text-gray-800 font-semibold">
          <span className="inline-flex items-center gap-1">
            <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
            {yearLabel}
          </span>
        </td>
        <td className="px-3 py-2 text-right">{fmt(y.cuota)}</td>
        {tieneInteres && <td className="px-3 py-2 text-right text-gray-500">{fmt(y.interes)}</td>}
        <td className="px-3 py-2 text-right font-semibold">{fmt(y.capital)}</td>
        <td className="px-3 py-2 text-right text-gray-700">{fmt(y.saldoFinal)}</td>
      </tr>
      {open && y.meses.map((r) => (
        <tr key={r.mes} className="bg-[#F8FAFB] text-2xs text-gray-600">
          <td className="pl-8 pr-3 py-1.5">{r.mes}</td>
          <td className="px-3 py-1.5 text-right">{fmt(r.cuota)}</td>
          {tieneInteres && <td className="px-3 py-1.5 text-right">{fmt(r.interes)}</td>}
          <td className="px-3 py-1.5 text-right">{fmt(r.capital)}</td>
          <td className="px-3 py-1.5 text-right">{fmt(r.saldo)}</td>
        </tr>
      ))}
      {open && y.meses.length === 0 && <tr><td colSpan={cols} /></tr>}
    </>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-[#0F1923] text-white' : 'bg-gray-50'}`}>
      <div className={`text-2xs uppercase tracking-wider ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-propyte-brand' : 'text-[#1A2F3F]'}`}>{value}</div>
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand' : 'border-gray-200 hover:border-propyte-brand text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
