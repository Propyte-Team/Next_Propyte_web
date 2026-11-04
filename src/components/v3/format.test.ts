import { describe, expect, it } from 'vitest';
import { compactMoney, placeLabel } from './format';

describe('compactMoney', () => {
  it('millones con dos decimales como máximo', () => {
    expect(compactMoney(4_850_000, 'MXN', 'es')).toBe('$4.85 M');
    expect(compactMoney(12_000_000, 'MXN', 'es')).toBe('$12 M');
  });
  it('miles según idioma y moneda', () => {
    expect(compactMoney(850_000, 'MXN', 'es')).toBe('$850 mil');
    expect(compactMoney(450_000, 'USD', 'en')).toBe('US$450K');
  });
  it('no publica precios que son errores de captura', () => {
    expect(compactMoney(35_000, 'MXN', 'es')).toBeNull();
    expect(compactMoney(null, 'MXN', 'es')).toBeNull();
  });
});

describe('placeLabel', () => {
  it('no repite la ciudad', () => {
    expect(placeLabel('Aldea Zamá, Tulum', 'Tulum')).toBe('Aldea Zamá, Tulum');
    expect(placeLabel('Aldea Zamá', 'Tulum')).toBe('Aldea Zamá, Tulum');
    expect(placeLabel(null, 'Mérida')).toBe('Mérida');
  });
});
