'use client';

import { useUnits, m2ToSqft, type AreaUnit } from '@/lib/units-context';

interface AreaDisplayProps {
  /** Valor en m² (única fuente de verdad en BD). Acepta number, string numérica o null. */
  m2: number | string | null | undefined;
  /** Variante visual:
   *   - `dual` (default): unidad activa GRANDE + secundaria pequeña abajo.
   *     Al hacer click, intercambia GRANDE↔pequeña (toggle global del Context).
   *   - `single`: solo la unidad activa, sin secundaria.
   *   - `inline`: una línea sola "120 m² (1,292 sqft)".
   */
  variant?: 'dual' | 'single' | 'inline';
  /** Tamaño de la unidad principal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Clases adicionales */
  className?: string;
}

const SIZE_PRIMARY: Record<NonNullable<AreaDisplayProps['size']>, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-xl font-bold',
  xl: 'text-3xl md:text-4xl font-extrabold',
};

const SIZE_SECONDARY: Record<NonNullable<AreaDisplayProps['size']>, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-sm md:text-base',
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Math.round(n * 100) / 100
  );
}

function pickValues(m2: number | string | null | undefined) {
  if (m2 == null) return null;
  const n = typeof m2 === 'string' ? Number(m2) : m2;
  if (!Number.isFinite(n) || n <= 0) return null;
  return { m2: n, sqft: m2ToSqft(n) };
}

function unitLabel(value: number, unit: AreaUnit): string {
  return unit === 'm2' ? `${formatNumber(value)} m²` : `${formatNumber(value)} sqft`;
}

export default function AreaDisplay({
  m2,
  variant = 'dual',
  size = 'md',
  className = '',
}: AreaDisplayProps) {
  const { unit, toggle } = useUnits();
  const v = pickValues(m2);
  if (!v) return <span className={className}>—</span>;

  const primaryValue = unit === 'm2' ? v.m2 : v.sqft!;
  const secondaryValue = unit === 'm2' ? v.sqft! : v.m2;
  const secondaryUnit: AreaUnit = unit === 'm2' ? 'sqft' : 'm2';

  if (variant === 'inline') {
    return (
      <span className={className}>
        {unitLabel(primaryValue, unit)}{' '}
        <span className="text-gray-500 text-xs">({unitLabel(secondaryValue, secondaryUnit)})</span>
      </span>
    );
  }

  if (variant === 'single') {
    return <span className={`${SIZE_PRIMARY[size]} ${className}`}>{unitLabel(primaryValue, unit)}</span>;
  }

  // variant === 'dual' — click para alternar
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Cambiar a ${secondaryUnit === 'm2' ? 'metros cuadrados' : 'pies cuadrados'}`}
      className={`inline-flex flex-col items-baseline text-left hover:opacity-80 transition-opacity cursor-pointer ${className}`}
    >
      <span className={SIZE_PRIMARY[size]}>{unitLabel(primaryValue, unit)}</span>
      <span className={`${SIZE_SECONDARY[size]} text-gray-500 leading-tight`}>
        {unitLabel(secondaryValue, secondaryUnit)}
      </span>
    </button>
  );
}
