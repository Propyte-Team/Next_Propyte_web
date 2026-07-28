// src/lib/investment/resolve-rows.ts
// Resuelve las métricas de inversión de un lote de filas de v_units en un solo
// lugar: renta de mercado (deduplicada por combo) + modelo por desarrollo →
// resolveUnitInvestment. Server-only (recibe el cliente Supabase).
//
// Los listados NO deben cablear esto a mano: si cada página arma su propia
// precedencia, vuelven a divergir los números entre card y ficha.

import { getFinancialsMap, getMarketRentMap } from '@/lib/supabase/queries';
import { normalizeUnitType } from '@/lib/mappers/unit-to-property';
import { marketComboKey, marketRentForUnit, type MarketRentTarget } from './market-rent';
import { resolveUnitInvestment, type ResolvedInvestment } from './resolve';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

/** Campos de v_units que la resolución necesita. */
export interface ResolvableUnitRow {
  id: string;
  development_id?: string | null;
  city?: string | null;
  zone?: string | null;
  unit_type?: string | null;
  bedrooms?: number | null;
  area_m2?: number | null;
  lot_area_m2?: number | null;
  state?: string | null;
  roi_annual: number | string | null;
  estimated_rent_mxn: number | string | null;
  price_mxn: number | string | null;
  discount_price_mxn?: number | string | null;
  is_discount_active?: boolean | null;
}

export function unitMarketTarget(row: ResolvableUnitRow): MarketRentTarget {
  return {
    city: row.city ?? null,
    zone: row.zone ?? null,
    // Mismo normalizado que usa specs.type en el mapper, que es lo que la ficha
    // le pasa a getRentalEstimate.
    propertyType: normalizeUnitType(row.unit_type),
    bedrooms: row.bedrooms ?? null,
  };
}

/** Área que la ficha usa para la renta por m². */
export function unitArea(row: ResolvableUnitRow): number | null {
  return row.area_m2 || row.lot_area_m2 || null;
}

/** Map id de unidad → métricas resueltas. Tolera fallos: una fila sin datos
 *  queda con displayPct null y el UI no pinta badge. */
export async function resolveInvestmentForRows(
  client: Client,
  rows: ResolvableUnitRow[],
): Promise<Map<string, ResolvedInvestment>> {
  if (rows.length === 0) return new Map();

  const [finMap, marketMap] = await Promise.all([
    getFinancialsMap(
      client,
      rows.map((r) => r.development_id).filter((id): id is string => !!id),
    ),
    getMarketRentMap(client, rows.map(unitMarketTarget)),
  ]);

  return new Map(rows.map((row) => {
    const market = marketRentForUnit(
      marketMap.get(marketComboKey(unitMarketTarget(row))),
      unitArea(row),
    );
    return [
      row.id,
      resolveUnitInvestment(
        row,
        finMap.get(row.development_id ?? '') ?? null,
        // El ML es una consulta por unidad; en listados no se pide.
        null,
        market,
      ),
    ];
  }));
}
