'use client';

import { useTranslations } from 'next-intl';
import { Database, Clock } from '@/lib/icons';
import { PROPYTE_ATTRIBUTION_ES } from '@/lib/compliance/provider-names';

interface MarketAttributionBadgeProps {
  /** Total de comparables que respaldan el análisis mostrado. */
  totalComparables: number;
  /** ISO de la fecha del registro más reciente, o `null` si no hay dato. */
  dataFreshness: string | null;
  /**
   * Clase Tailwind del punto de color dentro del chip de atribución.
   *
   * `bg-propyte-brand` y `bg-[#5CE0D2]` son colores DISTINTOS en este
   * proyecto — inconsistencia preexistente, fuera de alcance aquí. Cada
   * página pasa el suyo para que el aspecto no cambie respecto al que tenía
   * antes de extraer este componente.
   */
  accentDotClassName: string;
}

/**
 * Chip de atribución + frescura del dato.
 *
 * Compartido entre `/es/rentas` (`RentalAnalysisDashboard`) y la pestaña
 * "Renta tradicional" de `/es/mercado` (`TradicionalTab`) — antes vivía
 * duplicado entero en los dos componentes.
 *
 * La atribución pública es siempre "Análisis de mercado Propyte", nunca el
 * proveedor de datos subyacente. Ver `src/lib/compliance/provider-names.ts`.
 */
export default function MarketAttributionBadge({
  totalComparables,
  dataFreshness,
  accentDotClassName,
}: MarketAttributionBadgeProps) {
  const t = useTranslations('rentas');

  return (
    <>
      <Database size={14} className="text-gray-600" />
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
        <span className={`w-1.5 h-1.5 rounded-full ${accentDotClassName}`} />
        {PROPYTE_ATTRIBUTION_ES} <span className="text-gray-600">({totalComparables.toLocaleString()} registros)</span>
      </span>
      {dataFreshness && (() => {
        // eslint-disable-next-line react-hooks/purity -- "days ago" display is intentionally live; staleness across re-renders is acceptable
        const daysAgo = Math.floor((Date.now() - new Date(dataFreshness).getTime()) / 86400000);
        const dotColor = daysAgo <= 7 ? 'bg-[#22C55E]' : daysAgo <= 30 ? 'bg-yellow-400' : 'bg-[#EF4444]';
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 ml-auto"
            title={t('dataFreshnessTitle')}
          >
            <Clock size={10} />
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {t('dataFreshness')}: {daysAgo <= 0 ? t('today') : `${daysAgo}d`}
          </span>
        );
      })()}
    </>
  );
}
