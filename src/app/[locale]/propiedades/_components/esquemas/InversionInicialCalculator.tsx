'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';

interface InversionInicialCalculatorProps {
  price: number;
  priceOriginal: number;
  discountPct: number;
  m2: number;
  city: string;
  zone: string | null;
  tipoEntrega: string | null;
  engancheMxn: number;
  onTotal?: (n: number) => void;
}

const selectClass = 'appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800';

type EsquemasT = ReturnType<typeof useTranslations<'esquemas'>>;

export default function InversionInicialCalculator({
  price, priceOriginal, discountPct, m2, city, zone, tipoEntrega, engancheMxn, onTotal,
}: InversionInicialCalculatorProps) {
  const t = useTranslations('esquemas');
  const [nacionalidad, setNacionalidad] = useState<Nacionalidad>('nacional');
  const [mobiliarioNivel, setMobiliarioNivel] = useState<NivelAcabado>('alto');
  const [decoracionNivel, setDecoracionNivel] = useState<NivelAcabado>('standard');

  const r = useMemo(
    () => computeInversionInicial({
      price, engancheMxn, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel,
    }),
    [price, engancheMxn, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  useEffect(() => { onTotal?.(r.total); }, [r.total, onTotal]);

  return (
    <div className="rounded-2xl border border-gray-200 p-5 space-y-5">
      {/* Precio */}
      <div>
        <div className="text-sm font-bold text-[#2C2C2C]">{t('inversionInicialTitle')}</div>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          {discountPct > 0 && <span className="text-sm text-gray-400 line-through">{formatPrice(priceOriginal)}</span>}
          <span className="text-2xl font-extrabold text-[#2C2C2C]">{formatPrice(price)}</span>
          {discountPct > 0 && <span className="text-xs font-bold text-emerald-600">-{discountPct}%</span>}
        </div>
      </div>

      {/* Nacionalidad → escrituración */}
      <div>
        <label className="block text-2xs font-medium text-gray-600 uppercase tracking-wider mb-2">{t('escrituracion')}</label>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setNacionalidad('nacional')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${nacionalidad === 'nacional' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('nacional')}
          </button>
          <button
            type="button"
            onClick={() => setNacionalidad('extranjero')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${nacionalidad === 'extranjero' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('extranjero')}
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-700">
          {formatPrice(r.escrituracion)}
          {nacionalidad === 'extranjero' && <span className="text-2xs text-gray-500 ml-2">{t('fideicomisoNota')}</span>}
        </div>
      </div>

      <AcabadoRow label={t('mobiliario')} nivel={mobiliarioNivel} setNivel={setMobiliarioNivel} incluido={r.mobiliarioIncluido} monto={r.mobiliario} t={t} />
      <AcabadoRow label={t('decoracion')} nivel={decoracionNivel} setNivel={setDecoracionNivel} incluido={r.decoracionIncluido} monto={r.decoracion} t={t} />

      {/* Total */}
      <div className="bg-[#0F1923] rounded-2xl p-5 text-white">
        <div className="flex justify-between text-sm border-b border-white/10 pb-2">
          <span className="text-gray-400">{t('enganche')}</span><span className="font-semibold">{formatPrice(r.enganche)}</span>
        </div>
        <div className="flex justify-between text-sm pt-2">
          <span className="text-gray-400">{t('escrituracion')}</span><span>{formatPrice(r.escrituracion)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1">
          <span className="text-gray-400">{t('mobiliario')}</span><span>{r.mobiliarioIncluido ? t('incluido') : formatPrice(r.mobiliario)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1">
          <span className="text-gray-400">{t('decoracion')}</span><span>{r.decoracionIncluido ? t('incluido') : formatPrice(r.decoracion)}</span>
        </div>
        <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
          <span className="font-bold text-propyte-brand">{t('inversionInicial')}</span>
          <span className="text-xl font-extrabold text-propyte-brand">{formatPrice(r.total)}</span>
        </div>
      </div>
    </div>
  );
}

function AcabadoRow({
  label, nivel, setNivel, incluido, monto, t,
}: { label: string; nivel: NivelAcabado; setNivel: (n: NivelAcabado) => void; incluido: boolean; monto: number; t: EsquemasT }) {
  return (
    <div>
      <label className="block text-2xs font-medium text-gray-600 uppercase tracking-wider mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <select
          disabled={incluido}
          value={nivel}
          onChange={(e) => setNivel(e.target.value as NivelAcabado)}
          className={`${selectClass} max-w-[160px] ${incluido ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <option value="standard">{t('standard')}</option>
          <option value="alto">{t('alto')}</option>
          <option value="premium">{t('premium')}</option>
        </select>
        <span className="text-sm font-semibold text-gray-800">
          {incluido ? <span className="text-emerald-600">{t('incluido')}</span> : formatPrice(monto)}
        </span>
      </div>
    </div>
  );
}
