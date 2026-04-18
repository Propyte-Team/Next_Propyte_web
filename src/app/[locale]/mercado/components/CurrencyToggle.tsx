'use client';

import { useCurrency } from '@/context/CurrencyContext';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
      <button
        onClick={currency === 'USD' ? toggleCurrency : undefined}
        className={`px-3 py-1.5 font-medium transition-colors ${
          currency === 'MXN'
            ? 'bg-[#1A2F3F] text-white'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        MXN
      </button>
      <button
        onClick={currency === 'MXN' ? toggleCurrency : undefined}
        className={`px-3 py-1.5 font-medium transition-colors ${
          currency === 'USD'
            ? 'bg-[#1A2F3F] text-white'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        USD
      </button>
    </div>
  );
}
