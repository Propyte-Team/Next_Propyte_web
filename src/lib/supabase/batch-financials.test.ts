import { describe, it, expect } from 'vitest';
import { coerceBatchFinancialsRow } from './queries';

describe('coerceBatchFinancialsRow', () => {
  it('convierte los NUMERIC string de Supabase a number', () => {
    const out = coerceBatchFinancialsRow({
      development_id: 'abc',
      cap_rate: '5.20',
      estimated_rent_residencial: '18000.00',
      roi_annual_pct: '7.40',
    });
    expect(out.roi_annual_pct).toBe(7.4);
    expect(out.estimated_rent_residencial).toBe(18000);
    expect(out.cap_rate).toBe(5.2);
    expect(out.development_id).toBe('abc');
  });

  it('deja null como null y no inventa 0', () => {
    const out = coerceBatchFinancialsRow({
      development_id: 'abc',
      cap_rate: null,
      estimated_rent_residencial: null,
      roi_annual_pct: null,
    });
    expect(out.roi_annual_pct).toBeNull();
  });
});
