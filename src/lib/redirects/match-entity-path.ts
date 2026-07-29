/**
 * ¿Es esta ruta el detalle de una entidad que puede tener redirección?
 *
 * Vive aparte del middleware para poder probarse sin montar un request. Es pura:
 * no toca red ni base de datos.
 *
 * Devuelve el `entity_type` tal como lo guarda `real_estate_hub.slug_redirects`,
 * no el segmento de la URL — la tabla dice 'development'/'unit', las rutas dicen
 * 'desarrollos'/'propiedades'. Traducir aquí evita que el middleware conozca las
 * dos vocabularios.
 *
 * Por qué existe la lista blanca de locales y el corte de profundidad: el
 * middleware corre en cada request que pase su matcher, y cada ruta que llegue
 * aquí sin ser un detalle real es una consulta al mapa por nada.
 */
export type EntityType = 'blog_post' | 'development' | 'unit';

export type EntityPathMatch = {
  locale: string;
  entityType: EntityType;
  slug: string;
};

const LOCALES = new Set(['es', 'en']);

const SECCION_A_ENTIDAD: Record<string, EntityType> = {
  blog: 'blog_post',
  desarrollos: 'development',
  propiedades: 'unit',
};

export function matchEntityPath(pathname: string): EntityPathMatch | null {
  // La barra final no cambia la identidad del recurso.
  const partes = pathname.replace(/\/+$/, '').split('/');

  // Exactamente ['', locale, seccion, slug]: nada más profundo ni más corto.
  // '/es/blog' es el listado y '/es/blog/x/y' no es una ruta que exista.
  if (partes.length !== 4 || partes[0] !== '') return null;

  const [, locale, seccion, slug] = partes;
  if (!LOCALES.has(locale)) return null;

  const entityType = SECCION_A_ENTIDAD[seccion];
  if (!entityType || !slug) return null;

  return { locale, entityType, slug };
}
