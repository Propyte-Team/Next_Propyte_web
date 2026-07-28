import { describe, it, expect } from 'vitest';
import { marketComboKey, marketRentForUnit, isRentableType } from './market-rent';

describe('marketComboKey', () => {
  it('ignora acentos y caso para que dos escrituras compartan comparables', () => {
    const a = marketComboKey({ city: 'Tulum', zone: 'Aldea Zamá', propertyType: 'departamento', bedrooms: 2 });
    const b = marketComboKey({ city: 'tulum', zone: 'aldea zama', propertyType: 'Departamento', bedrooms: 2 });
    expect(a).toBe(b);
  });

  it('distingue por recámaras y por zona', () => {
    const base = { city: 'Tulum', zone: 'Centro', propertyType: 'departamento', bedrooms: 2 };
    expect(marketComboKey(base)).not.toBe(marketComboKey({ ...base, bedrooms: 3 }));
    expect(marketComboKey(base)).not.toBe(marketComboKey({ ...base, zone: 'Región 10' }));
  });

  it('trata null y vacío como el mismo hueco', () => {
    expect(marketComboKey({ city: 'Tulum', zone: null, propertyType: 'casa', bedrooms: null }))
      .toBe(marketComboKey({ city: 'Tulum', zone: '', propertyType: 'casa', bedrooms: null }));
  });
});

describe('marketRentForUnit', () => {
  it('prefiere renta por m² × área — igual que la ficha', () => {
    expect(marketRentForUnit({ avg_rent_per_m2: 300, median_rent_mxn: 25_000 }, 65)).toBe(19_500);
  });

  it('sin área utilizable cae a la mediana del grupo', () => {
    expect(marketRentForUnit({ avg_rent_per_m2: 300, median_rent_mxn: 25_000 }, null)).toBe(25_000);
    expect(marketRentForUnit({ avg_rent_per_m2: 300, median_rent_mxn: 25_000 }, 0)).toBe(25_000);
  });

  it('sin renta por m² usa la mediana', () => {
    expect(marketRentForUnit({ avg_rent_per_m2: null, median_rent_mxn: 25_000 }, 65)).toBe(25_000);
  });

  it('sin estimación devuelve null, no 0', () => {
    expect(marketRentForUnit(null, 65)).toBeNull();
    expect(marketRentForUnit({ avg_rent_per_m2: null, median_rent_mxn: 0 }, 65)).toBeNull();
  });
});

describe('isRentableType', () => {
  it('vivienda sí', () => {
    for (const t of ['departamento', 'penthouse', 'casa', 'Departamento']) {
      expect(isRentableType(t), t).toBe(true);
    }
  });

  it('terreno y macrolote NO: no rentan como vivienda y el fallback les asigna renta de departamento', () => {
    for (const t of ['terreno', 'macrolote', 'Terreno', null, undefined, '']) {
      expect(isRentableType(t), String(t)).toBe(false);
    }
  });
});
