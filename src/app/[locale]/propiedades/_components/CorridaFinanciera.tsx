'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { computeEsquema, type EsquemaPago } from '@/lib/esquemas-pago';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { formatPrice } from '@/lib/formatters';
import { FileDown, Loader2 } from '@/lib/icons';
import CorridaCompacta from './esquemas/CorridaCompacta';
import CotizacionBloques, { type Bloque3Data } from './esquemas/CotizacionBloques';

interface CorridaFinancieraProps {
  listPrice: number;
  esquemas: EsquemaPago[];
  priceOriginal: number;
  nacionalidad: Nacionalidad;
  m2: number;
  city: string;
  zone: string | null;
  tipoEntrega: string | null;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
  slug: string;
  locale: string;
}

export default function CorridaFinanciera({
  listPrice,
  esquemas,
  priceOriginal,
  nacionalidad,
  m2,
  city,
  zone,
  tipoEntrega,
  mobiliarioNivel,
  decoracionNivel,
  slug,
  locale,
}: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const tE = useTranslations('esquemas');
  const ordered = useMemo(() => [...esquemas].sort((a, b) => a.orden - b.orden), [esquemas]);
  const [selId, setSelId] = useState(ordered.find((e) => e.destacado)?.id ?? ordered[0]?.id);

  const activo = useMemo(() => {
    const e = ordered.find((x) => x.id === selId) ?? ordered[0];
    return e ? computeEsquema(listPrice, e) : null;
  }, [listPrice, selId, ordered]);

  const inversion = useMemo(
    () =>
      activo
        ? computeInversionInicial({
            price: activo.precioEfectivo,
            engancheMxn: activo.enganche,
            nacionalidad,
            m2,
            city,
            zone,
            tipoEntrega,
            mobiliarioNivel,
            decoracionNivel,
          })
        : null,
    [activo, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const handlePdf = useCallback(async () => {
    if (!activo) return;
    setPdfLoading(true);
    setPdfError(false);
    try {
      const qs = new URLSearchParams({
        slug,
        locale,
        mode: 'interno',
        esquema: activo.esquema.id,
        perfil: nacionalidad,
        mob: mobiliarioNivel,
        dec: decoracionNivel,
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
  }, [activo, slug, locale, nacionalidad, mobiliarioNivel, decoracionNivel]);

  if (ordered.length === 0 || !activo || !inversion) return null;

  const bloque3: Bloque3Data | null = activo.esContado
    ? null
    : {
        saldo: activo.financiado,
        mensualidades: activo.schedule!.rows.length,
        interesPct: activo.esquema.tasa,
        mensualidad: activo.schedule!.cuota,
      };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{tE('internoTitle')}</h3>
        <p className="text-xs text-gray-600">{tE('internoSubtitle')}</p>
      </div>

      {ordered.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('scheme')}</label>
          <div className="flex flex-wrap gap-2">
            {ordered.map((e) => (
              <button
                key={e.id}
                type="button"
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

      <CotizacionBloques
        precio={priceOriginal}
        descuentoPct={activo.esquema.descuento_pct}
        precioVenta={activo.precioEfectivo}
        inversion={inversion}
        bloque3={bloque3}
      />

      {activo.esContado ? (
        <>
          <div className="rounded-2xl p-6 bg-[#0F1923] text-white">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('cash')}</div>
            <div className="text-3xl font-extrabold text-propyte-brand">{formatPrice(activo.precioEfectivo)}</div>
            {activo.ahorro > 0 && (
              <div className="text-sm text-gray-400 mt-2">
                {t('savings')}: {formatPrice(activo.ahorro)}
              </div>
            )}
          </div>
          <p className="text-2xs text-gray-500 leading-relaxed">{t('disclaimer')}</p>
        </>
      ) : (
        <CorridaCompacta schedule={activo.schedule!} currency="MXN" />
      )}

      {!activo.esContado && (
        <div>
          <button
            type="button"
            onClick={handlePdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-[#0F1923] text-white text-sm font-semibold rounded-lg hover:bg-[#1A2F3F] transition-colors disabled:opacity-60"
          >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {pdfLoading ? tE('generandoPdf') : tE('descargarCotizacion')}
          </button>
          {pdfError && <p className="mt-2 text-2xs text-red-600">{tE('pdfError')}</p>}
        </div>
      )}
    </div>
  );
}
