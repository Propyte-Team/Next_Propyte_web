// src/lib/lead-magnet/edition-data.test.ts
import { describe, it, expect } from 'vitest';
import { computeEditionId, median, ltrMediansByCity } from './edition-data';

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
