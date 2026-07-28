// src/lib/investment/resolve.ts
// Resuelve renta y rendimiento de una unidad con precedencia explícita.
// Lib pura: no toca red ni base de datos.
// Spec: docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md §3.1

export type InvestmentSource = 'manual' | 'model' | 'ml' | 'none';

/** Qué representa el número que se muestra en el badge. */
export type YieldKind = 'roi' | 'yield';

export interface UnitInvestmentFields {
  roi_annual: number | string | null;
  estimated_rent_mxn: number | string | null;
  price_mxn: number | string | null;
  discount_price_mxn?: number | string | null;
  is_discount_active?: boolean | null;
}

/** Subconjunto de investment_analytics.development_financials que el sitio usa.
 *
 *  `roi_annual_pct` NO está aquí a propósito: al 2026-07-27 tiene 2 valores
 *  distintos en 197 filas (0 en 182 devs del modelo gbr_v2, 8.84 constante en
 *  los 15 de v1.1-realtime). No es una estimación por desarrollo, así que
 *  publicarla sería repetir el mismo número inventado que vinimos a quitar.
 *  Lo mismo aplica a cap_rate (llega a 891%) e irr_5yr (NULL en las 197).
 *  La renta sí tiene variación creíble: 120 valores entre 12,400 y 82,400. */
export interface DevFinancialsSlice {
  estimated_rent_residencial: number | string | null;
}

export interface ResolvedInvestment {
  /** Número del badge: ROI capturado o, en su defecto, yield bruto derivado de
   *  la renta. null = sin dato. NUNCA 0 como sentinela. */
  displayPct: number | null;
  /** Qué es displayPct. null cuando no hay número. */
  displayKind: YieldKind | null;
  /** null = sin dato. NUNCA 0 como sentinela. */
  rentMonthly: number | null;
  rentSource: InvestmentSource;
}

/** Un valor sirve solo si es un número finito y > 0. null, 0, negativos, NaN y
 *  strings no numéricos se tratan como ausentes. Los NUMERIC de Postgres llegan
 *  como string y se coercionan aquí. */
function usable(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Precio sobre el que se calcula el rendimiento: el efectivo con descuento
 *  vigente, si lo hay. */
export function effectivePrice(unit: UnitInvestmentFields): number | null {
  const discounted = usable(unit.discount_price_mxn);
  if (unit.is_discount_active && discounted != null) return discounted;
  return usable(unit.price_mxn);
}

export function resolveUnitInvestment(
  unit: UnitInvestmentFields,
  financials: DevFinancialsSlice | null,
  mlRent: number | null,
): ResolvedInvestment {
  const manualRent = usable(unit.estimated_rent_mxn);
  const mlRentUsable = usable(mlRent);
  const modelRent = usable(financials?.estimated_rent_residencial);
  const rentMonthly = manualRent ?? mlRentUsable ?? modelRent;

  const price = effectivePrice(unit);
  const grossYieldPct = rentMonthly != null && price != null
    ? (rentMonthly * 12 / price) * 100
    : null;

  // El ROI solo puede venir de captura humana en el Hub. El del modelo está
  // descartado por constante (ver DevFinancialsSlice).
  const manualRoi = usable(unit.roi_annual);
  const displayPct = manualRoi ?? grossYieldPct;

  return {
    displayPct,
    displayKind: manualRoi != null ? 'roi' : grossYieldPct != null ? 'yield' : null,
    rentMonthly,
    rentSource:
      manualRent != null ? 'manual'
        : mlRentUsable != null ? 'ml'
          : modelRent != null ? 'model'
            : 'none',
  };
}
