// src/lib/lead-magnet/edition-data.ts
// Ensambla los datos de una edición del lead magnet (server-only, cron).
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getUnitsForLeadMagnet, getCityStrBenchmarks, getZoneScores,
  getActiveRentalComparables, coerceNumericFields,
  type CityStrBenchmark, type ZoneScore,
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

export async function buildEditionData(client: Client, now = new Date()): Promise<EditionData> {
  const [unitsRes, benchmarks, zoneScores, ltrRows] = await Promise.all([
    getUnitsForLeadMagnet(client),
    getCityStrBenchmarks(client),
    getZoneScores(client),
    getActiveRentalComparables(client),
  ]);

  const rawUnits = (unitsRes.data ?? []) as Record<string, unknown>[];
  const units = rawUnits.map(
    (r) => coerceNumericFields(r, UNIT_NUMERIC_KEYS) as unknown as LeadMagnetUnitInput,
  );

  const topUnits = selectTopUnits(
    units,
    zoneScores.map((z) => ({ city: z.city, zone: z.zone, score: z.score })),
  );

  const topZones = zoneScores
    .filter((z) => z.score != null)
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
