// src/lib/lead-magnet/edition-data.ts
// Ensambla los datos de una edición del lead magnet (server-only, cron).
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getUnitsForLeadMagnet, getCityStrBenchmarks, getZoneScores,
  getActiveRentalComparables, getRentalMlEstimates, coerceNumericFields,
  type CityStrBenchmark, type ZoneScore, type RentalMlEstimateRow,
} from '@/lib/supabase/queries';
import { selectTopUnits, type LeadMagnetUnitInput, type ScoredUnit } from './score';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

const UNIT_NUMERIC_KEYS = [
  'price_mxn', 'discount_price_mxn', 'discount_pct', 'roi_annual',
  'estimated_rent_mxn', 'appreciation_annual', 'bedrooms', 'area_m2',
] as const;

export interface LtrCityMedian { city: string; medianRent: number; sample: number }

export interface EditionData {
  edition: string;              // 'YYYY-MM'
  generatedAt: string;          // ISO
  topUnits: ScoredUnit[];
  cityBenchmarks: CityStrBenchmark[];
  ltrByCity: LtrCityMedian[];
  topZones: Pick<ZoneScore, 'city' | 'zone' | 'score' | 'median_occupancy' | 'median_adr'>[];
}

/** 'YYYY-MM' con corte en America/Cancun (regla de reportes Propyte). */
export function computeEditionId(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Cancun', year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function ltrMediansByCity(
  rows: Array<{ city: string | null; monthly_rent_mxn: number | null }>,
  minSample: number,
): LtrCityMedian[] {
  const byCity = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.city || r.monthly_rent_mxn == null) continue;
    if (!byCity.has(r.city)) byCity.set(r.city, []);
    byCity.get(r.city)!.push(Number(r.monthly_rent_mxn));
  }
  return [...byCity.entries()]
    .filter(([, rents]) => rents.length >= minSample)
    .map(([city, rents]) => ({ city, medianRent: Math.round(median(rents)), sample: rents.length }))
    .sort((a, b) => b.sample - a.sample);
}

/** Rellena estimated_rent_mxn faltante con la renta residencial del modelo ML
 *  (match exacto development_id + bedrooms). El valor nativo de v_units gana
 *  cuando existe. Decisión Luis 2026-07-23: sin este cruce el pool elegible
 *  era 1/54 unidades. */
export function fillEstimatedRent(
  units: LeadMagnetUnitInput[],
  ml: RentalMlEstimateRow[],
): LeadMagnetUnitInput[] {
  const byKey = new Map<string, number>();
  for (const m of ml) {
    if (m.estimated_rent_residencial != null && m.estimated_rent_residencial > 0 && m.bedrooms != null) {
      byKey.set(`${m.development_id}|${m.bedrooms}`, m.estimated_rent_residencial);
    }
  }
  return units.map((u) => {
    if (u.estimated_rent_mxn != null && u.estimated_rent_mxn > 0) return u;
    const filled = u.development_id != null && u.bedrooms != null
      ? byKey.get(`${u.development_id}|${u.bedrooms}`)
      : undefined;
    return filled != null ? { ...u, estimated_rent_mxn: filled } : u;
  });
}

export async function buildEditionData(client: Client, now = new Date()): Promise<EditionData> {
  const [unitsRes, benchmarks, zoneScores, ltrRows, mlRents] = await Promise.all([
    getUnitsForLeadMagnet(client),
    getCityStrBenchmarks(client),
    getZoneScores(client),
    getActiveRentalComparables(client),
    getRentalMlEstimates(client),
  ]);

  const rawUnits = (unitsRes.data ?? []) as Record<string, unknown>[];
  const units = fillEstimatedRent(
    rawUnits.map(
      (r) => coerceNumericFields(r, UNIT_NUMERIC_KEYS) as unknown as LeadMagnetUnitInput,
    ),
    mlRents,
  );

  const topUnits = selectTopUnits(
    units,
    zoneScores.map((z) => ({ city: z.city, zone: z.zone, score: z.score })),
  );

  // Solo zonas de las ciudades que el reporte cubre (las del benchmark STR —
  // "Caribe Mexicano"; sin esto se cuelan CDMX/Mérida) y sin slugs crudos
  // tipo AKUMAL_BAY_AREA (mayúsculas+guiones bajos = slug de BD, no nombre).
  const reportCities = new Set(benchmarks.map((b) => b.city.toLowerCase()));
  const isRawSlug = (zone: string) => /^[A-Z0-9_]+$/.test(zone) || zone.includes('_');
  const topZones = zoneScores
    .filter((z) => z.score != null)
    .filter((z) => reportCities.has((z.city ?? '').toLowerCase()))
    .filter((z) => !isRawSlug(z.zone ?? ''))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)
    .map(({ city, zone, score, median_occupancy, median_adr }) =>
      ({ city, zone, score, median_occupancy, median_adr }));

  return {
    edition: computeEditionId(now),
    generatedAt: now.toISOString(),
    topUnits,
    cityBenchmarks: benchmarks,
    ltrByCity: ltrMediansByCity(ltrRows, 20),
    topZones,
  };
}
