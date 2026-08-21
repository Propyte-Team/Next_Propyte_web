/**
 * Etiqueta de categoría para mostrar en UI (`blog_posts.category`).
 *
 * Distinto de `CATEGORIA_A_HUB` en `hub-relacionado.ts`: esa llave es de ruteo
 * y no se localiza a propósito. Esto es lo que lee la visita en la tarjeta/pill
 * de categoría, así que sí necesita versión en inglés.
 */
const CATEGORY_LABEL_EN: Record<string, string> = {
  Inversión: 'Investment',
  'Para Inversionistas': 'For Investors',
  'Guías de compra': 'Buying Guides',
  'Legal y fiscal': 'Legal & Tax',
  Mercado: 'Market',
  'Para Asesores': 'For Advisors',
  'Estilo de vida': 'Lifestyle',
  'Arquitectura y diseño': 'Architecture & Design',
};

export function categoryLabel(category: string, locale: string): string {
  if (locale !== 'en') return category;
  return CATEGORY_LABEL_EN[category] ?? category;
}
