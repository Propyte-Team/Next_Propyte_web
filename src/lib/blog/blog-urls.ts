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

export interface BlogUrlState {
  category?: string | null;
  /** 1 se omite de la URL: `/blog` y `/blog?pagina=1` serían dos URLs del mismo contenido. */
  page?: number | null;
}

/**
 * Ruta relativa del listado de blog para un estado dado. Determinista y con
 * orden de params estable (categoría antes que página) para que el canonical de
 * una vista sea siempre byte-idéntico a su propio href.
 */
export function blogHref(locale: string, state: BlogUrlState = {}): string {
  const params = new URLSearchParams();
  if (state.category) params.set(BLOG_CATEGORY_PARAM, state.category);
  if (state.page && state.page > 1) params.set(BLOG_PAGE_PARAM, String(state.page));
  const qs = params.toString();
  return `/${locale}/blog${qs ? `?${qs}` : ''}`;
}
