'use client';

import { useCurrency } from '@/context/CurrencyContext';

/**
 * Disclaimer legal sobre la conversión MXN/USD referencial.
 * Va al final de páginas de detalle de propiedad/desarrollo.
 * Muestra el TC actual con fecha + aclara que precio final depende de negociación.
 */
export default function PriceDisclaimer({ className = '' }: { className?: string }) {
  const { rate, rateUpdatedAt } = useCurrency();
  const tcDate = new Date(rateUpdatedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <aside
      className={`mt-8 rounded-2xl border border-gray-200 bg-[#F4F6F8] px-5 py-4 ${className}`}
      aria-label="Aviso de tipo de cambio"
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
        Aviso de precio y tipo de cambio
      </h3>
      <p className="text-xs text-gray-600 leading-relaxed">
        Los precios convertidos entre <strong>MXN ↔ USD</strong> son únicamente{' '}
        <strong>referenciales</strong> y se calculan al tipo de cambio publicado por
        Banco de México (<strong>{rate.toFixed(2)} MXN/USD</strong>, actualizado al{' '}
        {tcDate}). El precio final de la operación está sujeto al tipo de cambio
        acordado en la negociación al momento del cierre. Los precios marcados como{' '}
        <strong>(Original)</strong> son la moneda en que se cotizó la propiedad; los
        marcados como <strong>(Referencial)</strong> son la conversión calculada.
      </p>
    </aside>
  );
}
