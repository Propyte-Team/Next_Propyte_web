import type { RobotsArticulo } from './robots-articulo';

/**
 * ¿Entra al índice esta vista del listado de blog?
 *
 * Hermano de `robotsDeArticulo`, para el otro tipo de página. Existe desde que
 * el filtro de tema ofrece los SIETE pilares del maestro y no solo los que ya
 * tienen piezas: sin esta regla, cada pilar vacío sería una URL indexable con
 * un estado vacío —contenido delgado, justo lo que Google penaliza— y lo mismo
 * cualquier página fuera de rango.
 *
 * Se resuelve solo: en cuanto el pilar publica su primera pieza la vista deja
 * de estar vacía y vuelve al índice sin que nadie toque código.
 *
 * El listado desnudo (sin filtro, página 1) se indexa SIEMPRE, aunque esté
 * vacío: es la canónica de la sección y sacarla del índice por un bache de
 * inventario borraría del buscador la puerta de entrada al blog.
 */
export function robotsDeListado(opts: {
  /** Un valor fuera del catálogo se ignoró: la URL mostraría el set completo. */
  paramInvalido: boolean;
  /** Cuántas piezas se van a pintar en ESTA vista. */
  resultados: number;
  /** ¿Hay algún filtro activo (categoría, pilar o audiencia)? */
  hayFiltro: boolean;
  page: number;
}): RobotsArticulo | undefined {
  const esListadoCanonico = !opts.hayFiltro && opts.page === 1;
  if (!opts.paramInvalido && (opts.resultados > 0 || esListadoCanonico)) return undefined;

  // `follow: true`, igual que en los artículos: la vista vacía sigue enlazando
  // al resto de los temas y a los hubs desde su estado vacío.
  return { index: false, follow: true };
}
