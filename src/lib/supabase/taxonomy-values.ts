/**
 * Puente entre los slugs canónicos de las URLs de faceta y las grafías que el
 * inventario guarda de verdad en `real_estate_hub.v_developments`.
 *
 * Por qué existe: el filtro usaba el slug crudo —`.eq('stage','preventa')`—
 * contra una columna que almacena `'Preventa'`, y
 * `.contains('property_types',['departamento'])` contra `'Departamento'`. Las
 * ocho páginas de faceta devolvían cero resultados mientras el índice mostraba
 * 19 desarrollos.
 *
 * Por qué no se renombran los slugs con la grafía de la base: la URL es un
 * contrato público y no debe atarse a un texto editable desde el Hub.
 *
 * MANTENIMIENTO: los valores de la derecha son grafías del dato, verificadas
 * contra la vista el 2026-08-06. Si alguien renombra un valor en el Hub, hay
 * que tocar este archivo o la faceta se vacía en silencio. `taxonomy-values.test.ts`
 * atrapa los typos, pero no puede saber que el Hub cambió.
 */

/** Slug canónico de etapa → grafías aceptadas en la columna `stage`. */
export const STAGE_DB_VALUES: Record<string, string[]> = {
  preventa: ['Preventa'],
  construccion: ['En construcción'],
  entrega_inmediata: ['Entrega inmediata'],
};

/**
 * Slug de tipo → grafías aceptadas dentro del array `property_types`.
 *
 * `terreno` cubre cuatro grafías porque el inventario distingue lote y terreno
 * sin criterio estable, y en singular y plural. Para quien compra son el mismo
 * producto, así que la faceta los unifica.
 */
export const TYPE_DB_VALUES: Record<string, string[]> = {
  departamento: ['Departamento'],
  casa: ['Casa', 'Residencia'],
  penthouse: ['Penthouse'],
  terreno: ['Terrenos', 'Terreno', 'Lotes', 'Lote'],
  macrolote: ['Macrolote', 'Macrolotes'],
};

/**
 * Grafías observadas en el inventario el 2026-08-06 (todas las filas, no solo
 * las publicadas). Existen para que la prueba atrape un typo en los mapas de
 * arriba, no para restringir lo que el Hub puede llegar a guardar.
 */
export const OBSERVED_STAGE_VALUES = [
  'Preventa',
  'En construcción',
  'Entrega inmediata',
  'Entregado',
];

export const OBSERVED_TYPE_VALUES = [
  'Departamento',
  'Casa',
  'Penthouse',
  'Villa',
  'Condominio',
  'Residencia',
  'Terrenos',
  'Lote',
  'Lotes',
  'Local comercial',
  'Lote comercial',
];

/**
 * Grafías que los mapas declaran y que el inventario NO tenía el 2026-08-06.
 * Se aceptan a propósito: la faceta existe en la URL y quedará vacía hasta que
 * haya producto de ese tipo. `/desarrollos/tipo/macrolote` es el caso vivo —su
 * vacío no es un fallo del filtro, es falta de inventario, y qué hacer con esa
 * página (retirarla o declararla vacía) es decisión de negocio.
 */
export const VALUES_NOT_IN_INVENTORY = ['Terreno', 'Macrolote', 'Macrolotes'];
