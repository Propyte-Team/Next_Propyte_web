'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';

export default function CurrencyToggle() {
  const t = useTranslations('a11y');
  const locale = useLocale();
  const { currency, toggleCurrency, rate, rateUpdatedAt } = useCurrency();

  const formattedDate = new Date(rateUpdatedAt).toLocaleDateString(
    locale === 'en' ? 'en-US' : 'es-MX',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
  const tooltip = `TC: ${rate.toFixed(2)} MXN/USD · ${formattedDate}`;

  return (
    <div
      role="group"
      aria-label={t('currencySelector')}
      title={tooltip}
      className="inline-flex rounded-full overflow-hidden text-[10px] font-bold border border-gray-200 flex-shrink-0"
    >
      <button
        type="button"
        onClick={toggleCurrency}
        aria-pressed={currency === 'MXN'}
        disabled={currency === 'MXN'}
        className={`px-2 py-1 transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] focus-visible:z-10 ${
          currency === 'MXN' ? 'bg-[#1A2F3F] text-white' : 'text-gray-500 hover:text-[#1A2F3F]'
        }`}
      >
        MXN
      </button>
      <button
        type="button"
        onClick={toggleCurrency}
        aria-pressed={currency === 'USD'}
        disabled={currency === 'USD'}
        className={`px-2 py-1 transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] focus-visible:z-10 ${
          currency === 'USD' ? 'bg-[#1A2F3F] text-white' : 'text-gray-500 hover:text-[#1A2F3F]'
        }`}
      >
        USD
      </button>
    </div>
  );
}
