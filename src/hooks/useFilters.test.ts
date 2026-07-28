import { describe, it, expect } from 'vitest';
import { passesRoiMin } from './useFilters';

describe('passesRoiMin', () => {
  it('una unidad sin dato de ROI NO pasa un filtro de ROI mínimo', () => {
    // `null < 5` es true en JS por coerción a 0: sin guard explícito, las
    // unidades sin dato colaban en un filtro que pide rendimiento mínimo.
    expect(passesRoiMin(null, 5)).toBe(false);
  });

  it('sin filtro activo, todas pasan', () => {
    expect(passesRoiMin(null, 0)).toBe(true);
    expect(passesRoiMin(3, 0)).toBe(true);
  });

  it('compara normal cuando hay dato', () => {
    expect(passesRoiMin(7, 5)).toBe(true);
    expect(passesRoiMin(5, 5)).toBe(true);
    expect(passesRoiMin(3, 5)).toBe(false);
  });
});
