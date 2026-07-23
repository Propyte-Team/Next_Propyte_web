'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Calculator, MapPin, Globe, AlertTriangle, ArrowRight } from '@/lib/icons';
import { computeHipotecario, type PerfilHipotecario } from '@/lib/hipotecario';
import { formatPrice } from '@/lib/formatters';
import CorridaCompacta from '@/app/[locale]/propiedades/_components/esquemas/CorridaCompacta';

const PRICE_MIN = 500_000;
const PRICE_MAX = 30_000_000;
const PRICE_STEP = 100_000;
const PRICE_DEFAULT = 4_000_000;

export default function FinanciamientoSimulator() {
  const t = useTranslations('financiamiento');
  const tE = useTranslations('esquemas');
  const locale = useLocale();
  const [precio, setPrecio] = useState(PRICE_DEFAULT);
  const [perfil, setPerfil] = useState<PerfilHipotecario>('nacional');
  // Texto libre mientras el campo tiene foco; null = mostrar precio formateado.
  const [inputText, setInputText] = useState<string | null>(null);

  const result = useMemo(() => computeHipotecario(precio, perfil), [precio, perfil]);
  const { config, enganche, saldo, schedule } = result;

  const clamp = (v: number) => Math.min(PRICE_MAX, Math.max(PRICE_MIN, v));
  const commitInput = () => {
    if (inputText == null) return;
    const digits = Number(inputText.replace(/[^\d]/g, ''));
    if (digits > 0) setPrecio(clamp(digits));
    setInputText(null);
  };

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5CE0D2]/10 rounded-full mb-3">
            <Calculator size={14} className="text-[#0E7490]" />
            <span className="text-[#0E7490] text-xs font-semibold uppercase tracking-wide">{t('calcEyebrow')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">{t('calcTitle')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t('calcSubtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Inputs */}
          <div className="bg-[#F4F6F8] rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="fin-sim-precio" className="text-sm font-semibold text-[#1A2F3F]">{t('calcPriceLabel')}</label>
              </div>
              <input
                id="fin-sim-precio"
                type="text"
                inputMode="numeric"
                value={inputText ?? formatPrice(precio)}
                onFocus={() => setInputText(String(precio))}
                onChange={(e) => setInputText(e.target.value)}
                onBlur={commitInput}
                onKeyDown={(e) => { if (e.key === 'Enter') commitInput(); }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-[#1A2F3F] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]"
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={precio}
                onChange={(e) => { setInputText(null); setPrecio(Number(e.target.value)); }}
                className="mt-3 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5CE0D2]"
                aria-label={t('calcPriceLabel')}
              />
            </div>

            {/* Perfil (mismo patrón visual de la ficha) */}
            <div>
              <label className="block text-2xs font-medium text-gray-600 uppercase tracking-wider mb-2">{tE('perfilLabel')}</label>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPerfil('nacional')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${perfil === 'nacional' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <MapPin size={15} /> {tE('nacional')}
                </button>
                <button
                  type="button"
                  onClick={() => setPerfil('extranjero')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${perfil === 'extranjero' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Globe size={15} /> {tE('extranjero')}
                </button>
              </div>
            </div>

            {/* Chips de condiciones (solo lectura, desde HIPOTECARIO_CONFIG) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Chip label={tE('tasaAnual')} value={`${config.tasaAnualPct}%`} />
              <Chip label={tE('plazo')} value={tE('plazoAnios', { n: Math.round(config.meses / 12) })} />
              <Chip label={t('calcDownPaymentPct')} value={`${config.enganchePct}%`} />
              <Chip label={tE('moneda')} value={config.moneda} />
            </div>

            {config.avisoCambiario && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-2xs text-amber-800 leading-relaxed">{tE('avisoCambiario')}</p>
              </div>
            )}
          </div>

          {/* Output — SOLO mensualidad + enganche + saldo. NUNCA totales lifetime. */}
          <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-6 md:p-8 text-white flex flex-col">
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-wider text-[#5CE0D2] mb-1">{t('calcMonthly')}</div>
              <div className="text-4xl md:text-5xl font-bold tabular-nums">{formatPrice(Math.round(schedule.cuota))}</div>
              <div className="text-xs text-white/75 mt-1">{t('calcPerMonth')}</div>
            </div>
            <div className="space-y-2 text-sm">
              <OutputRow label={`${t('calcDownPaymentValue')} (${config.enganchePct}%)`} value={formatPrice(enganche)} />
              <OutputRow label={t('calcFinanced')} value={formatPrice(saldo)} />
            </div>
            <Link
              href={`/${locale}/contacto?asunto=financiamiento`}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
            >
              {t('calcCta')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Corrida por año (barras interés/capital + tabla expandible) */}
        <div className="max-w-5xl mx-auto mt-8">
          <CorridaCompacta schedule={schedule} currency="MXN" />
        </div>

        <p className="text-xs text-gray-600 text-center mt-8 max-w-2xl mx-auto">{t('calcDisclaimer')}</p>
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center">
      <div className="text-2xs uppercase tracking-wider text-gray-600">{label}</div>
      <div className="text-base font-bold text-[#1A2F3F]">{value}</div>
    </div>
  );
}

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-white/65">{label}</span>
      <span className="tabular-nums text-white font-semibold">{value}</span>
    </div>
  );
}
