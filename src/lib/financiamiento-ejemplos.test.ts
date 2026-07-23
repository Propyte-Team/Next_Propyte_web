import { describe, it, expect } from 'vitest';
import { pickEjemplosPorTerciles } from './financiamiento-ejemplos';

const row = (
  slug: string,
  price: number | string | null,
  created = '2026-01-01T00:00:00Z',
  images: unknown = ['a.jpg'],
) => ({ slug, price_mxn: price, created_at: created, images });

describe('pickEjemplosPorTerciles', () => {
  it('devuelve [] con pool vacío o sin filas válidas', () => {
    expect(pickEjemplosPorTerciles([])).toEqual([]);
    expect(pickEjemplosPorTerciles([
      row('sin-precio', 0),
      row('precio-null', null),
      row('sin-imagen', 1_000_000, '2026-01-01', []),
      row('imagen-basura', 1_000_000, '2026-01-01', [null, 42]),
    ])).toEqual([]);
  });

  it('elige 1 por tercil y retorna en orden de precio ascendente', () => {
    const picked = pickEjemplosPorTerciles([
      row('alto-1', 9_000_000), row('bajo-1', 1_000_000), row('medio-2', 4_500_000),
      row('bajo-2', 1_500_000), row('alto-2', 12_000_000), row('medio-1', 4_000_000),
    ]);
    expect(picked).toHaveLength(3);
    expect(Number(picked[0].price_mxn)).toBeLessThan(Number(picked[1].price_mxn));
    expect(Number(picked[1].price_mxn)).toBeLessThan(Number(picked[2].price_mxn));
  });

  it('dentro del tercil gana la más reciente', () => {
    const picked = pickEjemplosPorTerciles([
      row('bajo-viejo', 1_000_000, '2026-01-01T00:00:00Z'),
      row('bajo-nuevo', 1_200_000, '2026-06-01T00:00:00Z'),
      row('medio-1', 4_000_000), row('medio-2', 4_500_000),
      row('alto-1', 9_000_000), row('alto-2', 12_000_000),
    ]);
    expect(picked[0].slug).toBe('bajo-nuevo');
  });

  it('con menos de 3 válidas devuelve las que haya, sin duplicar', () => {
    expect(pickEjemplosPorTerciles([row('unica', 2_000_000)]).map((r) => r.slug)).toEqual(['unica']);
    const dos = pickEjemplosPorTerciles([row('a', 1_000_000), row('b', 8_000_000)]);
    expect(dos.map((r) => r.slug)).toEqual(['a', 'b']);
  });

  it('coerciona price_mxn string (NUMERIC de Supabase)', () => {
    const picked = pickEjemplosPorTerciles([
      row('s1', '1000000'), row('s2', '5000000'), row('s3', '9000000'),
    ]);
    expect(picked.map((r) => r.slug)).toEqual(['s1', 's2', 's3']);
  });
});
