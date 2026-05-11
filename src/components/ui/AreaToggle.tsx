'use client';

import { useTranslations } from 'next-intl';
import { useUnits } from '@/lib/units-context';

interface AreaToggleProps {
  tone?: 'light' | 'dark';
}

/**
 * Toggle global de unidad de área: m² ↔ sqft.
 * Mismo estilo segmented del CurrencyToggle. Persiste preferencia via UnitsContext.
 * Afecta todos los <AreaDisplay /> del sitio.
 */
export default function AreaToggle({ tone = 'light' }: AreaToggleProps = {}) {
  const t = useTranslations('a11y');
  const { unit, setUnit } = useUnits();

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

  // Etiqueta accesible (cae a literal si la key no existe en messages)
  const ariaLabel = (() => {
    try {
      return t('areaUnitSelector');
    } catch {
      return 'Unidad de área';
    }
  })();

  return (
    <div role="group" aria-label={ariaLabel} className={containerCls}>
      <button
        type="button"
        onClick={() => setUnit('m2')}
        aria-pressed={unit === 'm2'}
        disabled={unit === 'm2'}
        className={`${btnBase} ${unit === 'm2' ? activeCls : inactiveCls}`}
      >
        m²
      </button>
      <button
        type="button"
        onClick={() => setUnit('sqft')}
        aria-pressed={unit === 'sqft'}
        disabled={unit === 'sqft'}
        className={`${btnBase} ${unit === 'sqft' ? activeCls : inactiveCls}`}
      >
        sqft
      </button>
    </div>
  );
}
