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
 *   2. Descuento por pago de contado — RESUELTO POR RETIRO (Luis, 2026-07-29). El
 *      "5-15%" era una política de UN desarrollador (Nativa Tulum), publicada como
 *      si fuera general. En una página general no se publica cifra: queda
 *      "Descuento según proyecto". El respaldo del Hub (`esquemas_pago`) solo
 *      sostiene el caso de Nativa, así que solo sirve en material de ese desarrollo.
 *   3. Financiamiento del desarrollador 0% sobre precio de lista — RESUELTO. La
 *      nota ya no afirma que exista descuento: dice que CUANDO el desarrollo lo
 *      ofrece, ese descuento es el costo real. No hay cifra que respaldar.
 *   4. Crédito puente 12-18% → TODO: DATA-GATE [CONFIRMAR: fuente]. Externa: tasas
 *      publicadas por la institución.
 *
 * PENDIENTE de rango de mercado bancario (Luis pidió "un rango generoso, fechado"):
 * la fuente correcta son los Cuadros Comparativos de Crédito Hipotecario de
 * CONDUSEF (oficiales, actualización trimestral):
 *   https://www.condusef.gob.mx/comparativos/comparativos.php?idc=1&im=bancos.jpg&h=1
 * No se pudo leer desde aquí (el sitio falla la validación de certificado), así que
 * NO se publicó cita ni fecha: citar una fuente no leída es justo lo que esta página
 * existe para no hacer. Hoy la tarjeta muestra 9.5-10.5%, que NO es una afirmación
 * de mercado sin respaldo — son las condiciones del simulador, declaradas como
 * tales. Para publicar un rango de mercado hace falta el dato de CONDUSEF.
 * Formato esperado al llenarlo: `Tasas publicadas por <institución>, consultadas <YYYY-MM-DD>.`
 */
export const TASAS_FUENTES: Record<1 | 2 | 3 | 4, string | null> = {
  // 1 queda null a propósito: su respaldo va en la descripción, no en un renglón.
  1: null,
  2: null,
  3: null,
  4: null,
};
