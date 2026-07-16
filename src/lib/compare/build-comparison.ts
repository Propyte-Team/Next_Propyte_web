import type { SupabaseClient } from '@supabase/supabase-js';
import { CITY_TO_MARKET_CODE } from '@/lib/calculator';
import {
  getAirdnaMarketSummary,
  getDevelopmentsByIds,
  getUnits,
  getUnitsByIds,
} from '@/lib/supabase/queries';
import {
  developmentPricePerM2,
  projectedVacationRoi,
  resolveZoneAirdna,
  unitPricePerM2,
  type ZoneAirdnaRow,
} from '@/lib/compare/metrics';
import type { CompareKind, ComparisonItem, ComparisonPayload } from '@/types/compare';

// Tope generoso al traer las unidades de un desarrollo para promediar
// developmentPricePerM2 — getUnits pagina con `limit`; ningún desarrollo del
// catálogo actual se acerca a esta cifra, así que en la práctica trae todas.
const MAX_UNITS_FOR_PRICE_PER_M2 = 500;

// Supabase serializa columnas NUMERIC como string (memoria
// feedback_v_units_idiosyncrasies) → `typeof === 'number'` falla. Coerción
// defensiva antes de pasar cualquier valor de precio/área a las funciones puras.
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// El ROI vacacional (renta de hospedaje) no aplica a terrenos/lotes — un lote
// no se renta por noche, así que el yield saldría absurdo. Detecta el tipo no
// rentable por nombre; el guard vive aquí (orquestador), no en projectedVacationRoi
// (que queda pura y agnóstica del tipo). Ocupación/ADR/precio-m² sí aplican a un lote.
function isLandType(type: string | null): boolean {
  return !!type && /lote|terreno/i.test(type);
}

// Fila cruda de v_developments tal como la devuelve getDevelopmentsByIds
// (ya pasó por applyDisplayName — `name` es el título público, nunca
// nombre_desarrollo crudo).
interface RawDevelopmentRow {
  id: string;
  slug: string | null;
  name: string | null;
  city: string | null;
  zone: string | null;
  price_min_mxn: number | string | null;
  development_type: string | null;
}

// Fila cruda de v_units tal como la devuelve getUnitsByIds. Los NUMERIC pueden
// llegar como string desde Supabase — se coercionan con num() antes de usarse.
interface RawUnitRow {
  id: string;
  slug: string | null;
  name: string | null;
  title: string | null;
  unit_number: string | null;
  development_name: string | null;
  city: string | null;
  zone: string | null;
  price_mxn: number | string | null;
  area_m2: number | string | null;
  unit_type: string | null;
  // Descuento (v_units) — mismas columnas que consume mapUnitToProperty.
  discount_price_mxn: number | string | null;
  discount_pct: number | string | null;
  is_discount_active: boolean | null;
}

type MarketSummary = {
  current_occupancy: number | null;
  current_adr: number | null;
  zones: ZoneAirdnaRow[];
} | null;

type AirdnaResolver = (city: string | null) => Promise<MarketSummary>;

/**
 * Trae y cachea el resumen AirDNA por market dentro de una sola llamada a
 * buildComparison. Cachea la PROMESA en vuelo (no el valor resuelto) de forma
 * síncrona: como los items corren en `Promise.all`, varios de la misma ciudad
 * chocan contra `cache.has(market)` antes de que el primero resuelva. Guardar
 * la promesa antes del `await` garantiza que todos reusen la misma consulta
 * (getAirdnaMarketSummary son 5 sub-queries) en vez de dispararla N veces.
 */
function makeAirdnaResolver(client: SupabaseClient): AirdnaResolver {
  const cache = new Map<string, Promise<MarketSummary>>();
  return (city: string | null): Promise<MarketSummary> => {
    if (!city) return Promise.resolve(null);
    const market = CITY_TO_MARKET_CODE[city];
    if (!market) return Promise.resolve(null);
    const cached = cache.get(market);
    if (cached) return cached;
    const promise = (async (): Promise<MarketSummary> => {
      try {
        const raw = await getAirdnaMarketSummary(client, market);
        return raw
          ? { current_occupancy: raw.current_occupancy, current_adr: raw.current_adr, zones: raw.zones ?? [] }
          : null;
      } catch (e) {
        console.error(`[buildComparison] getAirdnaMarketSummary('${market}') failed`, e);
        return null;
      }
    })();
    cache.set(market, promise);
    return promise;
  };
}

/**
 * Nombre editorial de la unidad (título Hub) con el mismo fallback que
 * `mapUnitToProperty` usa en ES: título editorial → "<desarrollo> — <número>".
 * buildComparison no recibe locale, así que no distingue title/title_en aquí.
 */
function resolveUnitName(row: RawUnitRow): string {
  const editorial = row.title || row.name;
  if (editorial) return editorial;
  // Mismo literal de fallback que mapUnitToProperty (unit-to-property.ts):
  // nunca exponer el UUID como nombre de unidad.
  const base = row.development_name || row.slug || 'Propiedad';
  return row.unit_number ? `${base} — ${row.unit_number}` : base;
}

