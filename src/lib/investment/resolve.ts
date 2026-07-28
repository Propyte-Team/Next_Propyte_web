// src/lib/investment/resolve.ts
// Resuelve ROI y renta mensual de una unidad con precedencia explícita.
// Lib pura: no toca red ni base de datos. Recibe números YA coercionados
// (ver coerceNumericFields en lib/supabase/queries.ts).
// Spec: docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md §3.1

export type InvestmentSource = 'manual' | 'model' | 'ml' | 'none';

/** v_units entrega los NUMERIC como string cuando la fila no pasó por
 *  coerceNumericFields (así los tipa UnitRow), de modo que aquí se aceptan
 *  ambas formas y se coercionan. */
export interface UnitInvestmentFields {
  roi_annual: number | string | null;
  estimated_rent_mxn: number | string | null;
}

/** Subconjunto de investment_analytics.development_financials que el sitio necesita.
 *  Solo residencial: el badge de card muestra siempre el escenario conservador
 *  (spec D4 — tipo_rendimiento no distingue modalidad de renta). */
export interface DevFinancialsSlice {
  roi_annual_pct: number | string | null;
  estimated_rent_residencial: number | string | null;
}

export interface ResolvedInvestment {
  /** null = sin dato. NUNCA 0 como sentinela. */
  roiPct: number | null;
  /** null = sin dato. NUNCA 0 como sentinela. */
  rentMonthly: number | null;
  roiSource: InvestmentSource;
  rentSource: InvestmentSource;
}

/** Un valor sirve solo si es un número finito y > 0. null, 0, negativos, NaN y
 *  strings no numéricos se tratan como ausentes. Los NUMERIC de Postgres llegan
 *  como string y se coercionan aquí — el guard contra un pipeline sin coerción
 *  vive en getBatchFinancials, no en este módulo. */
function usable(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
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
