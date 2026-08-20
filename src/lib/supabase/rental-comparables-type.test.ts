import { describe, it, expect } from 'vitest';
import { normalizeTypeForRentalComparables } from './queries';

describe('normalizeTypeForRentalComparables', () => {
  it('villa busca entre los comparables de casa: rental_comparables no tiene filas de villa', () => {
    expect(normalizeTypeForRentalComparables('villa')).toBe('casa');
  });

  it('penthouse sigue buscando entre los comparables de departamento', () => {
    expect(normalizeTypeForRentalComparables('penthouse')).toBe('departamento');
  });

  it('el resto de los tipos no se toca', () => {
    expect(normalizeTypeForRentalComparables('casa')).toBe('casa');
    expect(normalizeTypeForRentalComparables('departamento')).toBe('departamento');
    expect(normalizeTypeForRentalComparables('terreno')).toBe('terreno');
    expect(normalizeTypeForRentalComparables(null)).toBeNull();
    expect(normalizeTypeForRentalComparables(undefined)).toBeUndefined();
  });
});
