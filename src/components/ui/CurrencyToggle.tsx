'use client';

import { useCurrency } from '@/context/CurrencyContext';

export default function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <div className="inline-flex rounded-full overflow-hidden text-[10px] font-bold border border-gray-200 flex-shrink-0">
      <button
        type="button"
        onClick={currency === 'USD' ? toggleCurrency : undefined}
        aria-pressed={currency === 'MXN'}
        aria-label="MXN"
        className={`px-2 py-1 transition-colors tabular-nums ${
          currency === 'MXN' ? 'bg-[#1A2F3F] text-white' : 'text-gray-500 hover:text-[#1A2F3F]'
        }`}
      >
        MXN
      </button>
      <button
        type="button"
        onClick={currency === 'MXN' ? toggleCurrency : undefined}
        aria-pressed={currency === 'USD'}
        aria-label="USD"
        className={`px-2 py-1 transition-colors tabular-nums ${
          currency === 'USD' ? 'bg-[#1A2F3F] text-white' : 'text-gray-500 hover:text-[#1A2F3F]'
        }`}
      >
        USD
      </button>
    </div>
  );
}
