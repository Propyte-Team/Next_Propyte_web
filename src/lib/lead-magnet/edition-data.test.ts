// src/lib/lead-magnet/edition-data.test.ts
import { describe, it, expect } from 'vitest';
import { computeEditionId, median, ltrMediansByCity, fillEstimatedRent, selectTopZones } from './edition-data';
import type { LeadMagnetUnitInput } from './score';
import type { ZoneScore, CityStrBenchmark } from '@/lib/supabase/queries';

describe('computeEditionId', () => {
  it('devuelve YYYY-MM en zona America/Cancun', () => {
    // 2026-08-01T04:30Z = 2026-07-31 23:30 en Cancún (UTC-5) → edición 2026-07
    expect(computeEditionId(new Date('2026-08-01T04:30:00Z'))).toBe('2026-07');
    expect(computeEditionId(new Date('2026-08-01T06:30:00Z'))).toBe('2026-08');
  });
});

describe('median', () => {
  it('impar toma el central, par promedia', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('fillEstimatedRent', () => {
  const base: LeadMagnetUnitInput = {
    id: 'u1', slug: 'u-1', development_id: 'd1', development_name: 'Dev',
    development_slug: 'dev', city: 'Tulum', zone: 'Centro', bedrooms: 2,
    area_m2: 80, price_mxn: 4_000_000, discount_price_mxn: null,
    discount_pct: null, is_discount_active: false, roi_annual: null,
    estimated_rent_mxn: null,
  };
  it('rellena por development_id+bedrooms y respeta el valor nativo', () => {
    const out = fillEstimatedRent(
      [
        base,
        { ...base, id: 'u2', estimated_rent_mxn: 99_000 },
        { ...base, id: 'u3', bedrooms: 3 },
      ],
      [{ development_id: 'd1', bedrooms: 2, estimated_rent_residencial: 22_000 }],
    );
    expect(out.find((u) => u.id === 'u1')!.estimated_rent_mxn).toBe(22_000);
    expect(out.find((u) => u.id === 'u2')!.estimated_rent_mxn).toBe(99_000);
    expect(out.find((u) => u.id === 'u3')!.estimated_rent_mxn).toBeNull();
  });
});

describe('selectTopZones', () => {
  function buildTopZone(overrides: Partial<ZoneScore>): ZoneScore {
    return {
      id: 1, city: 'Akumal', zone: 'Bahía de Akumal', score: 88.1,
      yield_component: null, occupancy_component: null, adr_growth_component: null,
      supply_pressure_component: null, revpar: null, price_to_rent_ratio: null,
      yield_spread: null, supply_demand_ratio: null, active_listings: null,
      median_adr: null, median_occupancy: null, median_rent: null, cluster_label: null,
      occupancy_p50_ttm: null, occupancy_low_season: null, occupancy_high_season: null,
      adr_p50_ttm: null, data_through: null, ttm_months_observed: null,
      index_omission_reason: null, computed_at: '2026-08-01T00:00:00Z',
      ...overrides,
    };
  }
  function buildBenchmark(city: string): CityStrBenchmark {
    return { city, median_occupancy: null, median_adr: null, revpar: null, active_listings: null, computed_at: null };
  }

  it('la edicion publica mediana TTM, no el ultimo punto de la serie', () => {
    const zone = buildTopZone({
      zone: 'Bahía de Akumal',
      city: 'Akumal',
      score: 88.1,
      occupancy_p50_ttm: 47.4,
      adr_p50_ttm: 4969,
    });
    const [zona] = selectTopZones([zone], [buildBenchmark('Akumal')]);
    expect(zona).not.toHaveProperty('median_occupancy');
    expect(zona).not.toHaveProperty('median_adr');
    expect(zona.occupancy_p50_ttm).toBe(47.4);
    expect(zona.adr_p50_ttm).toBe(4969);
  });

  it('excluye ciudades fuera del benchmark STR y slugs crudos', () => {
    const covered = buildTopZone({ city: 'Tulum', zone: 'Centro', score: 90 });
    const uncovered = buildTopZone({ city: 'Merida', zone: 'Centro', score: 95 });
    const rawSlug = buildTopZone({ city: 'Tulum', zone: 'AKUMAL_BAY_AREA', score: 99 });
    const out = selectTopZones([covered, uncovered, rawSlug], [buildBenchmark('Tulum')]);
    expect(out).toEqual([{
      city: 'Tulum', zone: 'Centro', score: 90,
      occupancy_p50_ttm: null, adr_p50_ttm: null, data_through: null,
    }]);
  });
});

describe('ltrMediansByCity', () => {
  it('agrupa por ciudad, exige muestra mínima y ordena por muestra desc', () => {
    const rows = [
      ...Array.from({ length: 25 }, (_, i) => ({ city: 'Cancun', monthly_rent_mxn: 10_000 + i })),
      ...Array.from({ length: 5 }, () => ({ city: 'Tulum', monthly_rent_mxn: 30_000 })),
    ];
    const out = ltrMediansByCity(rows, 20);
    expect(out).toEqual([{ city: 'Cancun', medianRent: 10_012, sample: 25 }]);
  });
});
