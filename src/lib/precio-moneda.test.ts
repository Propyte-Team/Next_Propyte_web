import { describe, expect, it } from 'vitest';
import {
  carasDelPrecio,
  montoCotizado,
  normalizaMoneda,
  precioDesarrollo,
} from './precio-moneda';

// TC de referencia del incidente (Banxico, 19-ago-2026): 16.96 MXN/USD.
const TC = 16.96;

describe('carasDelPrecio', () => {
  it('un precio en pesos se muestra en pesos y la referencia es en dólares', () => {
    const c = carasDelPrecio(2_459_200, 'MXN', TC);
    expect(c.original).toBe(2_459_200);
    expect(c.originalMoneda).toBe('MXN');
    expect(c.referencialMoneda).toBe('USD');
    expect(c.referencial).toBe(145_000);
  });

  it('un precio en dólares se muestra en dólares y la referencia es en pesos', () => {
    // El bug exacto: 145,000 USD salía como "$145,000 MXN · $8,550 USD".
    // Ahora sale "$145,000 USD · $2,459,200 MXN".
    const c = carasDelPrecio(145_000, 'USD', TC);
    expect(c.original).toBe(145_000);
    expect(c.originalMoneda).toBe('USD');
    expect(c.referencialMoneda).toBe('MXN');
    expect(c.referencial).toBe(2_459_200);
    // Lo que producía la fórmula vieja al marcar USD: 145000/16.96 = 8550.
    expect(c.referencial).not.toBe(8_550);
  });

  it('el monto cotizado NUNCA se toca, sólo la referencia lleva el TC', () => {
    for (const rate of [16.96, 20, 25.5]) {
      expect(carasDelPrecio(145_000, 'USD', rate).original).toBe(145_000);
      expect(carasDelPrecio(2_400_000, 'MXN', rate).original).toBe(2_400_000);
    }
  });

  it('ida y vuelta: convertir y volver cae dentro del redondeo', () => {
    const usd = 145_000;
    const enPesos = carasDelPrecio(usd, 'USD', TC).referencial;
    const deVuelta = carasDelPrecio(enPesos, 'MXN', TC).referencial;
    expect(Math.abs(deVuelta - usd)).toBeLessThanOrEqual(1);
  });
});

describe('montoCotizado', () => {
  it('lee usd cuando la moneda es USD', () => {
    expect(montoCotizado({ mxn: 0, usd: 145_000, currency: 'USD' })).toBe(145_000);
  });

  it('lee mxn cuando la moneda es MXN', () => {
    expect(montoCotizado({ mxn: 2_400_000, currency: 'MXN' })).toBe(2_400_000);
  });

  it('el 0 de price.mxn en una unidad en USD es ausencia, no precio', () => {
    // precio_mxn está NULL en una unidad cotizada en dólares: el mapper deja 0.
    // Leerlo como precio mostraba "$0" o "—" con el precio ahí al lado.
    expect(montoCotizado({ mxn: 0, currency: 'USD' })).toBeNull();
    expect(montoCotizado({ mxn: 0, currency: 'MXN' })).toBeNull();
  });
});

describe('precioDesarrollo (lado web, alias de v_developments)', () => {
  it('lee el par de la moneda declarada', () => {
    expect(
      precioDesarrollo({ currency: 'USD', price_min_usd: 145_000, price_max_usd: 217_700 }),
    ).toEqual({ moneda: 'USD', min: 145_000, max: 217_700, desalineado: false });
  });

  it('NO lee la columna de pesos cuando la moneda es USD', () => {
    expect(
      precioDesarrollo({ currency: 'USD', price_min_mxn: 145_000 }),
    ).toEqual({ moneda: 'USD', min: null, max: null, desalineado: true });
  });

  it('convierte los NUMERIC que la vista entrega como string', () => {
    expect(precioDesarrollo({ currency: 'USD', price_min_usd: '145000' }).min).toBe(145_000);
  });

  it('normaliza la moneda y cae a MXN ante lo desconocido', () => {
    expect(normalizaMoneda('usd')).toBe('USD');
    expect(normalizaMoneda('EUR')).toBe('MXN');
    expect(normalizaMoneda(null)).toBe('MXN');
  });
});
