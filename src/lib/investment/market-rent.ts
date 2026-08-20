// src/lib/investment/market-rent.ts
// Renta de mercado por unidad: la MISMA fuente y la MISMA fórmula que usa el tab
// Rentabilidad de la ficha (`getRentalEstimate` sobre rental_comparables).
// Lib pura — el fetch vive en lib/supabase/queries.ts (getMarketRentMap).
//
// Existe porque el badge de las cards y el tab publicaban dos rentas distintas
// para la misma unidad. Cualquier consumidor del "yield" del sitio debe pasar
// por aquí para pedir la renta.

/** Combinación por la que se busca comparables. `propertyType` ya normalizado
 *  (ver normalizeUnitType en lib/mappers/unit-to-property.ts). */
export interface MarketRentTarget {
  city: string | null;
  zone: string | null;
  propertyType: string | null;
  bedrooms: number | null;
}

/** Lo que devuelve getRentalEstimate y este módulo necesita. */
export interface MarketRentEstimate {
  median_rent_mxn: number;
  avg_rent_per_m2: number | null;
}

/** Tipos que producen renta habitacional. Un terreno o macrolote NO renta como
 *  vivienda: `getRentalEstimate` no encuentra comparables de su tipo y cae al
 *  nivel ciudad, devolviendo renta de departamento. Aplicada a un lote de
 *  $300k eso daba yields de 107% (visto 2026-07-28 en los `lote-*` de Región 11). */
// 'villa' entra al abrirse como canónico propio: antes caía en 'casa' y sí
// estimaba renta. Sin esta línea, separar villa apagaría en silencio la
// estimación de renta de esos desarrollos.
const RENTABLE_PROPERTY_TYPES = new Set(['departamento', 'penthouse', 'casa', 'villa']);

export function isRentableType(propertyType: string | null | undefined): boolean {
  return RENTABLE_PROPERTY_TYPES.has((propertyType ?? '').toLowerCase().trim());
}

/** Clave estable para deduplicar targets. Sin acentos ni caso: dos unidades que
 *  escriben "Aldea Zamá" y "aldea zama" comparten comparables. */
export function marketComboKey(t: MarketRentTarget): string {
  const norm = (v: string | null | undefined) =>
    (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return [norm(t.city), norm(t.zone), norm(t.propertyType), t.bedrooms ?? ''].join('|');
}

/**
 * Renta mensual de mercado para una unidad concreta. Misma preferencia que la
 * ficha (UnitDetailPage): renta por m² × área si hay ambas, si no la mediana del
 * grupo. Devuelve null cuando no hay estimación utilizable.
 */
export function marketRentForUnit(
  estimate: MarketRentEstimate | null | undefined,
  areaM2: number | null | undefined,
): number | null {
  if (!estimate) return null;
  const perM2 = estimate.avg_rent_per_m2;
  const area = areaM2 ?? 0;
  if (perM2 != null && perM2 > 0 && area > 0) return Math.round(perM2 * area);
  const median = estimate.median_rent_mxn;
  return median != null && median > 0 ? median : null;
}
