// src/lib/lead-magnet/score.ts
// Ranking score-compuesto para el lead magnet "Top 10 Oportunidades".
// Lib pura: recibe filas YA coercionadas a number (ver edition-data.ts).
// Spec: docs/superpowers/specs/2026-07-23-lead-magnet-top10-design.md §2

export interface LeadMagnetUnitInput {
  id: string;
  slug: string;
  development_id: string | null;
  development_name: string | null;
  development_slug: string | null;
  city: string | null;
  zone: string | null;
  bedrooms: number | null;
  area_m2: number | null;
  price_mxn: number | null;
  discount_price_mxn: number | null;
  discount_pct: number | null;
  is_discount_active: boolean | null;
  roi_annual: number | null;
  estimated_rent_mxn: number | null;
  appreciation_annual: number | null;
}

export interface ZoneScoreInput {
  city: string;
  zone: string;
  score: number | null;
}

export interface ScoredUnit extends LeadMagnetUnitInput {
  effectivePrice: number;
  grossYieldPct: number;
  roiPct: number;
  discountPct: number;
  yieldComponent: number;
  roiComponent: number;
  discountComponent: number;
  zoneComponent: number;
  score: number;
}

export const SCORE_WEIGHTS = { yield: 0.35, roi: 0.3, discount: 0.2, zone: 0.15 } as const;
export const DEFAULT_APPRECIATION_PCT = 8;
const NEUTRAL_ZONE = 50;

/** Clave de matching city|zone tolerante a acentos/caso. */
export function normalizeKey(city: string | null | undefined, zone: string | null | undefined): string {
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return `${norm(city ?? '')}|${norm(zone ?? '')}`;
}

export function computeComponents(u: LeadMagnetUnitInput): {
  effectivePrice: number; grossYieldPct: number; roiPct: number; discountPct: number;
} {
  const effectivePrice =
    u.is_discount_active && u.discount_price_mxn != null && u.discount_price_mxn > 0
      ? u.discount_price_mxn
      : (u.price_mxn ?? 0);
  const rent = u.estimated_rent_mxn ?? 0;
  const grossYieldPct = effectivePrice > 0 ? (rent * 12 / effectivePrice) * 100 : 0;
  const roiPct = u.roi_annual ?? grossYieldPct + (u.appreciation_annual ?? DEFAULT_APPRECIATION_PCT);
  const discountPct = u.is_discount_active ? (u.discount_pct ?? 0) : 0;
  return { effectivePrice, grossYieldPct, roiPct, discountPct };
}

/** min-max → 0-100; pool constante o vacío → 50. */
function normalizePool(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!values.length || max === min) return values.map(() => 50);
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

export interface SelectOptions {
  count?: number;
  maxPerDevelopment?: number;
  minCities?: number;
}

export function selectTopUnits(
  units: LeadMagnetUnitInput[],
  zoneScores: ZoneScoreInput[],
  opts: SelectOptions = {},
): ScoredUnit[] {
  const count = opts.count ?? 10;
  const maxPerDev = opts.maxPerDevelopment ?? 2;
  const minCities = opts.minCities ?? 3;

  const zoneByKey = new Map<string, number>();
  for (const z of zoneScores) {
    if (z.score != null) zoneByKey.set(normalizeKey(z.city, z.zone), z.score);
  }

  // 1. Elegibilidad + componentes crudos
  const eligible = units
    .map((u) => ({ u, c: computeComponents(u) }))
    .filter(({ c, u }) => c.effectivePrice > 0 && (u.estimated_rent_mxn ?? 0) > 0);
  if (!eligible.length) return [];

  // 2. Normalización min-max por componente sobre el pool
  const yieldN = normalizePool(eligible.map(({ c }) => c.grossYieldPct));
  const roiN = normalizePool(eligible.map(({ c }) => c.roiPct));
  const discN = normalizePool(eligible.map(({ c }) => c.discountPct));
  const zoneRaw = eligible.map(({ u }) => zoneByKey.get(normalizeKey(u.city, u.zone)) ?? NEUTRAL_ZONE);
  const zoneN = normalizePool(zoneRaw);

  const scored: ScoredUnit[] = eligible.map(({ u, c }, i) => ({
    ...u,
    ...c,
    yieldComponent: Math.round(yieldN[i] * 10) / 10,
    roiComponent: Math.round(roiN[i] * 10) / 10,
    discountComponent: Math.round(discN[i] * 10) / 10,
    zoneComponent: Math.round(zoneN[i] * 10) / 10,
    score: Math.round(
      (yieldN[i] * SCORE_WEIGHTS.yield +
        roiN[i] * SCORE_WEIGHTS.roi +
        discN[i] * SCORE_WEIGHTS.discount +
        zoneN[i] * SCORE_WEIGHTS.zone) * 10,
    ) / 10,
  }));
  scored.sort((a, b) => b.score - a.score);

  // 3. Selección con diversidad
  const picked: ScoredUnit[] = [];
  const perDev = new Map<string, number>();
  const canPick = (u: ScoredUnit) => {
    const dev = u.development_id ?? u.id;
    return (perDev.get(dev) ?? 0) < maxPerDev && !picked.some((p) => p.id === u.id);
  };
  const take = (u: ScoredUnit) => {
    const dev = u.development_id ?? u.id;
    perDev.set(dev, (perDev.get(dev) ?? 0) + 1);
    picked.push(u);
  };

  // Pasada 1: mejor unidad de cada una de las top-minCities ciudades (si existen)
  const byCity = new Map<string, ScoredUnit[]>();
  for (const s of scored) {
    const city = s.city ?? '_sin_ciudad';
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(s); // scored ya viene desc → [0] es la mejor
  }
  const topCities = [...byCity.entries()]
    .sort((a, b) => b[1][0].score - a[1][0].score)
    .slice(0, minCities);
  for (const [, cityUnits] of topCities) {
    const best = cityUnits.find(canPick);
    if (best) take(best);
  }

  // Pasada 2: llenar por score global
  for (const s of scored) {
    if (picked.length >= count) break;
    if (canPick(s)) take(s);
  }

  picked.sort((a, b) => b.score - a.score);
  return picked.slice(0, count);
}
