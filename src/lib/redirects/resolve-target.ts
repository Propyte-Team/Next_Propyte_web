import type { EntityType } from './match-entity-path';

/**
 * Decide qué hacer con un slug que aparece en `real_estate_hub.slug_redirects`.
 *
 * Pura: recibe el mapa ya cargado. La carga y el cacheo viven aparte, para que
 * esta lógica —donde están los casos peligrosos— se pueda probar sola.
 *
 * ── Por qué NO se usa `new_slug` para development/unit ─────────────────────────
 * Esas filas las escribe un trigger cada vez que cambia el slug, que a su vez se
 * deriva del `meta_title`. `new_slug` queda como una FOTO del momento y se podre.
 * Medido el 29-jul sobre las 3,569 filas reales:
 *
 *   - 608 de 699 filas de desarrollos apuntan a un slug que hoy no existe, porque
 *     la entidad se despublicó. Un 308 hacia ahí es un 308 hacia un soft-404:
 *     peor señal para Google que no redirigir, porque además afirma "se movió
 *     permanentemente" hacia algo roto.
 *   - 3 filas redirigen fuera de una URL que hoy está viva.
 *   - 11 filas apuntan a un destino obsoleto aunque la entidad siga publicada.
 *
 * La columna estable es `entity_id`. Con ella se pregunta cuál es el slug con el
 * que la entidad se publica HOY, y de paso desaparecen las cadenas: siempre se
 * salta directo al vigente.
 *
 * ── Qué significa "publicada" ─────────────────────────────────────────────────
 * `slugVigentePorEntidad` se construye leyendo las tablas de entidades con la
 * llave ANÓNIMA, cuya política RLS es `ext_publicado = true AND deleted_at IS
 * NULL`. Eso es exactamente lo que la página pública puede renderizar —verificado
 * en producción: un desarrollo con slug pero `ext_publicado = false` devuelve la
 * UI de "no encontrada" sin `<h1>`. Si alguien cambiara esa carga a la llave de
 * servicio, este módulo empezaría a mandar 308 a páginas que no renderizan.
 */
export type RedirectRow = {
  /** Estable. Null en filas viejas o escritas a mano; sin él no se adivina. */
  entityId: string | null;
  /** Solo se respeta para blog_post. Ver el bloque de arriba. */
  newSlug: string | null;
  kind: 'redirect' | 'gone';
};

export type RedirectMap = {
  /** Llave: `${entityType}:${oldSlug}`. */
  filas: Map<string, RedirectRow>;
  /** `entity_id` → slug con el que la entidad se publica hoy. Solo publicadas. */
  slugVigentePorEntidad: Map<string, string>;
};

/**
 * `gone` (410) se reserva para el retiro DELIBERADO: alguien marcó la fila desde
 * el Hub. `not-found` (404) es para lo inferido —la entidad dejó de estar
 * publicada— porque un desarrollo despublicado puede volver, y en inmobiliaria
 * vuelve seguido. Decirle a Google "se fue para siempre" sobre 667 URLs que
 * podrían republicarse sería más difícil de deshacer que el problema que arregla.
 */
export type RedirectTarget =
  | { kind: 'redirect'; slug: string }
  /** El destino es una PÁGINA del sitio (`/{locale}/{slug}`), no otra entrada de la sección. */
  | { kind: 'redirect-page'; slug: string }
  | { kind: 'gone' }
  | { kind: 'not-found' };

/**
 * Prefijo para destinos que son una página del sitio y no otro artículo. Lo usa
 * el archivo editorial (maestro §15): una pieza retirada cuya intención cubre un
 * hub apunta `page:como-invertir`. Lo que sigue al prefijo es un slug limpio de
 * un solo segmento — la defensa de load-map se mantiene intacta. Solo lo consume
 * blog_post; development resuelve por entidad e ignora `new_slug`.
 */
export const PREFIJO_PAGINA = 'page:';

/**
 * Tipos cuyas filas nacen de un trigger sobre el título: su `new_slug` no es
 * confiable y se resuelven por entidad. Las de blog las escribe una persona al
 * retirar un artículo, así que ahí `new_slug` es una decisión y se respeta.
 */
