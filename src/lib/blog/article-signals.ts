/**
 * Detección de cifras en el cuerpo de un artículo.
 *
 * C-4 pide enlazar a /metodologia desde "cualquier artículo que contenga cifras
 * de mercado" y C-5 el disclaimer legal en los que traen "proyecciones, tasas o
 * rendimientos". Ambos se resuelven leyendo el contenido: no hace falta una
 * columna nueva ni marcar artículos a mano, y un artículo nuevo queda cubierto el
 * día que se publica sin que nadie recuerde activar un flag.
 *
 * Deliberadamente conservador — un falso positivo mete un enlace de más (barato);
 * un falso negativo publica una proyección sin aviso legal (el error que importa):
 *  - Porcentajes: `8%`, `5-15%`, `9.5 %`.
 *  - Montos: `$4.2M`, `$25,000 MXN`, `USD 300,000`.
 * Se ignoran años (`2026`), rangos de años y cifras dentro de etiquetas HTML
 * (atributos, URLs), para que un `width="100"` no cuente como dato de mercado.
 */

const PERCENT = /\d+(?:[.,]\d+)?\s*(?:-\s*\d+(?:[.,]\d+)?\s*)?%/;
const AMOUNT = /(?:\$\s*\d|(?:MXN|USD)\s*\$?\s*\d|\d[\d,.]*\s*(?:MXN|USD))/i;

/** Quita etiquetas para no leer números de atributos, URLs ni clases CSS. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

/** ¿El cuerpo publica algún porcentaje o monto? */
export function hasMarketFigures(content: string | null | undefined): boolean {
  if (!content) return false;
  const text = stripTags(content);
  return PERCENT.test(text) || AMOUNT.test(text);
}

/**
 * ¿Necesita el aviso legal de inversión? Hoy coincide con `hasMarketFigures`:
 * toda tasa, proyección o rendimiento publicado aparece como porcentaje o monto.
 * Se mantiene como función aparte para poder endurecer una sin mover la otra.
 */
export function needsInvestmentDisclaimer(content: string | null | undefined): boolean {
  return hasMarketFigures(content);
}
