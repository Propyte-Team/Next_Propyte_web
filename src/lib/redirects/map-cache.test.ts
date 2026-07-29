import { describe, it, expect, vi } from 'vitest';
import { createRedirectMapLoader } from './map-cache';
import type { RedirectMap } from './resolve-target';

function mapa(): RedirectMap {
  return new Map([['development:viejo', { newSlug: 'nuevo', kind: 'redirect' as const }]]);
}

// El middleware corre en CADA request del sitio. La primera versión confiaba en
// `next: { revalidate: 3600 }`, pero eso es un no-op en middleware: el store de
// tipo 'request' nunca asigna revalidateStore (patch-fetch.ts) y el sandbox del
// edge llama al fetch nativo sin el campo `next` (sandbox/context.ts). La
// documentación de Next lo dice sin rodeos: "avoid database lookups here".
// Estos tests fijan un caché que sí existe.

describe('createRedirectMapLoader', () => {
  it('trae el mapa una sola vez dentro del TTL', async () => {
    const fetchRows = vi.fn().mockResolvedValue(mapa());
    let ahora = 1_000;
    const load = createRedirectMapLoader({ fetchRows, now: () => ahora, ttlMs: 60_000 });

    await load();
    ahora = 30_000;
    await load();
    ahora = 59_999;
    await load();

    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it('vuelve a traer cuando el TTL expira', async () => {
    const fetchRows = vi.fn().mockResolvedValue(mapa());
    let ahora = 1_000;
    const load = createRedirectMapLoader({ fetchRows, now: () => ahora, ttlMs: 60_000 });

    await load();
    ahora = 62_000;
    await load();

    expect(fetchRows).toHaveBeenCalledTimes(2);
  });

  // Una instancia fría bajo carga recibe N requests a la vez. Sin deduplicación
  // dispara N consultas a Supabase por el mismo dato.
  it('deduplica las cargas concurrentes en una sola consulta', async () => {
    let resolver: (m: RedirectMap) => void = () => {};
    const fetchRows = vi.fn().mockImplementation(
      () => new Promise<RedirectMap>((r) => { resolver = r; }),
    );
    const load = createRedirectMapLoader({ fetchRows, now: () => 1_000, ttlMs: 60_000 });

    const enVuelo = [load(), load(), load()];
    resolver(mapa());
    const resultados = await Promise.all(enVuelo);

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(resultados[0]).toBe(resultados[2]);
  });

  // Si Supabase se cae, servir el mapa viejo es mejor que dejar de redirigir:
  // un 200 en una URL retirada pierde autoridad, y la alternativa no cuesta nada.
  it('sirve el mapa anterior cuando la carga falla', async () => {
    const bueno = mapa();
    const fetchRows = vi
      .fn()
      .mockResolvedValueOnce(bueno)
      .mockRejectedValueOnce(new Error('supabase caído'));
    let ahora = 1_000;
    const load = createRedirectMapLoader({ fetchRows, now: () => ahora, ttlMs: 60_000 });

    await load();
    ahora = 62_000;
    const segundo = await load();

    expect(segundo).toBe(bueno);
  });

  it('devuelve un mapa vacío si la primera carga falla, sin lanzar', async () => {
    const fetchRows = vi.fn().mockRejectedValue(new Error('supabase caído'));
    const load = createRedirectMapLoader({ fetchRows, now: () => 1_000, ttlMs: 60_000 });

    const map = await load();

    expect(map.size).toBe(0);
  });

  // Un fallo no debe dejar el loader clavado creyendo que hay una carga en vuelo.
  it('reintenta en la llamada siguiente después de un fallo', async () => {
    const fetchRows = vi
      .fn()
      .mockRejectedValueOnce(new Error('transitorio'))
      .mockResolvedValueOnce(mapa());
    let ahora = 1_000;
    const load = createRedirectMapLoader({ fetchRows, now: () => ahora, ttlMs: 60_000 });

    expect((await load()).size).toBe(0);
    ahora = 1_100;
    expect((await load()).size).toBe(1);
  });
});
