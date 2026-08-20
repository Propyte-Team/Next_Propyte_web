/**
 * Copia versionada del contrato del pipeline.
 *
 * Estas constantes viven de verdad en el repo del pipeline Python:
 *   crawlers/glowing-spork/analytics/compute_derived.py    -> WEIGHTS
 *   crawlers/glowing-spork/analytics/publication_gates.py  -> MIN_SAMPLE_*
 *
 * Aqui se mantiene una copia porque `methodology-invariants.test.ts` resolvia el
 * pipeline por worktrees hermanos: en CI, o en cualquier maquina sin ese checkout
 * al lado, las dos invariantes cruzadas se SALTABAN. Una guardia que no corre
 * donde se aprueban los merges no protege nada.
 *
 * El test asevera en dos capas:
 *   1. texto publicado (i18n) contra esta copia  -> corre SIEMPRE.
 *   2. esta copia contra el archivo Python real  -> se salta si no esta el repo.
 *
 * Consecuencia deliberada: si el pipeline cambia un peso o un umbral, la capa 2
 * falla en la maquina que si tiene el checkout, y la correccion consiste en
 * actualizar ESTE archivo y el texto publicado juntos. Editar solo este archivo
 * para "poner el test en verde" rompe la capa 2, que es justo la alarma.
 */

/** Pesos del Indice Propyte. Deben sumar 1. */
export const PIPELINE_INDEX_WEIGHTS = {
  occupancy: 0.30,
  adr_growth: 0.25,
  revpar: 0.25,
  competition: 0.20,
} as const;

/** Orden en que la pagina declara los pesos: Ocupacion, Crecimiento de tarifa, RevPAR, Competencia. */
export const PIPELINE_INDEX_WEIGHT_ORDER = [
  'occupancy',
  'adr_growth',
  'revpar',
  'competition',
] as const satisfies readonly (keyof typeof PIPELINE_INDEX_WEIGHTS)[];

/** Anuncios activos minimos para publicar indice (`publication_gates.MIN_SAMPLE_INDEX`). */
export const MIN_SAMPLE_INDEX = 30;

/** Anuncios activos minimos para publicar ocupacion/tarifa (`publication_gates.MIN_SAMPLE_OCCUPANCY`). */
export const MIN_SAMPLE_OCCUPANCY = 15;

/** Meses de la ventana TTM. Rotula la etiqueta de serie incompleta. */
export const TTM_WINDOW_MONTHS = 12;
