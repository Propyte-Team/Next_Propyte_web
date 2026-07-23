// src/lib/lead-magnet/score.test.ts
import { describe, it, expect } from 'vitest';
import {
  selectTopUnits, computeComponents, normalizeKey,
  SCORE_WEIGHTS, type LeadMagnetUnitInput,
} from './score';

function unit(over: Partial<LeadMagnetUnitInput> = {}): LeadMagnetUnitInput {
  return {
    id: over.id ?? 'u1', slug: over.slug ?? 'unidad-1',
    development_id: 'd1', development_name: 'Dev Uno', development_slug: 'dev-uno',
    city: 'Tulum', zone: 'Aldea Zama', bedrooms: 2, area_m2: 80,
    price_mxn: 4_000_000, discount_price_mxn: null, discount_pct: null,
    is_discount_active: false, roi_annual: 12, estimated_rent_mxn: 25_000,
    appreciation_annual: 8,
    ...over,
  };
}

describe('computeComponents', () => {
  it('usa discount_price_mxn como precio efectivo cuando el descuento está activo', () => {
    const c = computeComponents(unit({ is_discount_active: true, discount_price_mxn: 3_600_000 }));
    expect(c.effectivePrice).toBe(3_600_000);
    expect(c.grossYieldPct).toBeCloseTo((25_000 * 12 / 3_600_000) * 100, 5);
  });
  it('roi cae a yield + appreciation (default 8) cuando roi_annual es null', () => {
    const c = computeComponents(unit({ roi_annual: null, appreciation_annual: null }));
    expect(c.roiPct).toBeCloseTo(c.grossYieldPct + 8, 5);
  });
  it('descuento inactivo aporta 0 aunque discount_pct tenga valor', () => {
    const c = computeComponents(unit({ is_discount_active: false, discount_pct: 15 }));
    expect(c.discountPct).toBe(0);
  });
});

describe('normalizeKey', () => {
  it('quita acentos, lowercasea y trimea', () => {
    expect(normalizeKey('Cancún', ' Puerto Cancún ')).toBe('cancun|puerto cancun');
  });
});

describe('selectTopUnits', () => {
  it('excluye unidades sin precio o sin renta estimada', () => {
    const picked = selectTopUnits(
      [unit({ id: 'a', price_mxn: null }), unit({ id: 'b', estimated_rent_mxn: null }), unit({ id: 'c' })],
      [],
    );
    expect(picked.map((u) => u.id)).toEqual(['c']);
  });
  it('respeta máx 2 unidades por desarrollo', () => {
    const pool = Array.from({ length: 6 }, (_, i) =>
      unit({ id: `u${i}`, slug: `u${i}`, roi_annual: 20 - i }));
    // mismo development_id 'd1' en todas → solo 2 pueden entrar
    const picked = selectTopUnits(pool, []);
    expect(picked.length).toBe(2);
  });
  it('garantiza ≥3 ciudades cuando el pool las tiene', () => {
    const pool = [
      ...Array.from({ length: 8 }, (_, i) =>
        unit({ id: `t${i}`, development_id: `dt${i}`, city: 'Tulum', roi_annual: 30 - i })),
      unit({ id: 'c1', development_id: 'dc1', city: 'Cancún', roi_annual: 5 }),
      unit({ id: 'p1', development_id: 'dp1', city: 'Playa del Carmen', roi_annual: 4 }),
    ];
    const picked = selectTopUnits(pool, []);
    const cities = new Set(picked.map((u) => u.city));
    expect(cities.size).toBeGreaterThanOrEqual(3);
    expect(picked.length).toBe(10);
  });
  it('sin match de zona el componente zone es 50 neutral', () => {
    const picked = selectTopUnits([unit({ zone: 'Zona Inexistente' })], []);
    expect(picked[0].zoneComponent).toBe(50);
  });
  it('usa el score de zone_scores cuando matchea (con acentos distintos)', () => {
    const picked = selectTopUnits(
      [unit({ city: 'Cancún', zone: 'Puerto Cancun' }), unit({ id: 'u2', development_id: 'd2', city: 'Cancún', zone: 'Otra' })],
      [{ city: 'Cancun', zone: 'Puerto Cancún', score: 90 }],
    );
    const conZona = picked.find((u) => u.id === 'u1')!;
    const sinZona = picked.find((u) => u.id === 'u2')!;
    // min-max sobre el pool {90 (match), 50 (neutral)} → 100 vs 0
    expect(conZona.zoneComponent).toBe(100);
    expect(sinZona.zoneComponent).toBe(0);
  });
  it('los pesos suman 1', () => {
    const sum = SCORE_WEIGHTS.yield + SCORE_WEIGHTS.roi + SCORE_WEIGHTS.discount + SCORE_WEIGHTS.zone;
    expect(sum).toBeCloseTo(1, 10);
  });
  it('ordena por score desc y devuelve máx `count`', () => {
    const pool = Array.from({ length: 15 }, (_, i) =>
      unit({ id: `u${i}`, development_id: `d${i}`, city: `Ciudad${i % 4}`, roi_annual: 30 - i }));
    const picked = selectTopUnits(pool, []);
    expect(picked.length).toBe(10);
    const scores = picked.map((u) => u.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});
