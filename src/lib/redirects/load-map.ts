import type { EntityType } from './match-entity-path';
import type { RedirectMap, RedirectRow } from './resolve-target';
import { createRedirectMapLoader } from './map-cache';

/**
 * Carga del mapa de redirecciones que consume el middleware.
 *
 * ── Dos bugs medidos en producción el 29-jul, ambos silenciosos ────────────────
 *
 * 1) El middleware original consultaba `/rest/v1/slug_redirects` pidiendo
 *    `new_path` y `redirect_type`: tabla y columnas que no existen. Sin el header
 *    `Accept-Profile`, PostgREST resuelve al schema `public`, donde la tabla no
 *    está. Devolvía error, `if (res.ok)` lo descartaba y el `catch {}` se lo
 *    comía: los redirects nunca funcionaron y nada lo reportó.
 *
 * 2) El reemplazo pedía `limit=5000` sobre 3,569 filas y creía traerlas todas.
 *    **PostgREST topa en 1000 filas por respuesta e ignora el límite mayor sin
 *    avisar**: devolvía 1000 filas con HTTP 200. El mapa cubría el 28% de la
 *    tabla, arbitrariamente — `manlika` y `nubba` quedaban fuera. El middleware
 *    estaba vivo y no redirigía. De ahí la paginación de este módulo.
 *
 * ── Por qué se leen las tablas de entidades ────────────────────────────────────
 * `new_slug` es una foto y se podre; ver el bloque de resolve-target.ts. El slug
 * vigente se pregunta por `entity_id`, y para eso hay que traer las entidades
 * publicadas. Son pocas (18 desarrollos y 49 unidades hoy) y caben de sobra en
 * una página.
 *
 * IMPORTANTE: la lectura va con la llave ANÓNIMA a propósito. La política RLS de
 * esas tablas es `ext_publicado = true AND deleted_at IS NULL`, que es
 * exactamente lo que la página pública puede renderizar. Con la llave de servicio
 * el conjunto incluiría entidades despublicadas y el middleware mandaría 308 a
 * páginas que devuelven la UI de "no encontrada".
 */

/** Tope duro de PostgREST por respuesta. Pedir más no trae más: lo ignora. */
export const TAMANO_PAGINA = 1000;

/**
 * 12,000 filas de tope. Son 3,569 y crecen despacio; el tope existe para que un
 * servidor que devuelva siempre una página llena no deje al middleware pidiendo
 * páginas para siempre.
 */
const MAX_PAGINAS = 12;

/**
 * `unit` no se carga: las 2,870 filas de unidades no se pueden resolver con la
 * llave anónima sin mandar 410 a páginas que renderizan. Ver el bloque
 * FUERA_DE_ALCANCE en resolve-target.ts. Dejarlas fuera del mapa además lo baja
 * de 3,569 a 699 filas.
 */
const ENTITY_TYPES = new Set<string>(['blog_post', 'development']);
const KINDS = new Set<string>(['redirect', 'gone']);

/** Qué tabla y qué columna guarda el slug de cada tipo de entidad. */
const ENTIDADES: Array<{ tabla: string; slugCol: string }> = [
  { tabla: 'Propyte_desarrollos', slugCol: 'ext_slug_desarrollo' },
];

export function redirectsPageUrl(supabaseUrl: string, offset: number): string {
  const select = 'entity_type,old_slug,new_slug,kind,entity_id';
  // `order=id` es lo que hace estable al offset: sin ORDER BY, Postgres puede
  // devolver las filas en otro orden entre páginas y perderíamos o duplicaríamos.
  return `${supabaseUrl}/rest/v1/slug_redirects?select=${select}&order=id&limit=${TAMANO_PAGINA}&offset=${offset}`;
}

export function entidadesPageUrl(
  supabaseUrl: string,
  tabla: string,
  slugCol: string,
  offset: number,
): string {
  return `${supabaseUrl}/rest/v1/${tabla}?select=id,${slugCol}&order=id&limit=${TAMANO_PAGINA}&offset=${offset}`;
}

/**
 * El destino y el origen son SLUGS, no rutas: un solo segmento, sin barras ni
 * esquema. Es una defensa, no un formato: una fila hostil en el Hub —o una cuenta
 * comprometida— no puede mandar al visitante fuera del sitio.
 */
function esSlugLimpio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0 && /^[a-z0-9][a-z0-9-]*$/i.test(valor);
}

/**
 * Destino de página: `page:` + slug limpio (ver PREFIJO_PAGINA en
 * resolve-target.ts). Mismo régimen de defensa que esSlugLimpio — un solo
 * segmento, sin barras ni esquema — así que una fila hostil sigue sin poder
 * mandar al visitante fuera del sitio.
 */
