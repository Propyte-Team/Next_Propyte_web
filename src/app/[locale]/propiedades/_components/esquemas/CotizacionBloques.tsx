'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';
import type { InversionInicialResult } from '@/lib/inversion-inicial';

export interface Bloque3Data {
  saldo: number;
  mensualidades: number;
  interesPct: number;
  mensualidad: number;
}
interface CotizacionBloquesProps {
  precio: number;
  descuentoPct: number;
  precioVenta: number;
  inversion: InversionInicialResult;
  bloque3: Bloque3Data | null;
}

export default function CotizacionBloques({ precio, descuentoPct, precioVenta, inversion, bloque3 }: CotizacionBloquesProps) {
  const t = useTranslations('esquemas');
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Bloque title={t('bloquePrecio')}>
        <Row label={t('precio')} value={formatPrice(precio)} />
        {descuentoPct > 0 && <Row label={t('descuento')} value={`-${descuentoPct}%`} />}
        <Row label={t('precioVenta')} value={formatPrice(precioVenta)} strong />
      </Bloque>
      <Bloque title={t('bloqueInversion')}>
        <Row label={t('enganche')} value={formatPrice(inversion.enganche)} />
        <Row label={t('escrituracion')} value={formatPrice(inversion.escrituracion)} />
        <Row label={t('mobiliario')} value={inversion.mobiliarioIncluido ? t('incluido') : formatPrice(inversion.mobiliario)} />
        <Row label={t('decoracion')} value={inversion.decoracionIncluido ? t('incluido') : formatPrice(inversion.decoracion)} />
        <Row label={t('inversionInicial')} value={formatPrice(inversion.total)} strong />
      </Bloque>
      <Bloque title={t('bloqueSaldo')}>
        {bloque3 ? (
          <>
            <Row label={t('saldo')} value={formatPrice(bloque3.saldo)} />
            <Row label={t('mensualidades')} value={String(bloque3.mensualidades)} />
            <Row label={t('interes')} value={`${bloque3.interesPct.toFixed(2)}%`} />
            <Row label={t('mensualidad')} value={formatPrice(bloque3.mensualidad)} strong />
          </>
        ) : (
          <p className="text-xs text-gray-500 py-3">{t('bloque3Placeholder')}</p>
        )}
      </Bloque>
    </div>
  );
}

function Bloque({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="text-2xs uppercase tracking-wider text-gray-500 font-semibold mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${strong ? 'font-bold text-[#0E7490] pt-1 border-t border-gray-100 mt-1' : 'text-gray-700'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
