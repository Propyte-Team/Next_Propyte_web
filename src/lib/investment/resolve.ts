// src/lib/investment/resolve.ts
// Resuelve renta y rendimiento de una unidad con precedencia explícita.
// Lib pura: no toca red ni base de datos.
// Spec: docs/superpowers/specs/2026-07-27-metricas-inversion-unidades-design.md §3.1

import { residentialGrossYieldPct, GROSS_YIELD_BOUNDS } from '@/lib/calculator';

export type InvestmentSource = 'manual' | 'market' | 'ml' | 'model' | 'none';

/** Qué representa el número que se muestra en el badge. */
export type YieldKind = 'roi' | 'yield';

/** v_units entrega los NUMERIC como string cuando la fila no pasó por
 *  coerceNumericFields (así los tipa UnitRow), de modo que aquí se aceptan
 *  ambas formas y se coercionan. */
export interface UnitInvestmentFields {
  roi_annual: number | string | null;
  estimated_rent_mxn: number | string | null;
  price_mxn: number | string | null;
  discount_price_mxn?: number | string | null;
  is_discount_active?: boolean | null;
  /** Define los gastos de cierre en el cálculo del yield. */
  state?: string | null;
}

/** Subconjunto de investment_analytics.development_financials que el sitio usa.
 *
 *  `roi_annual_pct` NO está aquí a propósito: al 2026-07-27 tiene 2 valores
 *  distintos en 197 filas (0 en 182 devs del modelo gbr_v2, 8.84 constante en
 *  los 15 de v1.1-realtime). No es una estimación por desarrollo, así que
 *  publicarla sería repetir el mismo número inventado que vinimos a quitar.
 *  Lo mismo aplica a cap_rate (llega a 891%) e irr_5yr (NULL en las 197). */
export interface DevFinancialsSlice {
  estimated_rent_residencial: number | string | null;
}

export interface ResolvedInvestment {
  /** Número del badge: ROI capturado o, en su defecto, yield bruto. Misma
   *  definición que el tab Rentabilidad. null = sin dato, NUNCA 0. */
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

/** Precio efectivo con descuento vigente, si lo hay. */
export function effectivePrice(unit: UnitInvestmentFields): number | null {
  const discounted = usable(unit.discount_price_mxn);
  if (unit.is_discount_active && discounted != null) return discounted;
  return usable(unit.price_mxn);
}

/**
 * Precedencia de renta: manual del Hub → **mercado** (comparables por
 * ciudad/zona/tipo/recámaras, lo mismo que publica el tab Rentabilidad) → ML por
 * recámaras → modelo a nivel desarrollo.
 *
 * El mercado va primero entre las no-manuales a propósito: es la fuente que la
 * ficha ya muestra y atribuye. Cuando el badge usaba otra, la misma unidad
 * decía 4.8% en la card y 8.4% en el tab.
 */
export function resolveUnitInvestment(
  unit: UnitInvestmentFields,
  financials: DevFinancialsSlice | null,
  mlRent: number | null,
  marketRent: number | null = null,
): ResolvedInvestment {
  const manualRent = usable(unit.estimated_rent_mxn);
  const marketRentUsable = usable(marketRent);
  const mlRentUsable = usable(mlRent);
  const modelRent = usable(financials?.estimated_rent_residencial);
  const rentMonthly = manualRent ?? marketRentUsable ?? mlRentUsable ?? modelRent;

  const rawYield = residentialGrossYieldPct(
    rentMonthly,
    effectivePrice(unit),
    unit.state || 'Quintana Roo',
  );
  // Fuera de la banda no se publica: un yield de 107% (lote con renta de
  // departamento) o de 0.1% (precio roto en la BD) no es un dato, es ruido.
  const grossYieldPct = rawYield != null
    && rawYield >= GROSS_YIELD_BOUNDS.MIN
    && rawYield <= GROSS_YIELD_BOUNDS.MAX
    ? rawYield
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
        : marketRentUsable != null ? 'market'
          : mlRentUsable != null ? 'ml'
            : modelRent != null ? 'model'
              : 'none',
  };
}
