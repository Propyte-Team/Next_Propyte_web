// src/lib/investment/resolve.ts
// Resuelve ROI y renta mensual de una unidad con precedencia explícita.
// Lib pura: no toca red ni base de datos. Recibe números YA coercionados
// (ver coerceNumericFields en lib/supabase/queries.ts).
// Spec: docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md §3.1

export type InvestmentSource = 'manual' | 'model' | 'ml' | 'none';

export interface UnitInvestmentFields {
  roi_annual: number | null;
  estimated_rent_mxn: number | null;
}

/** Subconjunto de investment_analytics.development_financials que el sitio necesita.
 *  Solo residencial: el badge de card muestra siempre el escenario conservador
 *  (spec D4 — tipo_rendimiento no distingue modalidad de renta). */
export interface DevFinancialsSlice {
  roi_annual_pct: number | null;
  estimated_rent_residencial: number | null;
}

export interface ResolvedInvestment {
  /** null = sin dato. NUNCA 0 como sentinela. */
  roiPct: number | null;
  /** null = sin dato. NUNCA 0 como sentinela. */
  rentMonthly: number | null;
  roiSource: InvestmentSource;
  rentSource: InvestmentSource;
}

/** Un valor sirve solo si es number finito y > 0. Strings (NUMERIC sin coercionar),
 *  null, 0, negativos y NaN se tratan como ausentes. */
function usable(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export function resolveUnitInvestment(
  unit: UnitInvestmentFields,
  financials: DevFinancialsSlice | null,
  mlRent: number | null,
): ResolvedInvestment {
  const manualRoi = usable(unit.roi_annual);
  const modelRoi = usable(financials?.roi_annual_pct);

  const manualRent = usable(unit.estimated_rent_mxn);
  const mlRentUsable = usable(mlRent);
  const modelRent = usable(financials?.estimated_rent_residencial);

  return {
    roiPct: manualRoi ?? modelRoi,
    rentMonthly: manualRent ?? mlRentUsable ?? modelRent,
    roiSource: manualRoi != null ? 'manual' : modelRoi != null ? 'model' : 'none',
    rentSource:
      manualRent != null ? 'manual'
        : mlRentUsable != null ? 'ml'
          : modelRent != null ? 'model'
            : 'none',
  };
}
