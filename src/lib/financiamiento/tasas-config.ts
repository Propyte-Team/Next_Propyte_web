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
 * Estado del DATA-GATE por rango:
 *   1. Crédito hipotecario — RESUELTO. Ya no es un rango de mercado sin respaldo:
 *      el copy se genera desde `HIPOTECARIO_CONFIG` y la propia tarjeta dice que
 *      son las condiciones que aplica el simulador, por perfil. La fuente es
 *      interna y está declarada en el texto, así que no lleva renglón aparte.
 *   2. Descuento por pago de contado 5-15% → TODO: DATA-GATE [CONFIRMAR: fuente].
 *      Es una política que varía por desarrollador; el respaldo natural son los
 *      `esquemas_pago` de los desarrollos publicados en el Hub.
 *   3. Financiamiento del desarrollador 0% sobre precio de lista → TODO: DATA-GATE
 *      [CONFIRMAR: fuente]. Mismo respaldo que el 2.
 *   4. Crédito puente 12-18% → TODO: DATA-GATE [CONFIRMAR: fuente]. Externa: tasas
 *      publicadas por la institución.
 * Formato esperado al llenarlo: `Tasas publicadas por <institución>, consultadas <YYYY-MM-DD>.`
 */
export const TASAS_FUENTES: Record<1 | 2 | 3 | 4, string | null> = {
  // 1 queda null a propósito: su respaldo va en la descripción, no en un renglón.
  1: null,
  2: null,
  3: null,
  4: null,
};
