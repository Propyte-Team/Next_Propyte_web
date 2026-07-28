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

  it('coerciona los NUMERIC que Postgres entrega como string', () => {
    // v_units tipa roi_annual como number|string|null: si el resolver los
    // rechazara, el nivel manual del Hub nunca funcionaría al capturarse.
    const r = resolveUnitInvestment(
      { roi_annual: '9.5', estimated_rent_mxn: '18000.00' },
      { roi_annual_pct: '7.4', estimated_rent_residencial: null },
      null,
    );
    expect(r.roiPct).toBe(9.5);
    expect(r.roiSource).toBe('manual');
    expect(r.rentMonthly).toBe(18000);
  });

  it('un string no numérico es ausencia, no NaN', () => {
    const r = resolveUnitInvestment({ roi_annual: 'N/D', estimated_rent_mxn: '' }, null, null);
    expect(r.roiPct).toBeNull();
    expect(r.rentMonthly).toBeNull();
  });
});