const RESUELTOS_POR_ENTIDAD = new Set<EntityType>(['development']);

/**
 * `unit` está deliberadamente fuera de alcance. Medido en producción el 29-jul:
 * las dos rutas no se comportan igual y por eso no comparten definición de "vivo".
 *
 *   /es/desarrollos/<slug>  con ext_publicado=false  → NO renderiza (sin <h1>)
 *   /es/propiedades/<slug>  con ext_publicado=false  → SÍ renderiza (con <h1>)
 *
 * La página de unidad no consulta `ext_publicado`: solo deja de renderizar si la
 * fila no existe o tiene `deleted_at`. De 2,084 unidades, 2,084 tienen slug y solo
 * 49 están publicadas — así que tratar "publicada" como "viva" mandaría 410 a unas
 * 2,035 páginas que hoy funcionan. La llave anónima no puede leer el conjunto
 * correcto (su política RLS es justo `ext_publicado = true`), así que resolver
 * unidades necesita antes una vista pública propia o una decisión de producto
 * sobre si esas 2,035 deberían ser públicas. Hasta entonces, las unidades pasan de
 * largo: es el comportamiento que ya tenían, sin regresión.
 */
const FUERA_DE_ALCANCE = new Set<EntityType>(['unit']);

const MAX_SALTOS = 10;

export function resolveTarget(
  map: RedirectMap,
  entityType: EntityType,
  slug: string,
): RedirectTarget | null {
  if (FUERA_DE_ALCANCE.has(entityType)) return null;

  const fila = map.filas.get(`${entityType}:${slug}`);
  if (!fila) return null;

  // Retiro explícito: gana sobre cualquier otra consideración.
  if (fila.kind === 'gone') return { kind: 'gone' };

  if (RESUELTOS_POR_ENTIDAD.has(entityType)) {
    // Sin `entity_id` no hay forma de saber el slug vigente. Confiar en `new_slug`
    // es el error que este módulo existe para evitar, así que no se redirige.
    if (!fila.entityId) return null;

    const vigente = map.slugVigentePorEntidad.get(fila.entityId);

    // La entidad ya no está publicada. 404 y no 410: es un estado que se revierte
    // desde el Hub en un clic, así que no se afirma que sea permanente.
    if (!vigente) return { kind: 'not-found' };

    // El slug pedido ya es el vigente: la página funciona, no hay nada que hacer.
    if (vigente === slug) return null;

    return { kind: 'redirect', slug: vigente };
  }

  return seguirCadena(map, entityType, slug);
}

/**
 * Solo para blog_post. Retirar B después de haber mandado A→B deja a A apuntando
 * a un intermedio, así que la cadena se sigue. El tope y el registro de visitados
 * existen porque un ciclo en la tabla colgaría el middleware en CADA request de
 * esa URL, y nada justifica ese riesgo.
 */
function seguirCadena(
  map: RedirectMap,
  entityType: EntityType,
  slug: string,
): RedirectTarget | null {
  const visitados = new Set<string>([slug]);
  let actual = slug;
  let ultimoDestino: string | null = null;

  for (let salto = 0; salto < MAX_SALTOS; salto++) {
    const fila = map.filas.get(`${entityType}:${actual}`);
    if (!fila) break;

    if (fila.kind === 'gone') return { kind: 'gone' };
    if (!fila.newSlug) break;

    // Un destino de página termina la cadena: las páginas no son filas de la
    // tabla, así que no hay nada más que seguir.
    if (fila.newSlug.startsWith(PREFIJO_PAGINA)) {
      return { kind: 'redirect-page', slug: fila.newSlug.slice(PREFIJO_PAGINA.length) };
    }

    // Auto-referencia: la fila no aporta nada y redirigir sería un bucle de un salto.
    if (fila.newSlug === actual) break;
    if (visitados.has(fila.newSlug)) return null;

    visitados.add(fila.newSlug);
    ultimoDestino = fila.newSlug;
    actual = fila.newSlug;
  }

  if (!ultimoDestino || ultimoDestino === slug) return null;
  return { kind: 'redirect', slug: ultimoDestino };
}
