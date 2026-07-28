/**
 * Configuración editable de los datos financieros publicados en /financiamiento.
 *
 * Antes vivía como constante suelta dentro de `BankLogos.tsx`; se extrajo aquí
 * para que la fecha, la cadencia y la fuente de cada rango se editen en un solo
 * lugar sin tocar componentes.
 *
 * REGLA DATA-GATE: `fuente` es `null` mientras no exista atribución trazable.
 * La UI NO publica el rango como si estuviera respaldado: cuando `fuente` es
 * `null` simplemente no imprime el renglón de fuente. NO rellenar con una
 * estimación — la fuente la confirma Luis.
 */

/** Última fecha en que los rangos publicados se revisaron contra la fuente. */
export const TASAS_UPDATED_AT = '2026-04-29';

/**
 * Cadencia de revisión declarada al lector. Los rangos de tasa hipotecaria se
 * mueven mes a mes; declarar la cadencia evita que una fecha vieja se lea como
 * dato abandonado.
 */
export const TASAS_CADENCIA = 'monthly' as const;

/**
 * Fuente por rango publicado, indexada por el número de método de la tarjeta
 * (`method1..method4` en el namespace i18n `financiamiento`).
 *
 * TODO: DATA-GATE — [CONFIRMAR: fuente] para los cuatro rangos:
 *   1. Crédito hipotecario 9.5-12%  → tasas publicadas por BBVA/Banorte/Santander/HSBC/Citibanamex
 *   2. Descuento por pago de contado 5-15% → política por desarrollador
 *   3. Financiamiento del desarrollador 0% sobre precio de lista → esquemas_pago del Hub
 *   4. Crédito puente 12-18% → tasas publicadas por la institución
 * Formato esperado al llenarlo: `Tasas publicadas por <institución>, consultadas <YYYY-MM-DD>.`
 */
export const TASAS_FUENTES: Record<1 | 2 | 3 | 4, string | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
};
