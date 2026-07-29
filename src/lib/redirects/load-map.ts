import type { EntityType } from './match-entity-path';
import type { RedirectEntry, RedirectMap } from './resolve-target';
import { createRedirectMapLoader } from './map-cache';

/**
 * Carga del mapa de redirecciones que consume el middleware.
 *
 * ── Por qué se reescribió ──────────────────────────────────────────────────────
 * El middleware traía un lookup contra `/rest/v1/slug_redirects` pidiendo
 * `new_path` y `redirect_type`. Esa tabla no existe: `slug_redirects` vive en el
 * schema `real_estate_hub` y sus columnas son `new_slug` y `kind`. PostgREST
 * devolvía error, `if (res.ok)` lo descartaba y el `catch {}` se lo comía — así
 * que los redirects de slugs legacy de WordPress nunca funcionaron, en silencio.
 *
 * Es el tercer mecanismo de redirección muerto del sitio: los otros dos eran
 * `permanentRedirect()` desde componentes de página (que con la cadena de
 * loading.tsx no emite un 3xx real) y una entrada de blog en `next.config` cuyo
 * destino se despublicaba. Ver el frente D del spec en Propyte_hub.
 *
 * El `Accept-Profile` es lo que faltaba: sin él PostgREST resuelve al schema
 * expuesto por default (`public`), donde la tabla no está.
 */

/** Tope de filas. Son ~3,569 y crecen despacio; el tope evita una sorpresa. */
const MAX_ROWS = 5000;

const ENTITY_TYPES = new Set<string>(['blog_post', 'development', 'unit']);

export function redirectMapUrl(supabaseUrl: string): string {
  const select = 'entity_type,old_slug,new_slug,kind';
  return `${supabaseUrl}/rest/v1/slug_redirects?select=${select}&limit=${MAX_ROWS}`;
}

/**
 * El destino es un SLUG, no una ruta: un solo segmento, sin barras ni esquema.
 *
 * Esto es una defensa, no una validación de formato. Una fila hostil en el Hub
 * —o una cuenta comprometida— no puede mandar al visitante fuera del sitio ni
 * salirse del prefijo de sección. El middleware ya defendía así el lookup viejo.
 */
function esSlugLimpio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0 && /^[a-z0-9][a-z0-9-]*$/i.test(valor);
}

/** Pura: filas de PostgREST → mapa que consume `resolveTarget`. */
export function rowsToMap(rows: unknown): RedirectMap {
  const map: RedirectMap = new Map();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const { entity_type: entityType, old_slug: oldSlug, new_slug: newSlug, kind } = row as Record<
      string,
      unknown
    >;

    if (typeof entityType !== 'string' || !ENTITY_TYPES.has(entityType)) continue;
    if (!esSlugLimpio(oldSlug)) continue;

    let entry: RedirectEntry;
    if (kind === 'gone') {
      entry = { newSlug: null, kind: 'gone' };
    } else if (kind === 'redirect' && esSlugLimpio(newSlug)) {
      entry = { newSlug, kind: 'redirect' };
    } else {
      // Un 'redirect' sin destino limpio no puede producir un 308 hacia null. El
      // CHECK de la BD ya lo impide, pero el middleware no confía en eso.
      continue;
    }

    map.set(`${entityType as EntityType}:${oldSlug}`, entry);
  }

  return map;
}

/**
 * Trae el mapa desde PostgREST. Una sola consulta que devuelve la tabla completa.
 *
 * NO lleva `next: { revalidate }`: en middleware eso es un no-op — ver map-cache.ts,
 * que explica por qué y trae el caché que sí funciona. Poner la opción acá sería
 * mentira en el código.
 */
async function fetchRedirectMap(): Promise<RedirectMap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return new Map();

  const res = await fetch(redirectMapUrl(supabaseUrl), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      // Sin esto PostgREST resuelve al schema `public`, donde la tabla no está.
      // Era la causa de que el lookup anterior no encontrara nada.
      'Accept-Profile': 'real_estate_hub',
    },
  });
  if (!res.ok) throw new Error(`slug_redirects HTTP ${res.status}`);
  return rowsToMap(await res.json());
}

/**
 * El loader que consume el middleware: cacheado en memoria con TTL y con las
 * cargas concurrentes deduplicadas. El camino caliente no hace I/O.
 */
export const loadRedirectMap = createRedirectMapLoader({ fetchRows: fetchRedirectMap });
