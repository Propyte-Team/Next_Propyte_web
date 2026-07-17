/**
 * Ventana de frescura del analista de mercado (propyte.com/mercado + rentabilidad).
 *
 * Las tablas de analítica (`investment_analytics.airdna_metrics`,
 * `investment_analytics.rental_comparables`) contienen histórico que llega
 * hasta 2023. Ese dato viejo NO representa el mercado actual, así que todas las
 * superficies del analista solo consideran los últimos `ANALYST_WINDOW_MONTHS`
 * meses.
 *
 * - AirDNA/STR  → filtrar por columna `metric_date` (fecha del dato en la serie)
 * - Renta larga → filtrar por columna `scraped_at`
 *
 * Ventana FIJA desde hoy (no configurable por el visitante): un dato de hace
 * más de 12 meses queda fuera sin importar cuántos datos recientes existan.
 */
export const ANALYST_WINDOW_MONTHS = 12;

/**
 * Fecha de corte `YYYY-MM-DD` = hoy − `months` meses.
 * Uso: `.gte('metric_date' | 'scraped_at', analystWindowStart())`.
 * Devuelve solo la fecha (sirve para columnas `date` y `timestamptz`).
 */
export function analystWindowStart(months: number = ANALYST_WINDOW_MONTHS): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}