function esDestinoPagina(valor: unknown): valor is string {
  return typeof valor === 'string' && /^page:[a-z0-9][a-z0-9-]*$/i.test(valor);
}

/** Pura: filas de PostgREST → las filas del mapa, llaveadas por tipo y slug viejo. */
export function filasToMap(rows: unknown): Map<string, RedirectRow> {
  const map = new Map<string, RedirectRow>();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const {
      entity_type: entityType,
      old_slug: oldSlug,
      new_slug: newSlug,
      kind,
      entity_id: entityId,
    } = row as Record<string, unknown>;

    if (typeof entityType !== 'string' || !ENTITY_TYPES.has(entityType)) continue;
    if (typeof kind !== 'string' || !KINDS.has(kind)) continue;
    if (!esSlugLimpio(oldSlug)) continue;

    map.set(`${entityType as EntityType}:${oldSlug}`, {
      entityId: typeof entityId === 'string' && entityId.length > 0 ? entityId : null,
      // Un destino sucio se anula en lugar de propagarse: resolveTarget lo trata
      // como "sin destino" y no redirige.
      newSlug: esSlugLimpio(newSlug) || esDestinoPagina(newSlug) ? newSlug : null,
      kind: kind as 'redirect' | 'gone',
    });
  }

  return map;
}

/** Pura: filas de una tabla de entidades → `entity_id` → slug publicado hoy. */
export function entidadesToSlugVigente(rows: unknown, slugCol: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const registro = row as Record<string, unknown>;
    const id = registro.id;
    const slug = registro[slugCol];

    if (typeof id !== 'string' || id.length === 0) continue;
    // Una entidad publicada sin slug no tiene página: se omite para que caiga en
    // 410 y no en un 308 hacia la nada.
    if (!esSlugLimpio(slug)) continue;

    map.set(id, slug);
  }

  return map;
}

/**
 * Pide páginas hasta que una venga incompleta. Es la corrección del bug 2: una
 * sola llamada nunca trae más de 1000 filas, diga lo que diga el `limit`.
 */
export async function traerTodasLasPaginas(
  traerPagina: (offset: number) => Promise<unknown[]>,
  opts: { tamanoPagina?: number; maxPaginas?: number } = {},
): Promise<unknown[]> {
  const tamanoPagina = opts.tamanoPagina ?? TAMANO_PAGINA;
  const maxPaginas = opts.maxPaginas ?? MAX_PAGINAS;

  const todas: unknown[] = [];
  for (let pagina = 0; pagina < maxPaginas; pagina++) {
    const filas = await traerPagina(pagina * tamanoPagina);
    todas.push(...filas);
    // Página incompleta (o vacía) significa que no hay más.
    if (filas.length < tamanoPagina) break;
  }

  return todas;
}

async function getJson(url: string, apikey: string): Promise<unknown[]> {
  const res = await fetch(url, {
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      // Sin esto PostgREST resuelve al schema `public`, donde la tabla no está.
      // Era la causa del bug 1.
      'Accept-Profile': 'real_estate_hub',
    },
  });
  if (!res.ok) throw new Error(`PostgREST HTTP ${res.status} en ${url}`);
  const cuerpo = await res.json();
  return Array.isArray(cuerpo) ? cuerpo : [];
}

/**
 * Trae la tabla de redirecciones y los slugs vigentes de las entidades publicadas.
 * Con los volúmenes de hoy son 4 páginas de redirecciones y 1 por entidad: 6
 * llamadas cada vez que expira el TTL de 5 minutos, no por request.
 */
async function fetchRedirectMap(): Promise<RedirectMap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { filas: new Map(), slugVigentePorEntidad: new Map() };
  }

  const [filasCrudas, ...porEntidad] = await Promise.all([
    traerTodasLasPaginas((offset) => getJson(redirectsPageUrl(supabaseUrl, offset), supabaseKey)),
    ...ENTIDADES.map(({ tabla, slugCol }) =>
      traerTodasLasPaginas((offset) =>
        getJson(entidadesPageUrl(supabaseUrl, tabla, slugCol, offset), supabaseKey),
      ).then((rows) => entidadesToSlugVigente(rows, slugCol)),
    ),
  ]);

  const slugVigentePorEntidad = new Map<string, string>();
  for (const parcial of porEntidad) {
    for (const [id, slug] of parcial) slugVigentePorEntidad.set(id, slug);
  }

  return { filas: filasToMap(filasCrudas), slugVigentePorEntidad };
}

/**
 * El loader que consume el middleware: cacheado en memoria con TTL y con las
 * cargas concurrentes deduplicadas. El camino caliente no hace I/O.
 */
export const loadRedirectMap = createRedirectMapLoader({ fetchRows: fetchRedirectMap });