/** Resuelve AirDNA por zona/market y calcula el ROI vacacional para un item ya resuelto. */
async function finishItem(
  getAirdna: AirdnaResolver,
  base: {
    id: string;
    kind: CompareKind;
    name: string;
    slug: string | null;
    city: string | null;
    zone: string | null;
    priceBaseMxn: number | null;
    pricePerM2: number | null;
    isLand: boolean;
  },
): Promise<ComparisonItem> {
  const summary = await getAirdna(base.city);
  const { occupancy, adr, level } = resolveZoneAirdna(
    base.zone,
    summary?.zones ?? [],
    { occupancy: summary?.current_occupancy ?? null, adr: summary?.current_adr ?? null },
  );
  // Sin dato AirDNA (occupancy y adr ambos null) → null, para que el footnote
  // no reclame "nivel ciudad" cuando en realidad no hay dato alguno.
  const zoneDataLevel = occupancy === null && adr === null ? null : level;

  // Terrenos/lotes: se suprime el ROI vacacional (no rentable como hospedaje) →
  // el modal lo muestra como "—". Ocupación/ADR/precio-m² se conservan.
  const roiNetYieldPct = base.isLand
    ? null
    : projectedVacationRoi({ priceMxn: base.priceBaseMxn, adr, occupancyPct: occupancy });

  return {
    id: base.id,
    kind: base.kind,
    name: base.name,
    slug: base.slug,
    city: base.city,
    zone: base.zone,
    priceBaseMxn: base.priceBaseMxn,
    metrics: {
      pricePerM2: base.pricePerM2,
      zoneOccupancy: occupancy,
      zoneAdr: adr,
      zoneDataLevel,
      roiNetYieldPct,
    },
  };
}

/**
 * Orquestador server-side del comparador (`GET /api/compare`). Recibe el
 * client de Supabase, el `kind` seleccionado y los `ids` guardados por
 * `useCompare` en localStorage — son `row.id` (UUID de v_developments /
 * v_units), NUNCA slugs.
 *
 * Nunca lanza: un id que no resuelve (borrado, fuera del gate público, etc.)
 * simplemente se omite del payload; una métrica ausente (sin AirDNA para la
 * ciudad, sin área para precio/m²) queda en `null` — el caller la renderiza
 * como "—". El resumen AirDNA se cachea por market dentro de esta llamada
 * (varios items de la misma ciudad reusan la misma consulta).
 */
export async function buildComparison(
  client: SupabaseClient,
  kind: CompareKind,
  ids: string[],
): Promise<ComparisonPayload> {
  if (ids.length === 0) return { kind, items: [] };

  const getAirdna = makeAirdnaResolver(client);

  if (kind === 'development') {
    const devs = (await getDevelopmentsByIds(client, ids)) as RawDevelopmentRow[];
    const byId = new Map(devs.map((d) => [d.id, d]));

    const items = await Promise.all(
      ids.map(async (id): Promise<ComparisonItem | null> => {
        const d = byId.get(id);
        if (!d) return null;

        let units: RawUnitRow[] = [];
        try {
          const res = await getUnits(client, { developmentId: d.id, limit: MAX_UNITS_FOR_PRICE_PER_M2 });
          units = (res.data ?? []) as RawUnitRow[];
        } catch (e) {
          console.error(`[buildComparison] getUnits(developmentId='${d.id}') failed`, e);
          units = [];
        }
        const pricePerM2 = developmentPricePerM2(
          units.map((u) => ({ priceMxn: num(u.price_mxn), areaM2: num(u.area_m2) })),
        );

        return finishItem(getAirdna, {
          id,
          kind,
          name: d.name ?? id,
          slug: d.slug ?? null,
          city: d.city ?? null,
          zone: d.zone ?? null,
          priceBaseMxn: num(d.price_min_mxn),
          pricePerM2,
          isLand: isLandType(d.development_type),
        });
      }),
    );

    return { kind, items: items.filter((x): x is ComparisonItem => x !== null) };
  }

  const units = (await getUnitsByIds(client, ids)) as RawUnitRow[];
  const byId = new Map(units.map((u) => [u.id, u]));

  const items = await Promise.all(
    ids.map(async (id): Promise<ComparisonItem | null> => {
      const u = byId.get(id);
      if (!u) return null;

      // Precio efectivo = MISMA lógica que mapUnitToProperty (unit-to-property.ts):
      // con descuento vigente (is_discount_active + monto + pct válidos) el cliente
      // paga el precio con descuento; la fila "Precio" del modal ya muestra ese valor.
      // Usar el mismo precio para priceBaseMxn/Precio-por-m²/ROI evita que dentro de
      // la misma tabla "Precio" (con descuento) no cuadre con "Precio/m²" y "ROI".
      const listPrice = num(u.price_mxn);
      const discountPrice = num(u.discount_price_mxn);
      const discountPct = num(u.discount_pct);
      const hasDiscount =
        u.is_discount_active === true &&
        discountPrice !== null && discountPrice > 0 &&
        discountPct !== null && discountPct > 0;
      const effectivePrice = hasDiscount ? discountPrice : listPrice;

      return finishItem(getAirdna, {
        id,
        kind,
        name: resolveUnitName(u),
        slug: u.slug ?? null,
        city: u.city ?? null,
        zone: u.zone ?? null,
        priceBaseMxn: effectivePrice,
        pricePerM2: unitPricePerM2(effectivePrice, num(u.area_m2)),
        isLand: isLandType(u.unit_type),
      });
    }),
  );

  return { kind, items: items.filter((x): x is ComparisonItem => x !== null) };
}
