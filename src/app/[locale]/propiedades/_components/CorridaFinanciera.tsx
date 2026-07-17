'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { computeEsquema, type EsquemaPago } from '@/lib/esquemas-pago';
import { formatPrice } from '@/lib/formatters';

const COLOR_CAPITAL = '#5CE0D2';
const COLOR_INTEREST = '#1A2F3F';
const PREVIEW_ROWS = 12;

interface CorridaFinancieraProps {
  listPrice: number;
  esquemas: EsquemaPago[];
}

export default function CorridaFinanciera({ listPrice, esquemas }: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const ordered = [...esquemas].sort((a, b) => a.orden - b.orden);
  const [selId, setSelId] = useState(ordered.find((e) => e.destacado)?.id ?? ordered[0]?.id);
  const [expanded, setExpanded] = useState(false);

  const activo = useMemo(() => {
    const e = ordered.find((x) => x.id === selId) ?? ordered[0];
    return e ? computeEsquema(listPrice, e) : null;
  }, [listPrice, selId, ordered]);

  const chartData = useMemo(
    () => (activo?.schedule
      ? activo.schedule.rows.map((r) => ({
        mes: r.mes,
        [t('colCapital')]: Math.round(r.capital),
        [t('colInterest')]: Math.round(r.interes),
      }))
      : []),
    [activo, t],
  );

  if (ordered.length === 0 || !activo) return null;

  const visibleRows = activo.schedule
    ? (expanded ? activo.schedule.rows : activo.schedule.rows.slice(0, PREVIEW_ROWS))
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{t('title')}</h3>
        <p className="text-xs text-gray-600">{t('subtitle')}</p>
      </div>

      {ordered.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('scheme')}</label>
          <div className="flex flex-wrap gap-2">
            {ordered.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelId(e.id); setExpanded(false); }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  selId === e.id
                    ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand'
                    : 'border-gray-200 hover:border-propyte-brand text-gray-700'
                }`}
              >
                {e.destacado && '★ '}
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {activo.esquema.descuento_pct > 0 ? (
          <div className="flex items-baseline gap-3 flex-wrap">
            <div>
              <div className="text-2xs uppercase tracking-wider text-gray-600">{t('listPrice')}</div>
              <div className="text-sm text-gray-500 line-through">{formatPrice(listPrice)}</div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wider text-gray-600">{t('effectivePrice')}</div>
              <div className="text-xl font-bold text-[#1A2F3F]">{formatPrice(activo.precioEfectivo)}</div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wider text-gray-600">{t('savings')}</div>
              <div className="text-sm font-semibold text-[#0E7490]">{formatPrice(activo.ahorro)}</div>
            </div>
          </div>
        ) : (
          <div className="text-xl font-bold text-[#1A2F3F]">{formatPrice(activo.precioEfectivo)}</div>
        )}
      </div>

      {activo.esContado ? (
        <div className="rounded-2xl p-6 bg-[#0F1923] text-white">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('cash')}</div>
          <div className="text-3xl font-extrabold text-propyte-brand">{formatPrice(activo.precioEfectivo)}</div>
          {activo.ahorro > 0 && (
            <div className="text-sm text-gray-400 mt-2">{t('savings')}: {formatPrice(activo.ahorro)}</div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KV label={t('downPayment')} value={formatPrice(activo.enganche)} note={`${activo.esquema.enganche_pct}%`} />
            <KV label={t('financedAmount')} value={formatPrice(activo.financiado)} />
            <KV label={t('monthlyPayment')} value={formatPrice(Math.round(activo.schedule!.cuota))} highlight />
            <KV
              label={t('totalInterest')}
              value={activo.schedule!.tieneInteres ? formatPrice(Math.round(activo.schedule!.totalIntereses)) : '—'}
            />
          </div>

          {!activo.schedule!.tieneInteres && (
            <p className="text-2xs text-gray-600">{t('noInterest')}</p>
          )}

          {activo.schedule!.tieneInteres && (
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
                  {activo.schedule!.tieneInteres && <th className="px-3 py-2 text-right">{t('colInterest')}</th>}
                  <th className="px-3 py-2 text-right">{t('colCapital')}</th>
                  <th className="px-3 py-2 text-right">{t('colBalance')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, idx) => (
                  <tr key={r.mes} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-gray-700 font-medium">{r.mes}</td>
                    <td className="px-3 py-2 text-right">{formatPrice(Math.round(r.cuota))}</td>
                    {activo.schedule!.tieneInteres && (
                      <td className="px-3 py-2 text-right text-gray-500">{formatPrice(Math.round(r.interes))}</td>
                    )}
                    <td className="px-3 py-2 text-right font-semibold">{formatPrice(Math.round(r.capital))}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatPrice(Math.round(r.saldo))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activo.schedule!.rows.length > PREVIEW_ROWS && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-sm font-semibold text-[#0E7490] hover:underline"
            >
              {expanded ? t('showLess') : t('showAll', { n: activo.schedule!.rows.length })}
            </button>
          )}
        </>
      )}

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
