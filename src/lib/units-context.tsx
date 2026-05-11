'use client';

/**
 * UnitsContext — toggle global m² ↔ sqft para visualización de áreas.
 *
 * BD: las áreas siempre se almacenan en m² (única fuente de verdad). La view
 * v_units expone columnas `area_m2` y `area_sqft` derivadas. La conversión
 * es deterministica: 1 m² = 10.7639104 sqft.
 *
 * State persistido en localStorage para mantener preferencia entre páginas
 * y sesiones. SSR: default 'm2' (no hay localStorage), client hydrata desde
 * storage si existe.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AreaUnit = 'm2' | 'sqft';

const STORAGE_KEY = 'propyte:area-unit';
const M2_TO_SQFT = 10.7639104;

interface UnitsContextValue {
  unit: AreaUnit;
  toggle: () => void;
  setUnit: (u: AreaUnit) => void;
}

const UnitsContext = createContext<UnitsContextValue>({
  unit: 'm2',
  toggle: () => {},
  setUnit: () => {},
});

export function UnitsProvider({ children }: { children: ReactNode }) {
  // SSR-safe default: 'm2'. Cliente hydrata desde localStorage en useEffect.
  const [unit, setUnitState] = useState<AreaUnit>('m2');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'm2' || stored === 'sqft') setUnitState(stored);
    } catch {
      // localStorage puede fallar en modo privado o iframes; ignorar
    }
  }, []);

  const setUnit = (u: AreaUnit) => {
    setUnitState(u);
    try {
      window.localStorage.setItem(STORAGE_KEY, u);
    } catch {}
  };
  const toggle = () => setUnit(unit === 'm2' ? 'sqft' : 'm2');

  return (
    <UnitsContext.Provider value={{ unit, toggle, setUnit }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitsContext);
}

// =============================================================================
// Conversión helpers — exportables (usables fuera de React)
// =============================================================================

export function m2ToSqft(m2: number | null | undefined): number | null {
  if (m2 == null || isNaN(m2)) return null;
  return Math.round(m2 * M2_TO_SQFT * 100) / 100; // 2 decimales
}

export function sqftToM2(sqft: number | null | undefined): number | null {
  if (sqft == null || isNaN(sqft)) return null;
  return Math.round((sqft / M2_TO_SQFT) * 100) / 100;
}

export function formatArea(m2: number | null | undefined, unit: AreaUnit): string {
  if (m2 == null || isNaN(m2)) return '—';
  if (unit === 'sqft') {
    const sqft = m2ToSqft(m2);
    return sqft == null ? '—' : `${formatNumber(sqft)} sqft`;
  }
  return `${formatNumber(m2)} m²`;
}

function formatNumber(n: number): string {
  // 1234.56 → "1,234.56" / 1234 → "1,234"
  const rounded = Math.round(n * 100) / 100;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(rounded);
}
