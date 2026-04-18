'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Currency = 'MXN' | 'USD';

const EXCHANGE_RATE = 17.24; // MXN per USD — update monthly

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  convert: (mxn: number) => number;
  format: (amount: number, opts?: { decimals?: number }) => string;
  rate: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('MXN');

  const toggleCurrency = useCallback(() => {
    setCurrency((c) => (c === 'MXN' ? 'USD' : 'MXN'));
  }, []);

  const convert = useCallback(
    (mxn: number) => (currency === 'MXN' ? mxn : Math.round(mxn / EXCHANGE_RATE)),
    [currency]
  );

  const format = useCallback(
    (amount: number, opts?: { decimals?: number }) => {
      const converted = currency === 'MXN' ? amount : Math.round(amount / EXCHANGE_RATE);
      return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: opts?.decimals ?? 0,
      }).format(converted);
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, convert, format, rate: EXCHANGE_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
