import { describe, it, expect } from 'vitest';
import { passesRoiMin, matchesProductType } from './useFilters';
import type { Property } from '@/types/property';

/** Property mínima para probar el predicado de tipo. Solo los campos que
 *  `matchesProductType` lee; el resto no interviene. */
function devWith(specType: string, unitTypes?: string[]): Property {
  return {
    kind: 'development',
    specs: { type: specType },
    unitTypes,
  } as unknown as Property;
}

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

describe('matchesProductType', () => {
  it('sin filtro activo, todo pasa', () => {
    expect(matchesProductType(devWith('departamento'), '')).toBe(true);
  });

  it('un desarrollo con lotes Y casas aparece bajo AMBOS filtros', () => {
    // El caso que motivó el cambio: la tarjeta ya mostraba «LOTES · CASAS»
    // pero el desarrollo desaparecía al filtrar por Casa, porque el predicado
    // comparaba contra specs.type — un escalar, el primero del array.
    const mixto = devWith('terreno', ['terreno', 'casa']);
    expect(matchesProductType(mixto, 'terreno')).toBe(true);
    expect(matchesProductType(mixto, 'casa')).toBe(true);
  });

  it('un desarrollo de un solo producto no aparece bajo otro', () => {
    const soloDepas = devWith('departamento', ['departamento']);
    expect(matchesProductType(soloDepas, 'casa')).toBe(false);
  });

  it('sin unidades cargadas cae a specs.type', () => {
    // 4 de los 22 desarrollos visibles no tienen ninguna fila de unidad.
    // Sin el respaldo desaparecerían de todos los filtros.
    expect(matchesProductType(devWith('terreno'), 'terreno')).toBe(true);
    expect(matchesProductType(devWith('terreno'), 'casa')).toBe(false);
  });

  it('un array vacío no se toma como «no tiene tipos»: cae a specs.type', () => {
    expect(matchesProductType(devWith('casa', []), 'casa')).toBe(true);
  });

  it('para unidades sueltas sigue mandando specs.type', () => {
    const unidad = { kind: 'unit', specs: { type: 'penthouse' } } as unknown as Property;
    expect(matchesProductType(unidad, 'penthouse')).toBe(true);
    expect(matchesProductType(unidad, 'casa')).toBe(false);
  });
});
