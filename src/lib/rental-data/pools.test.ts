import { describe, expect, it } from 'vitest';
import { averageIndex, isBenchmarkCity, partitionByPool } from './pools';

describe('averageIndex', () => {
  it('promedia solo las zonas que tienen indice', () => {
    expect(averageIndex([{ score: 60 }, { score: 80 }, { score: null }])).toBe(70);
  });

  it('devuelve null cuando ninguna zona tiene indice', () => {
    expect(averageIndex([{ score: null }, { score: null }])).toBeNull();
  });

  it('devuelve null con lista vacia', () => {
    expect(averageIndex([])).toBeNull();
  });

  it('no cuenta como cero a la zona sin indice', () => {
    // El bug: reduce((s, z) => s + (z.score ?? 0)) / target.length daba 40 aqui.
    expect(averageIndex([{ score: 80 }, { score: null }])).toBe(80);
  });
});

describe('partitionByPool', () => {
  it('manda CDMX al bloque de referencia', () => {
    const { ranking, benchmark } = partitionByPool([
      { city: 'Cancun' }, { city: 'CDMX' }, { city: 'Tulum' },
    ]);
    expect(ranking.map((z) => z.city)).toEqual(['Cancun', 'Tulum']);
    expect(benchmark.map((z) => z.city)).toEqual(['CDMX']);
  });

  it('Merida es mercado, no referencia', () => {
    expect(isBenchmarkCity('Merida')).toBe(false);
  });

  it('conserva el orden de entrada en cada particion', () => {
    const { ranking } = partitionByPool([
      { city: 'Tulum' }, { city: 'CDMX' }, { city: 'Cancun' },
    ]);
    expect(ranking.map((z) => z.city)).toEqual(['Tulum', 'Cancun']);
  });
});
