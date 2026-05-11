'use client';

import { useCurrency, type Currency } from '@/context/CurrencyContext';

interface PriceDisplayProps {
  /** Precio en MXN (fuente de verdad). */
  mxn: number | string | null | undefined;
  /** Variante visual (default: dual). */
  variant?: 'dual' | 'single' | 'inline';
  /** Tamaño de la unidad principal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mostrar texto "TC ref. Banxico {fecha}" debajo (solo en dual). */
  showRateNote?: boolean;
  /** Sufijo opcional (ej. "/m²") */
  suffix?: string;
  className?: string;
}

const SIZE_PRIMARY: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-xl font-bold',
  xl: 'text-3xl md:text-4xl font-extrabold text-[#2C2C2C]',
};

const SIZE_SECONDARY: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-sm md:text-base',
};

function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PriceDisplay({
  mxn,
  variant = 'dual',
  size = 'md',
  showRateNote = false,
  suffix,
  className = '',
}: PriceDisplayProps) {
  const { currency, toggleCurrency, rate, rateUpdatedAt } = useCurrency();
  if (mxn == null) return <span className={className}>—</span>;
  const n = typeof mxn === 'string' ? Number(mxn) : mxn;
  if (!Number.isFinite(n) || n <= 0) return <span className={className}>—</span>;

  const usd = Math.round(n / rate);
  const primaryAmount = currency === 'MXN' ? n : usd;
  const secondaryAmount = currency === 'MXN' ? usd : n;
  const secondaryCurrency: Currency = currency === 'MXN' ? 'USD' : 'MXN';
  const primaryLabel = `${formatCurrency(primaryAmount, currency)}${suffix ?? ''}`;
  const secondaryLabel = `${formatCurrency(secondaryAmount, secondaryCurrency)}${suffix ?? ''}`;

  // TC referencial date — usar locale es-MX para consistencia
  const tcDate = new Date(rateUpdatedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const tcNote = `TC ref. Banxico · ${rate.toFixed(2)} MXN/USD · ${tcDate}`;

  if (variant === 'inline') {
    return (
      <span className={className}>
        {primaryLabel}{' '}
        <span className="text-gray-500 text-xs">({secondaryLabel})</span>
      </span>
    );
  }

  if (variant === 'single') {
    return <span className={`${SIZE_PRIMARY[size]} ${className}`}>{primaryLabel}</span>;
  }

  return (
    <div className={`inline-flex flex-col items-baseline ${className}`}>
      <button
        type="button"
        onClick={toggleCurrency}
        aria-label={`Cambiar a ${secondaryCurrency}`}
        className="inline-flex flex-col items-baseline text-left hover:opacity-80 transition-opacity cursor-pointer"
      >
        <span className={SIZE_PRIMARY[size]}>{primaryLabel}</span>
        <span className={`${SIZE_SECONDARY[size]} text-gray-500 leading-tight`}>{secondaryLabel}</span>
      </button>
      {showRateNote && (
        <span className="text-[10px] text-gray-400 mt-0.5 italic">{tcNote}</span>
      )}
    </div>
  );
}
