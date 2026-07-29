/**
 * Autor por defecto según la categoría del artículo — la regla editorial de
 * Propyte, en código.
 *
 * Por qué existe: la asignación de autores se hizo con updates sobre las filas
 * que ya existían, pero el Hub no conoce la regla. Con ~60 artículos nuevos por
 * venir, cada uno nacería firmado "Propyte" y habría que acordarse de cambiarlo
 * a mano. Esta tabla es la caída: si la fila trae el autor genérico, el sitio
 * firma según la categoría.
 *
 * NO sobreescribe nunca un autor explícito. Solo actúa cuando `author_name` es
 * el placeholder genérico, así que una firma puesta a mano en el Hub siempre
 * gana. Y si el nombre por defecto no existe en el equipo, se queda el genérico:
 * antes un byline vacío que uno que apunta a una persona inexistente.
 *
 * Regla acordada con Luis (2026-07-29):
 *   ventas / inversión        → Felipe Luksic  (Director Comercial)
 *   lifestyle / zona / mercado → Luis Flores    (Coordinador de Marketing)
 *   asesores                   → Conrad Alvarado (Gerente de Ventas)
 *   legal y fiscal             → Dana Marisol   (Gestor Jurídico)
 *   arquitectura / diseño      → Pablo Toral    (Arquitecto · Postventa)
 */

/** Valor de `blog_posts.author_name` que significa "sin autor asignado". */
export const AUTOR_GENERICO = 'Propyte';

/** Clave = valor EXACTO de `blog_posts.category`. */
export const AUTOR_POR_CATEGORIA: Record<string, string> = {
  'Inversión': 'Felipe Luksic',
  'Para Inversionistas': 'Felipe Luksic',
  'Guías de compra': 'Felipe Luksic',
  'Estilo de vida': 'Luis Flores',
  'Mercado': 'Luis Flores',
  'Para Asesores': 'Conrad Alvarado',
  'Legal y fiscal': 'Dana Marisol',
  'Arquitectura y diseño': 'Pablo Toral',
};

/** `null` si la categoría no tiene autor por defecto (queda el genérico). */
export function autorPorDefecto(category: string | null | undefined): string | null {
  if (!category) return null;
  return AUTOR_POR_CATEGORIA[category] ?? null;
}
