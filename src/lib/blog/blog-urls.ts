/**
 * Nombres de los query params del blog y constructor de URLs, en un solo lugar.
 *
 * Antes cada consumidor escribía el literal: la paginación y el filtro usaban
 * 'pagina'/'categoria' a mano, y la auditoría de julio-2026 probó `?page=2`
 * (nombre en inglés) y obtuvo un 200 con la página 1 — un tope escrito dos veces
 * falla en silencio. Con el builder, cambiar un nombre de param mueve
 * paginación, filtro, canonical y hreflang a la vez.
 */

export const BLOG_PAGE_PARAM = 'pagina';
export const BLOG_CATEGORY_PARAM = 'categoria';
export const BLOG_PILAR_PARAM = 'pilar';
export const BLOG_AUDIENCIA_PARAM = 'audiencia';

export interface BlogUrlState {
  category?: string | null;
  /** SLUG del pilar (`fiscal-legal`), no el código (`P1`). Ver `lib/blog/pilares.ts`. */
  pilar?: string | null;
  audiencia?: string | null;
  /** 1 se omite de la URL: `/blog` y `/blog?pagina=1` serían dos URLs del mismo contenido. */
  page?: number | null;
}

/**
 * Ruta relativa del listado de blog para un estado dado. Determinista y con
 * orden de params estable (categoría, pilar, audiencia, página) para que el
 * canonical de una vista sea siempre byte-idéntico a su propio href.
 */
export function blogHref(locale: string, state: BlogUrlState = {}): string {
  const params = new URLSearchParams();
  if (state.category) params.set(BLOG_CATEGORY_PARAM, state.category);
  if (state.pilar) params.set(BLOG_PILAR_PARAM, state.pilar);
  if (state.audiencia) params.set(BLOG_AUDIENCIA_PARAM, state.audiencia);
  if (state.page && state.page > 1) params.set(BLOG_PAGE_PARAM, String(state.page));
  const qs = params.toString();
  return `/${locale}/blog${qs ? `?${qs}` : ''}`;
}
