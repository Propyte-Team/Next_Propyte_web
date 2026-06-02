'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

export type Currency = 'MXN' | 'USD';

/** Fallback hardcoded — usado solo si el layout no inyecta initialRate. */
const FALLBACK_RATE = 17.24;
const FALLBACK_RATE_DATE = '2026-04-01';

/**
 * Decisión canónica 2026-05-23 (Luis): el sitio público no tiene toggle MXN/USD.
 * Cada precio se muestra en su moneda original (BD) + referencial (TC Banxico)
 * vía <PriceDisplay variant='dual' originalCurrency={p.price.currency}/>.
 *
 * Este contexto sólo expone el TC Banxico (rate + fecha) y un helper puro
 * `formatMxn` para uso en calculadoras (mortgage, ROI) — NUNCA para precios
 * de propiedades, esos van por PriceDisplay.
 */
interface CurrencyContextValue {
  rate: number;
  rateUpdatedAt: string;
  /** Formato puro MXN — para calculadoras/agregados. Para precios de propiedades usar <PriceDisplay/>. */
  formatMxn: (amount: number, opts?: { decimals?: number }) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyProviderProps {
  children: ReactNode;
  /** Tipo de cambio MXN por 1 USD inyectado desde server (Banxico SF43718). */
  initialRate?: number;
  /** Fecha ISO del rate (YYYY-MM-DD). */
  initialRateDate?: string;
}

export function CurrencyProvider({ children, initialRate, initialRateDate }: CurrencyProviderProps) {
  const rate = initialRate && initialRate > 0 ? initialRate : FALLBACK_RATE;
  const rateUpdatedAt = initialRateDate || FALLBACK_RATE_DATE;

  const formatMxn = useCallback(
    (amount: number, opts?: { decimals?: number }) =>
      new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: opts?.decimals ?? 0,
      }).format(amount),
    [],
  );

  return (
    <CurrencyContext.Provider value={{ rate, rateUpdatedAt, formatMxn }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
