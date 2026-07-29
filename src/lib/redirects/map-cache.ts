import type { RedirectMap } from './resolve-target';

/**
 * Caché del mapa de redirecciones, en scope de módulo con TTL.
 *
 * ── Por qué se escribe a mano ───────────────────────────────────────────────────
 * La primera versión confiaba en `next: { revalidate: 3600 }` sobre el fetch, y en
 * middleware eso es un NO-OP. Verificado en el código de Next:
 *
 *   - `patch-fetch.ts` sólo asigna `revalidateStore` para stores de tipo
 *     prerender/cache. El middleware crea uno de tipo `'request'` vía
 *     `createRequestStoreForAPI`, así que `next.revalidate` y `next.tags` se
 *     ignoran en silencio.
 *   - El sandbox del edge (`sandbox/context.ts`) llama al fetch nativo del runtime
 *     y ni copia el campo `next`.
 *
 * Y la doc de Next lo dice sin rodeos para middleware: "avoid database lookups
 * here to prevent performance bottlenecks on prefetched routes". Sin caché real,
 * el middleware haría una consulta a Supabase en cada request que matchee — los
 * prefetch de Next incluidos.
 *
 * Con esto, el camino caliente no hace I/O: sirve el mapa en memoria y sólo
 * consulta cuando el TTL expira. La deduplicación importa porque una instancia
 * fría recibe varios requests a la vez y sin ella dispara una consulta por cada uno.
 *
 * Ante un fallo sirve el mapa anterior. Dejar de redirigir tiene costo real —un 200
 * en una URL retirada pierde autoridad— y servir datos de hace unos minutos no.
 */
export type RedirectMapLoaderOptions = {
  fetchRows: () => Promise<RedirectMap>;
  now?: () => number;
  ttlMs?: number;
};

const TTL_POR_DEFECTO_MS = 5 * 60 * 1000;

/** Mapa vacío: el middleware no redirige y la ruta sigue su curso normal. */
function mapaVacio(): RedirectMap {
  return { filas: new Map(), slugVigentePorEntidad: new Map() };
}

export function createRedirectMapLoader(
  opts: RedirectMapLoaderOptions,
): () => Promise<RedirectMap> {
  const { fetchRows } = opts;
  const now = opts.now ?? Date.now;
  const ttlMs = opts.ttlMs ?? TTL_POR_DEFECTO_MS;

  let cache: { map: RedirectMap; at: number } | null = null;
  let enVuelo: Promise<RedirectMap> | null = null;

  return async function load(): Promise<RedirectMap> {
    if (cache && now() - cache.at < ttlMs) return cache.map;
    // Otra carga ya está en curso: engancharse en lugar de disparar otra consulta.
    if (enVuelo) return enVuelo;

    enVuelo = (async () => {
      try {
        const map = await fetchRows();
        cache = { map, at: now() };
        return map;
      } catch {
        // Mapa anterior si lo hay; si no, vacío. Un error de red no tumba el sitio.
        return cache?.map ?? mapaVacio();
      } finally {
        // Sin esto, un fallo dejaría el loader clavado creyendo que hay una carga
        // en vuelo y no reintentaría nunca.
        enVuelo = null;
      }
    })();

    return enVuelo;
  };
}
