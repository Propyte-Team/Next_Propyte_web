'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';

/**
 * Disclaimer legal sobre la conversión MXN/USD referencial.
 * Va al final de páginas de detalle de propiedad/desarrollo.
 * Muestra el TC actual con fecha + aclara que precio final depende de negociación.
 */
export default function PriceDisclaimer({ className = '' }: { className?: string }) {
  const t = useTranslations('priceDisclaimerBox');
  const locale = useLocale();
  const { rate, rateUpdatedAt } = useCurrency();
  const tcDate = new Date(rateUpdatedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <aside
      className={`mt-8 rounded-2xl border border-[var(--propyte-cyan-100)]/40 bg-[var(--propyte-cyan-50)]/50 px-5 py-4 ${className}`}
      aria-label={t('ariaLabel')}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--propyte-dark-700)] mb-2">
        {t('title')}
      </h3>
      <p className="text-xs text-[var(--propyte-dark-700)] leading-relaxed">
        {t.rich('body', {
          rate: rate.toFixed(2),
          date: tcDate,
          b: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
    </aside>
  );
}
