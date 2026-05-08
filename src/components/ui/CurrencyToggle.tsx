'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';

interface CurrencyToggleProps {
  tone?: 'light' | 'dark';
}

export default function CurrencyToggle({ tone = 'light' }: CurrencyToggleProps = {}) {
  const t = useTranslations('a11y');
  const locale = useLocale();
  const { currency, toggleCurrency, rate, rateUpdatedAt } = useCurrency();

  const formattedDate = new Date(rateUpdatedAt).toLocaleDateString(
    locale === 'en' ? 'en-US' : 'es-MX',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
  const tooltip = `TC: ${rate.toFixed(2)} MXN/USD · ${formattedDate}`;

  const isDark = tone === 'dark';
  const containerCls = isDark
    ? 'inline-flex items-stretch min-h-[44px] rounded-full overflow-hidden text-2xs font-bold border border-white/15 flex-shrink-0'
    : 'inline-flex items-stretch min-h-[44px] rounded-full overflow-hidden text-2xs font-bold border border-gray-200 flex-shrink-0';
  const activeCls = isDark
    ? 'bg-[#5CE0D2] text-[#0F1923]'
    : 'bg-[#1A2F3F] text-white';
  const inactiveCls = isDark
    ? 'text-white/60 hover:text-white'
    : 'text-gray-600 hover:text-[#1A2F3F]';
  const btnBase =
    'inline-flex items-center justify-center min-h-[44px] px-3 transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] focus-visible:z-10';

  return (
    <div
      role="group"
      aria-label={t('currencySelector')}
      title={tooltip}
      className={containerCls}
    >
      <button
        type="button"
        onClick={toggleCurrency}
        aria-pressed={currency === 'MXN'}
        disabled={currency === 'MXN'}
        className={`${btnBase} ${currency === 'MXN' ? activeCls : inactiveCls}`}
      >
        MXN
      </button>
      <button
        type="button"
        onClick={toggleCurrency}
        aria-pressed={currency === 'USD'}
        disabled={currency === 'USD'}
        className={`${btnBase} ${currency === 'USD' ? activeCls : inactiveCls}`}
      >
        USD
      </button>
    </div>
  );
}
