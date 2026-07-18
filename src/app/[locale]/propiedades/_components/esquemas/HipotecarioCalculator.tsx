'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, MapPin, AlertTriangle, FileDown, Loader2 } from '@/lib/icons';
import type { Nacionalidad, NivelAcabado, InversionInicialResult } from '@/lib/inversion-inicial';
import type { HipotecarioConfig } from '@/lib/hipotecario';
import type { AmortSchedule } from '@/lib/calculator';
import CotizacionBloques, { type Bloque3Data } from './CotizacionBloques';
import CorridaCompacta from './CorridaCompacta';

interface HipotecarioCalculatorProps {
  priceOriginal: number;
  discountPct: number;
  price: number;
  inversion: InversionInicialResult;
  bloque3: Bloque3Data;
  schedule: AmortSchedule;
  config: HipotecarioConfig;
  nacionalidad: Nacionalidad;
  onNacionalidad: (n: Nacionalidad) => void;
  slug: string;
  locale: string;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
}

export default function HipotecarioCalculator({
  priceOriginal, discountPct, price, inversion, bloque3, schedule, config,
  nacionalidad, onNacionalidad, slug, locale, mobiliarioNivel, decoracionNivel,
}: HipotecarioCalculatorProps) {
  const t = useTranslations('esquemas');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handlePdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const qs = new URLSearchParams({
        slug, locale, perfil: nacionalidad, mob: mobiliarioNivel, dec: decoracionNivel,
      });
      const res = await fetch(`/api/generate-cotizacion-pdf?${qs.toString()}`);
      if (!res.ok) throw new Error(`PDF ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propyte-cotizacion-${slug}-${nacionalidad}-${locale}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('cotizacion pdf error:', e);
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [slug, locale, nacionalidad, mobiliarioNivel, decoracionNivel]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{t('hipotecarioTitle')}</h3>
        <p className="text-xs text-gray-600">{t('hipotecarioSubtitle')}</p>
      </div>

      {/* Selector perfil (mismo estado que escrituración) */}
      <div>
        <label className="block text-2xs font-medium text-gray-600 uppercase tracking-wider mb-2">{t('perfilLabel')}</label>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onNacionalidad('nacional')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${nacionalidad === 'nacional' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <MapPin size={15} /> {t('nacional')}
          </button>
          <button
            type="button"
            onClick={() => onNacionalidad('extranjero')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${nacionalidad === 'extranjero' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Globe size={15} /> {t('extranjero')}
          </button>
        </div>
      </div>

      {/* Chips tasa / plazo / moneda */}
      <div className="grid grid-cols-3 gap-3">
        <Chip label={t('tasaAnual')} value={`${config.tasaAnualPct}%`} />
        <Chip label={t('plazo')} value={t('plazoAnios', { n: Math.round(config.meses / 12) })} />
        <Chip label={t('moneda')} value={config.moneda} />
      </div>

      {config.avisoCambiario && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-2xs text-amber-800 leading-relaxed">{t('avisoCambiario')}</p>
        </div>
      )}

      <CotizacionBloques
        precio={priceOriginal}
        descuentoPct={discountPct}
        precioVenta={price}
        inversion={inversion}
        bloque3={bloque3}
      />

      <CorridaCompacta schedule={schedule} currency="MXN" />

      <div>
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-[#0F1923] text-white text-sm font-semibold rounded-lg hover:bg-[#1A2F3F] transition-colors disabled:opacity-60"
        >
          {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {pdfLoading ? t('generandoPdf') : t('descargarCotizacion')}
        </button>
        {pdfError && <p className="mt-2 text-2xs text-red-600">{t('pdfError')}</p>}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center">
      <div className="text-2xs uppercase tracking-wider text-gray-600">{label}</div>
      <div className="text-base font-bold text-[#1A2F3F]">{value}</div>
    </div>
  );
}
