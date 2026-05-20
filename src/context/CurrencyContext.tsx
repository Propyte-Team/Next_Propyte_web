'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Currency = 'MXN' | 'USD';

/** Fallback hardcoded — usado solo si el layout no inyecta initialRate. */
const FALLBACK_RATE = 17.24;
const FALLBACK_RATE_DATE = '2026-04-01';

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  convert: (mxn: number) => number;
  format: (amount: number, opts?: { decimals?: number }) => string;
  rate: number;
  rateUpdatedAt: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyProviderProps {
  children: ReactNode;
  /** Tipo de cambio MXN por 1 USD inyectado desde server (Banxico SF43718). */
  initialRate?: number;
  /** Fecha ISO del rate (YYYY-MM-DD). Se muestra junto al toggle. */
  initialRateDate?: string;
}

export function CurrencyProvider({ children, initialRate, initialRateDate }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>('MXN');

  const rate = initialRate && initialRate > 0 ? initialRate : FALLBACK_RATE;
  const rateUpdatedAt = initialRateDate || FALLBACK_RATE_DATE;

  const toggleCurrency = useCallback(() => {
    setCurrency((c) => (c === 'MXN' ? 'USD' : 'MXN'));
  }, []);

  const convert = useCallback(
    (mxn: number) => (currency === 'MXN' ? mxn : Math.round(mxn / rate)),
    [currency, rate],
  );

  const format = useCallback(
    (amount: number, opts?: { decimals?: number }) => {
      const converted = currency === 'MXN' ? amount : Math.round(amount / rate);
      return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: opts?.decimals ?? 0,
      }).format(converted);
    },
    [currency, rate],
  );

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, convert, format, rate, rateUpdatedAt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
