'use client';

import { useCurrency, type Currency } from '@/context/CurrencyContext';

interface PriceDisplayProps {
  /** Precio en MXN (fuente de verdad almacenada en BD). */
  mxn: number | string | null | undefined;
  /** Variante visual (default: dual). */
  variant?: 'dual' | 'single' | 'inline';
  /** Tamaño de la unidad principal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mostrar texto "TC ref. Banxico {fecha}" debajo (solo en dual). */
  showRateNote?: boolean;
  /** Sufijo opcional (ej. "/m²") */
  suffix?: string;
  /** Moneda en que se cotizó originalmente la unidad. Siempre se muestra ARRIBA
   *  grande, marcada como (Original). La otra moneda calculada va ABAJO chiquita
   *  marcada como (Referencial). Default: 'MXN'. */
  originalCurrency?: Currency;
  /** Tono visual del contexto. 'light' (default) para fondos claros, 'dark'
   *  para fondos oscuros como FloatingKeyData/DevelopmentKeyData (#1A2F3F).
   *  En 'dark' sube el contraste del precio referencial a WCAG AA. */
  tone?: 'light' | 'dark';
  className?: string;
}

const SIZE_PRIMARY: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-2xl md:text-3xl font-bold text-[#2C2C2C]',
  xl: 'text-3xl md:text-4xl font-extrabold text-[#2C2C2C]',
};

const SIZE_SECONDARY: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-sm md:text-base',
};

function formatCurrency(amount: number, currency: Currency): string {
  // Formato consistente "$X,XXX,XXX MXN" / "$X,XXX,XXX USD" — sigla siempre
  // explícita al final para que sea claro qué moneda se muestra.
  const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  return `$${num} ${currency}`;
}

export default function PriceDisplay({
  mxn,
  variant = 'dual',
  size = 'md',
  showRateNote = false,
  suffix,
  originalCurrency = 'MXN',
  tone = 'light',
  className = '',
}: PriceDisplayProps) {
  const isDark = tone === 'dark';
  // text-gray-500 sobre #1A2F3F da ~3:1 (debajo WCAG AA). text-white/75 da ~6.5:1.
  const secondaryColorCls = isDark ? 'text-white/75' : 'text-gray-500';
  // (Referencial) muy chico: white/55 da ~4.6:1 sobre #1A2F3F. gray-500 igual base.
  const refLabelCls = isDark ? 'text-white/55' : 'opacity-70';
  // Nota TC Banxico: similar a referencial pero un punto más bajo.
  const rateNoteCls = isDark ? 'text-white/60' : 'text-gray-400';
  const inlineSecondaryCls = isDark ? 'text-white/70 text-xs' : 'text-gray-500 text-xs';
  const { rate, rateUpdatedAt } = useCurrency();
  if (mxn == null) return <span className={className}>—</span>;
  const n = typeof mxn === 'string' ? Number(mxn) : mxn;
  if (!Number.isFinite(n) || n <= 0) return <span className={className}>—</span>;

  // n viene en MXN (BD). Si la moneda original es USD, el valor "original"
  // que el comercial cotizó realmente es n/rate (rounded). Si original es MXN,
  // el valor original es n directo.
  const usdValue = Math.round(n / rate);
  const mxnValue = n;
  const originalValue = originalCurrency === 'MXN' ? mxnValue : usdValue;
  const referencialValue = originalCurrency === 'MXN' ? usdValue : mxnValue;
  const referencialCurrency: Currency = originalCurrency === 'MXN' ? 'USD' : 'MXN';
  const originalLabel = `${formatCurrency(originalValue, originalCurrency)}${suffix ?? ''}`;
  const referencialLabel = `${formatCurrency(referencialValue, referencialCurrency)}${suffix ?? ''}`;

  const tcDate = new Date(rateUpdatedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const tcNote = `TC ref. Banxico · ${rate.toFixed(2)} MXN/USD · ${tcDate}`;

  if (variant === 'inline') {
    return (
      <span className={className}>
        {originalLabel}{' '}
        <span className={inlineSecondaryCls}>({referencialLabel})</span>
      </span>
    );
  }

  if (variant === 'single') {
    return <span className={`${SIZE_PRIMARY[size]} ${className}`}>{originalLabel}</span>;
  }

  // variant === 'dual' — estático: original SIEMPRE arriba, referencial SIEMPRE
  // abajo. No clickeable, no responde al toggle global de currency. Se muestran
  // ambos al mismo tiempo para claridad sin ambigüedad. El "(Original)" de
  // arriba se omite (feedback Luis 2026-05-22): basta con "(Referencial)" abajo
  // para desambiguar — el precio principal es por defecto el cotizado.
  return (
    <div className={`inline-flex flex-col items-baseline ${className}`}>
      <span className={SIZE_PRIMARY[size]}>
        {originalLabel}
      </span>
      <span className={`${SIZE_SECONDARY[size]} ${secondaryColorCls} leading-tight`}>
        {referencialLabel}
        <span className={`ml-1 ${refLabelCls}`}>(Referencial)</span>
      </span>
      {showRateNote && (
        <span className={`text-[10px] ${rateNoteCls} mt-0.5 italic`}>{tcNote}</span>
      )}
    </div>
  );
}
