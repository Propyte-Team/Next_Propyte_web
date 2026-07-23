// src/lib/lead-magnet/edition-data.test.ts
import { describe, it, expect } from 'vitest';
import { computeEditionId, median, ltrMediansByCity, fillEstimatedRent } from './edition-data';
import type { LeadMagnetUnitInput } from './score';

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
    estimated_rent_mxn: null, appreciation_annual: null,
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
