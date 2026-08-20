import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeUnitType } from '@/lib/mappers/unit-to-property';
import type { DevelopmentRow } from '@/lib/mappers/development-to-property';
import type { Property } from '@/types/property';
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';

// Mismo alias que usa lib/supabase/queries.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

/** Campos que este helper inyecta en cada `DevelopmentRow`. El mapper los lee de
 *  forma defensiva: si el caller no corrió el helper, la card simplemente no
 *  rendea tipos/área. */
export interface DevelopmentUnitAggregates {
  bedrooms_min?: number;
  bedrooms_max?: number;
  /** Tipos canónicos presentes en el inventario, dedup y en orden fijo. */
  unit_types?: Array<Property['specs']['type']>;
  /** Mínimo de area_m2 || lot_area_m2 entre las unidades cargadas. */
  area_min_m2?: number;
}

export type DevelopmentRowWithAggregates = DevelopmentRow & DevelopmentUnitAggregates;

/**
 * Orden de presentación de los tipos de unidad. FIJO a propósito: `v_units` es
 * un SUBCONJUNTO del inventario (Ancestral: total_units=221 vs 5 filas), así que
 * ordenar por frecuencia inventaría una jerarquía que el dato no respalda.
 * Sale del catálogo, que ya lo declara en el orden correcto.
 */
const TYPE_ORDER: ReadonlyArray<Property['specs']['type']> = PRODUCT_TYPES;

type UnitAggRow = {
  development_id: string | null;
  bedrooms: number | null;
  unit_type: string | null;
  area_m2: number | string | null;
  lot_area_m2: number | string | null;
};

/** Supabase serializa NUMERIC como string ("43.60"). Sin esta coerción,
 *  Math.min sobre strings devuelve basura. */
function toPositiveNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Inyecta en cada row de `v_developments` los agregados que sólo existen a nivel
 * unidad: rango de recámaras, tipos de unidad y área mínima. Una sola query bulk
 * a `v_units` para todos los desarrollos.
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
      .select('development_id, bedrooms, unit_type, area_m2, lot_area_m2')
      .in('development_id', devIds)
      .not('approved_at', 'is', null)
      .is('deleted_at', null);

    if (error) {
      console.error('[attachDevelopmentUnitAggregates]', error.message);
      return typed;
    }

    const byDev = new Map<
      string,
      { bedMin: number | null; bedMax: number | null; types: Set<Property['specs']['type']>; areaMin: number | null }
    >();

    (data as UnitAggRow[] | null)?.forEach((u) => {
      if (!u.development_id) return;
      let acc = byDev.get(u.development_id);
      if (!acc) {
        acc = { bedMin: null, bedMax: null, types: new Set(), areaMin: null };
        byDev.set(u.development_id, acc);
      }

      const beds = toPositiveNumber(u.bedrooms);
      if (beds !== null) {
        acc.bedMin = acc.bedMin === null ? beds : Math.min(acc.bedMin, beds);
        acc.bedMax = acc.bedMax === null ? beds : Math.max(acc.bedMax, beds);
      }

      // unit_type crudo de Zoho ("Terreno", "Lote", "Estudio", "2 Recámaras").
      // Sólo cuenta si hay texto: sin él normalizeUnitType cae a 'departamento'
      // y anunciaríamos departamentos en un desarrollo de lotes.
      if (typeof u.unit_type === 'string' && u.unit_type.trim()) {
        acc.types.add(normalizeUnitType(u.unit_type));
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
      if (acc.types.size > 0) d.unit_types = TYPE_ORDER.filter((t) => acc.types.has(t));
      if (acc.areaMin !== null) d.area_min_m2 = acc.areaMin;
    });
  } catch (err) {
    console.error('[attachDevelopmentUnitAggregates] exception:', err);
  }

  return typed;
}
