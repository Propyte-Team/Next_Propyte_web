import type { SupabaseClient } from '@supabase/supabase-js';
import type { DevelopmentRow } from '@/lib/mappers/development-to-property';
import { resolveProductType, type ProductType } from '@/lib/catalog/product-types';

// Mismo alias que usa lib/supabase/queries.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

/** Campos que este helper inyecta en cada `DevelopmentRow`. El mapper los lee de
 *  forma defensiva: si el caller no corrió el helper, la card simplemente no
 *  rendea tipos/área. */
export interface DevelopmentUnitAggregates {
  bedrooms_min?: number;
  bedrooms_max?: number;
  /** Mínimo de area_m2 || lot_area_m2 entre las unidades cargadas. */
  area_min_m2?: number;
  /** Mínimos de precio y área POR tipo de producto. Alimenta el «desde» de la
   *  tarjeta cuando hay un filtro de tipo activo: sin esto, un desarrollo con
   *  lotes desde $1M y casas desde $5M muestra «desde $1,000,000» al filtrar
   *  Casa. Nadie miente a propósito — el número simplemente no responde a la
   *  pregunta que hizo el comprador. */
  unit_type_stats?: UnitTypeStats;
}

export type DevelopmentRowWithAggregates = DevelopmentRow & DevelopmentUnitAggregates;

type UnitAggRow = {
  development_id: string | null;
  bedrooms: number | null;
  unit_type: string | null;
  area_m2: number | string | null;
  lot_area_m2: number | string | null;
  price_mxn: number | string | null;
};

/** Supabase serializa NUMERIC como string ("43.60"). Sin esta coerción,
 *  Math.min sobre strings devuelve basura. */
function toPositiveNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type UnitTypeStat = { priceMin: number | null; areaMin: number | null };
export type UnitTypeStats = Partial<Record<ProductType, UnitTypeStat>>;

type UnitStatRow = {
  unit_type: string | null;
  price_mxn: number | string | null;
  area_m2: number | string | null;
  lot_area_m2: number | string | null;
};

/**
 * Mínimos de precio y área agrupados por tipo de producto.
 *
 * Pura y exportada a propósito: es la lógica que decide qué número ve el
 * comprador, y probarla contra la base sería probar la base.
 */
export function accumulateUnitStats(rows: UnitStatRow[]): UnitTypeStats {
  const out: UnitTypeStats = {};
  for (const u of rows) {
    const tipo = resolveProductType(u.unit_type);
    if (!tipo) continue;

    const price = toPositiveNumber(u.price_mxn);
    const area = toPositiveNumber(u.area_m2) ?? toPositiveNumber(u.lot_area_m2);

    const acc = out[tipo] ?? { priceMin: null, areaMin: null };
    if (price !== null) acc.priceMin = acc.priceMin === null ? price : Math.min(acc.priceMin, price);
    if (area !== null) acc.areaMin = acc.areaMin === null ? area : Math.min(acc.areaMin, area);
    out[tipo] = acc;
  }
  return out;
}

/**
 * Inyecta en cada row de `v_developments` los agregados que sólo existen a nivel
 * unidad: rango de recámaras, área mínima y mínimos de precio/área por tipo de
 * producto (`unit_type_stats`). Una sola query bulk a `v_units` para todos los
 * desarrollos.
 *
 * NO calcula `unitTypes` — esa pregunta la resuelve `property_types` en
 * `mapDevelopmentToProperty`, porque ese campo ya implementa el override
 * manual y este agregador de inventario no lo respeta. Ver defecto 2026-08-20.
 *
 * Muta las rows in place (mismo patrón que tenía inline `desarrollos/page.tsx`)
 * y las devuelve tipadas para conveniencia del caller.
 *
 * Falla en silencio con console.error: si la query truena, los listados rendean
 * sin agregados en vez de tirar la página.
 */
export async function attachDevelopmentUnitAggregates(
  client: Client,
  rows: DevelopmentRow[],
): Promise<DevelopmentRowWithAggregates[]> {
  const typed = rows as DevelopmentRowWithAggregates[];
  const devIds = rows.map((d) => d.id).filter(Boolean);
  if (devIds.length === 0) return typed;

  try {
    const { data, error } = await client
      .schema('real_estate_hub' as 'public')
      .from('v_units')
      .select('development_id, bedrooms, unit_type, area_m2, lot_area_m2, price_mxn')
      .in('development_id', devIds)
      .not('approved_at', 'is', null)
      .is('deleted_at', null);

    if (error) {
      console.error('[attachDevelopmentUnitAggregates]', error.message);
      return typed;
    }

    const byDev = new Map<
      string,
      { bedMin: number | null; bedMax: number | null; areaMin: number | null; rows: UnitAggRow[] }
    >();

    (data as UnitAggRow[] | null)?.forEach((u) => {
      if (!u.development_id) return;
      let acc = byDev.get(u.development_id);
      if (!acc) {
        acc = { bedMin: null, bedMax: null, areaMin: null, rows: [] };
        byDev.set(u.development_id, acc);
      }
      acc.rows.push(u);

      const beds = toPositiveNumber(u.bedrooms);
      if (beds !== null) {
        acc.bedMin = acc.bedMin === null ? beds : Math.min(acc.bedMin, beds);
        acc.bedMax = acc.bedMax === null ? beds : Math.max(acc.bedMax, beds);
      }

      // Mismo fallback que usa el mapper de unidades: construcción, luego lote.
      const area = toPositiveNumber(u.area_m2) ?? toPositiveNumber(u.lot_area_m2);
      if (area !== null) {
        acc.areaMin = acc.areaMin === null ? area : Math.min(acc.areaMin, area);
      }
    });

    typed.forEach((d) => {
      const acc = byDev.get(d.id);
      if (!acc) return;
      if (acc.bedMin !== null) d.bedrooms_min = acc.bedMin;
      if (acc.bedMax !== null) d.bedrooms_max = acc.bedMax;
      if (acc.areaMin !== null) d.area_min_m2 = acc.areaMin;

      const stats = accumulateUnitStats(acc.rows);
      if (Object.keys(stats).length > 0) d.unit_type_stats = stats;
    });
  } catch (err) {
    console.error('[attachDevelopmentUnitAggregates] exception:', err);
  }

  return typed;
}
