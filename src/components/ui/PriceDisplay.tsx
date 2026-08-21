'use client';

import { useCurrency, type Currency } from '@/context/CurrencyContext';
import { carasDelPrecio } from '@/lib/precio-moneda';

interface PriceDisplayProps {
  /**
   * El monto tal como se cotizó, en la moneda que dice `currency`.
   *
   * Antes esta prop se llamaba `mxn` y se asumía SIEMPRE en pesos: la otra moneda
   * salía de dividir por el TC, y `originalCurrency` sólo decidía cuál de los dos
   * se mostraba grande. Con un desarrollo cotizado en dólares eso publicaba
   * "$145,000 MXN" y, si se marcaba USD, "$8,550 USD" — el monto dividido por un
   * TC que nunca debió aplicarse. El monto y su moneda viajan juntos.
   */
  amount: number | string | null | undefined;
  /** Variante visual (default: dual). */
  variant?: 'dual' | 'single' | 'inline';
  /** Tamaño de la unidad principal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mostrar texto "TC ref. Banxico {fecha}" debajo (solo en dual). */
  showRateNote?: boolean;
  /** Sufijo opcional (ej. "/m²") */
  suffix?: string;
  /**
   * Moneda EN LA QUE ESTÁ `amount`. Se muestra arriba grande; la otra se calcula
   * con el TC y va abajo chiquita marcada como (Referencial).
   *
   * Obligatoria a propósito: un default 'MXN' es exactamente lo que hacía que la
   * ficha de desarrollo rotulara dólares como pesos sin que nada fallara.
   */
  currency: Currency;
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
  amount,
  variant = 'dual',
  size = 'md',
  showRateNote = false,
  suffix,
  currency,
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
  if (amount == null) return <span className={className}>—</span>;
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n) || n <= 0) return <span className={className}>—</span>;

  // `n` está en `currency`: es la cifra que el desarrollador cotizó, sin tocar.
  // La OTRA moneda es la calculada, y es la única que lleva el TC encima.
  // La fórmula vive en @/lib/precio-moneda para poder testearla sin React.
  const caras = carasDelPrecio(n, currency, rate);
  const originalValue = caras.original;
  const referencialValue = caras.referencial;
  const referencialCurrency: Currency = caras.referencialMoneda;
  const originalLabel = `${formatCurrency(originalValue, currency)}${suffix ?? ''}`;
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
