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
export const TASAS_UPDATED_AT = '2026-07-29';

/**
 * Rango de tasa hipotecaria del mercado, verificado banco por banco en el sitio
 * oficial de cada institución el 2026-07-29.
 *
 *   Banorte      Hipoteca Fuerte          desde  8.80%   CAT 12.4%   (cálculo 06-abr-2026, vigente 04-oct-2026)
 *   BBVA         Hipoteca Fija            desde  9.15%   CAT 13.2%   (cálculo 27-feb-2026, vigente 26-ago-2026)
 *   Citibanamex  Hipoteca Perfiles        desde  9.25%   CAT 12.3%   (cálculo 01-abr-2026, vigente 30-sep-2026)
 *   HSBC         Hipoteca Full            desde  9.65%   CAT 11.7%   (cálculo 01-jun-2026, vigente 30-nov-2026)
 *   Santander    Hipoteca Santander      10.25-13.25%    CAT 12.6%   (cálculo 09-mar-2026, vigente 09-sep-2026)
 *
 * El máximo del rango (13.25%) es el tope contractual publicado por Santander,
 * el único que publica rango en vez de un "desde".
 *
 * OJO — la tasa "desde" NO es comparable entre bancos: está condicionada al
 * enganche y al perfil, y BBVA anuncia 9.15% pero calcula su CAT sobre 11.20%.
 * El indicador comparable es el CAT (circular 9/2015 de Banxico), por eso se
 * publica junto al rango. Ninguna cifra viene de agregadores ni de blogs.
 *
 * CONDUSEF (fuente preferida) bloquea el acceso automatizado, así que se usó la
 * fuente primaria alternativa: la página de producto de cada banco. Queda
 * pendiente que un humano coteje los Cuadros Comparativos bajo un perfil
 * homogéneo; si CONDUSEF trae cifras distintas, manda CONDUSEF y se marca la
 * discrepancia en vez de promediar.
 *
 * RECONSULTAR antes del primer vencimiento de CAT: 26-ago-2026 (BBVA).
 */
export const TASAS_MERCADO_HIPOTECARIO = {
  min: '8.8',
  max: '13.25',
  catMin: '11.7',
  catMax: '13.2',
} as const;

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
 *   4. Crédito puente — RESUELTO POR RETIRO (handoff sitio, 2026-08-06). El
 *      "12-18%" no tenía atribución trazable; `method4Rate` dice ahora "Según la
 *      institución". Para restituir la cifra: fuente primaria en TASAS_FUENTES[4]
 *      con formato `Tasas publicadas por <institución>, consultadas <YYYY-MM-DD>`
 *      y el rango de vuelta en `method4Rate` (es + en).
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
  1: `Tasas ordinarias anuales fijas publicadas por BBVA, Banorte, Santander, HSBC y Citibanamex en sus sitios oficiales, consultadas ${TASAS_UPDATED_AT}. CAT promedio publicado: ${TASAS_MERCADO_HIPOTECARIO.catMin}%–${TASAS_MERCADO_HIPOTECARIO.catMax}%. El CAT es el indicador comparable entre bancos; la tasa "desde" depende del enganche y del perfil.`,
  // 2 y 3 no llevan fuente porque ya no publican cifra (ver arriba).
  2: null,
  3: null,
  4: null,
};
