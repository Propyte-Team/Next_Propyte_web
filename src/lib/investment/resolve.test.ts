import { describe, it, expect } from 'vitest';
import { resolveUnitInvestment } from './resolve';

const unit = (over: Partial<{ roi_annual: number | null; estimated_rent_mxn: number | null }> = {}) => ({
  roi_annual: null,
  estimated_rent_mxn: null,
  ...over,
});

const fin = (over: Partial<{ roi_annual_pct: number | null; estimated_rent_residencial: number | null }> = {}) => ({
  roi_annual_pct: null,
  estimated_rent_residencial: null,
  ...over,
});

describe('resolveUnitInvestment', () => {
  it('el manual del Hub gana sobre el modelo', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 11 }), fin({ roi_annual_pct: 7 }), null);
    expect(r.roiPct).toBe(11);
    expect(r.roiSource).toBe('manual');
  });

  it('sin manual usa el modelo de desarrollo', () => {
    const r = resolveUnitInvestment(unit(), fin({ roi_annual_pct: 7.4 }), null);
    expect(r.roiPct).toBe(7.4);
    expect(r.roiSource).toBe('model');
  });

  it('sin ninguna fuente devuelve null, NUNCA 0', () => {
    const r = resolveUnitInvestment(unit(), null, null);
    expect(r.roiPct).toBeNull();
    expect(r.rentMonthly).toBeNull();
    expect(r.roiSource).toBe('none');
    expect(r.rentSource).toBe('none');
  });

  it('renta: manual > ML por recámaras > modelo de desarrollo', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 30_000 }), fin({ estimated_rent_residencial: 20_000 }), 25_000).rentMonthly).toBe(30_000);
    expect(resolveUnitInvestment(unit(), fin({ estimated_rent_residencial: 20_000 }), 25_000).rentMonthly).toBe(25_000);
    expect(resolveUnitInvestment(unit(), fin({ estimated_rent_residencial: 20_000 }), null).rentMonthly).toBe(20_000);
  });

  it('marca el origen de la renta', () => {
    expect(resolveUnitInvestment(unit(), null, 25_000).rentSource).toBe('ml');
    expect(resolveUnitInvestment(unit(), fin({ estimated_rent_residencial: 20_000 }), null).rentSource).toBe('model');
  });

  it('0, negativos y no-finitos cuentan como ausentes', () => {
    expect(resolveUnitInvestment(unit({ roi_annual: 0 }), fin({ roi_annual_pct: 7 }), null).roiPct).toBe(7);
    expect(resolveUnitInvestment(unit({ roi_annual: -3 }), fin({ roi_annual_pct: 7 }), null).roiPct).toBe(7);
    expect(resolveUnitInvestment(unit({ roi_annual: NaN }), fin({ roi_annual_pct: 7 }), null).roiPct).toBe(7);
    expect(resolveUnitInvestment(unit(), fin({ roi_annual_pct: 0 }), null).roiPct).toBeNull();
  });

  it('tolera financials null y campos ausentes', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 9 }), null, null);
    expect(r.roiPct).toBe(9);
    expect(r.rentMonthly).toBeNull();
  });

  it('descarta strings: los NUMERIC sin coercionar no deben pasar como dato', () => {
    // Supabase devuelve NUMERIC como string. Si llega sin coercionar es un bug
    // del llamador, y el resolver debe negarse en vez de propagar '7.4'.
    const r = resolveUnitInvestment(
      unit(),
      { roi_annual_pct: '7.4' as unknown as number, estimated_rent_residencial: null },
      null,
    );
    expect(r.roiPct).toBeNull();
  });
});
