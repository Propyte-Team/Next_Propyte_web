import { describe, it, expect } from 'vitest';
import { resolveUnitInvestment, type UnitInvestmentFields } from './resolve';
import { residentialGrossYieldFromTotal, calculateTotalInvestment, GROSS_YIELD_BOUNDS } from '@/lib/calculator';

const unit = (over: Partial<UnitInvestmentFields> = {}): UnitInvestmentFields => ({
  roi_annual: null,
  estimated_rent_mxn: null,
  price_mxn: 4_000_000,
  discount_price_mxn: null,
  is_discount_active: false,
  state: 'Quintana Roo',
  ...over,
});

const fin = (rent: number | string | null) => ({ estimated_rent_residencial: rent });

describe('resolveUnitInvestment — renta', () => {
  it('precedencia manual > mercado > ML por recámaras > modelo de desarrollo', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 30_000 }), fin(20_000), 25_000, 28_000).rentMonthly).toBe(30_000);
    expect(resolveUnitInvestment(unit(), fin(20_000), 25_000, 28_000).rentMonthly).toBe(28_000);
    expect(resolveUnitInvestment(unit(), fin(20_000), 25_000, null).rentMonthly).toBe(25_000);
    expect(resolveUnitInvestment(unit(), fin(20_000), null, null).rentMonthly).toBe(20_000);
  });

  it('marca el origen', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 1 }), null, null, null).rentSource).toBe('manual');
    expect(resolveUnitInvestment(unit(), null, null, 28_000).rentSource).toBe('market');
    expect(resolveUnitInvestment(unit(), null, 25_000, null).rentSource).toBe('ml');
    expect(resolveUnitInvestment(unit(), fin(20_000), null, null).rentSource).toBe('model');
    expect(resolveUnitInvestment(unit(), null, null, null).rentSource).toBe('none');
  });

  it('coerciona los NUMERIC que Postgres entrega como string', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: '18000.00' }), null, null, null).rentMonthly).toBe(18000);
  });

  it('0, negativos, NaN y strings no numéricos son ausencia', () => {
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 0 }), fin(20_000), null, null).rentMonthly).toBe(20_000);
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: -5 }), null, null, null).rentMonthly).toBeNull();
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: NaN }), null, null, null).rentMonthly).toBeNull();
    expect(resolveUnitInvestment(unit({ estimated_rent_mxn: 'N/D' }), null, null, null).rentMonthly).toBeNull();
  });
});

describe('resolveUnitInvestment — número del badge', () => {
  it('sin renta ni ROI capturado no hay número', () => {
    const r = resolveUnitInvestment(unit(), null, null, null);
    expect(r.displayPct).toBeNull();
    expect(r.displayKind).toBeNull();
  });

  it('usa la MISMA fórmula que el tab Rentabilidad, no renta ÷ precio', () => {
    // El tab calcula renta efectiva tras ocupación ÷ inversión total
    // (precio + gastos de cierre). El badge tiene que dar idéntico.
    const r = resolveUnitInvestment(unit({ price_mxn: 4_000_000 }), null, null, 20_000);
    const esperado = residentialGrossYieldFromTotal(
      20_000, calculateTotalInvestment(4_000_000, 'Quintana Roo'),
    );
    expect(r.displayPct).toBe(esperado);
    expect(r.displayKind).toBe('yield');
    // Y NO es el ingenuo renta×12÷precio (6% con estos números).
    expect(r.displayPct).not.toBeCloseTo(6, 1);
  });

  it('el ROI capturado en el Hub gana y se rotula como ROI', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 11 }), null, null, 20_000);
    expect(r.displayPct).toBe(11);
    expect(r.displayKind).toBe('roi');
  });

  it('el yield usa el precio con descuento vigente', () => {
    const conDescuento = resolveUnitInvestment(
      unit({ price_mxn: 4_000_000, discount_price_mxn: 3_200_000, is_discount_active: true }),
      null, null, 20_000,
    );
    const sinDescuento = resolveUnitInvestment(unit({ price_mxn: 4_000_000 }), null, null, 20_000);
    expect(conDescuento.displayPct!).toBeGreaterThan(sinDescuento.displayPct!);
  });

  it('descuento inactivo no afecta el precio base', () => {
    const a = resolveUnitInvestment(
      unit({ price_mxn: 4_000_000, discount_price_mxn: 3_200_000, is_discount_active: false }),
      null, null, 20_000,
    );
    const b = resolveUnitInvestment(unit({ price_mxn: 4_000_000 }), null, null, 20_000);
    expect(a.displayPct).toBe(b.displayPct);
  });

  it('sin precio no hay yield aunque haya renta', () => {
    const r = resolveUnitInvestment(unit({ price_mxn: null }), null, null, 20_000);
    expect(r.rentMonthly).toBe(20_000);
    expect(r.displayPct).toBeNull();
  });

  it('el ROI constante del modelo no entra: la slice solo expone renta', () => {
    const r = resolveUnitInvestment(unit(), fin(20_000), null, null);
    expect(r.displayKind).toBe('yield');
  });
});

describe('banda de plausibilidad del yield', () => {
  it('no publica un yield absurdamente alto (lote con renta de departamento)', () => {
    // Lote de $300k con renta de departamento de $25k/mes → ~95% bruto.
    const r = resolveUnitInvestment(unit({ price_mxn: 300_000 }), null, null, 25_000);
    expect(r.displayPct).toBeNull();
    expect(r.displayKind).toBeNull();
  });

  it('no publica un yield absurdamente bajo (precio roto en la BD)', () => {
    // Sanam Residential: $462,612,000 por un 2 recámaras → 0.1%.
    const r = resolveUnitInvestment(unit({ price_mxn: 462_612_000 }), null, null, 25_000);
    expect(r.displayPct).toBeNull();
  });

  it('un yield normal sí pasa', () => {
    const r = resolveUnitInvestment(unit({ price_mxn: 4_000_000 }), null, null, 20_000);
    expect(r.displayPct).not.toBeNull();
    expect(r.displayPct!).toBeGreaterThan(GROSS_YIELD_BOUNDS.MIN);
    expect(r.displayPct!).toBeLessThan(GROSS_YIELD_BOUNDS.MAX);
  });

  it('la banda no toca el ROI capturado en el Hub — ese es dato humano', () => {
    const r = resolveUnitInvestment(unit({ roi_annual: 45, price_mxn: 4_000_000 }), null, null, null);
    expect(r.displayPct).toBe(45);
    expect(r.displayKind).toBe('roi');
  });
});
