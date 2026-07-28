import { describe, it, expect } from 'vitest';
import { resolveUnitInvestment, type UnitInvestmentFields } from './resolve';

const unit = (over: Partial<UnitInvestmentFields> = {}): UnitInvestmentFields => ({
  roi_annual: null,
  estimated_rent_mxn: null,
  price_mxn: 4_000_000,
  discount_price_mxn: null,
  is_discount_active: false,
  ...over,
});

const fin = (rent: number | string | null) => ({ estimated_rent_residencial: rent });

describe('resolveUnitInvestment — renta', () => {
  it('precedencia manual > ML por recámaras > modelo de desarrollo', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 30_000 }), fin(20_000), 25_000).rentMonthly).toBe(30_000);
    expect(resolveUnitInvestment(unit(), fin(20_000), 25_000).rentMonthly).toBe(25_000);
    expect(resolveUnitInvestment(unit(), fin(20_000), null).rentMonthly).toBe(20_000);
  });

  it('marca el origen', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 1 }), null, null).rentSource).toBe('manual');
    expect(resolveUnitInvestment(unit(), null, 25_000).rentSource).toBe('ml');
    expect(resolveUnitInvestment(unit(), fin(20_000), null).rentSource).toBe('model');
    expect(resolveUnitInvestment(unit(), null, null).rentSource).toBe('none');
  });

  it('coerciona los NUMERIC que Postgres entrega como string', () => {
    const r = resolveUnitInvestment(unit({ estimated_rent_mxn: '18000.00' }), null, null);
    expect(r.rentMonthly).toBe(18000);
  });

  it('0, negativos, NaN y strings no numéricos son ausencia', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 0 }), fin(20_000), null).rentMonthly).toBe(20_000);
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: -5 }), null, null).rentMonthly).toBeNull();
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: NaN }), null, null).rentMonthly).toBeNull();
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 'N/D' }), null, null).rentMonthly).toBeNull();
  });
});

describe('resolveUnitInvestment — número del badge', () => {
  it('sin renta ni ROI capturado no hay número', () => {
    const r = resolveUnitInvestment(unit(), null, null);
    expect(r.displayPct).toBeNull();
    expect(r.displayKind).toBeNull();
  });

  it('sin ROI capturado, el badge es el yield bruto de la renta resuelta', () => {
    const r = resolveUnitInvestment(unit({ price_mxn: 4_000_000 }), null, 20_000);
    expect(r.displayPct).toBeCloseTo((20_000 * 12 / 4_000_000) * 100, 6); // 6%
    expect(r.displayKind).toBe('yield');
  });

  it('el ROI capturado en el Hub gana y se rotula como ROI', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 11 }), null, 20_000);
    expect(r.displayPct).toBe(11);
    expect(r.displayKind).toBe('roi');
  });

  it('el yield usa el precio con descuento vigente', () => {
    const r = resolveUnitInvestment(
      unit({ price_mxn: 4_000_000, discount_price_mxn: 3_200_000, is_discount_active: true }),
      null,
      20_000,
    );
    expect(r.displayPct).toBeCloseTo((20_000 * 12 / 3_200_000) * 100, 6); // 7.5%
  });

  it('descuento inactivo no afecta el precio base', () => {
    const r = resolveUnitInvestment(
      unit({ price_mxn: 4_000_000, discount_price_mxn: 3_200_000, is_discount_active: false }),
      null,
      20_000,
    );
    expect(r.displayPct).toBeCloseTo(6, 6);
  });

  it('sin precio no hay yield aunque haya renta', () => {
    const r = resolveUnitInvestment(unit({ price_mxn: null }), null, 20_000);
    expect(r.rentMonthly).toBe(20_000);
    expect(r.displayPct).toBeNull();
  });

  it('el ROI constante del modelo no entra: la slice solo expone renta', () => {
    // development_financials.roi_annual_pct tiene 2 valores en 197 filas.
    // El tipo de DevFinancialsSlice impide pasarlo, y esto lo documenta.
    const r = resolveUnitInvestment(unit(), fin(20_000), null);
    expect(r.displayKind).toBe('yield');
  });
});
