'use client';

// NOTA: componente sin importadores en Slice 3. Refactorizado a CorridaCompacta y
// reservado para el tab "Financiamiento Interno" (Slice 5), que mostrará los
// esquemas de pago del Hub. No eliminar.

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { computeEsquema, type EsquemaPago } from '@/lib/esquemas-pago';
import { formatPrice } from '@/lib/formatters';
import CorridaCompacta from './esquemas/CorridaCompacta';

interface CorridaFinancieraProps {
  listPrice: number;
  esquemas: EsquemaPago[];
}

export default function CorridaFinanciera({ listPrice, esquemas }: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const ordered = useMemo(() => [...esquemas].sort((a, b) => a.orden - b.orden), [esquemas]);
  const [selId, setSelId] = useState(ordered.find((e) => e.destacado)?.id ?? ordered[0]?.id);

  const activo = useMemo(() => {
    const e = ordered.find((x) => x.id === selId) ?? ordered[0];
    return e ? computeEsquema(listPrice, e) : null;
  }, [listPrice, selId, ordered]);

  if (ordered.length === 0 || !activo) return null;

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
                onClick={() => setSelId(e.id)}
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
        <>
          <div className="rounded-2xl p-6 bg-[#0F1923] text-white">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('cash')}</div>
            <div className="text-3xl font-extrabold text-propyte-brand">{formatPrice(activo.precioEfectivo)}</div>
            {activo.ahorro > 0 && (
              <div className="text-sm text-gray-400 mt-2">{t('savings')}: {formatPrice(activo.ahorro)}</div>
            )}
          </div>
          <p className="text-2xs text-gray-500 leading-relaxed">{t('disclaimer')}</p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <KV label={t('downPayment')} value={formatPrice(activo.enganche)} note={`${activo.esquema.enganche_pct}%`} />
            <KV label={t('financedAmount')} value={formatPrice(activo.financiado)} />
          </div>
          <CorridaCompacta schedule={activo.schedule!} />
        </>
      )}
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
