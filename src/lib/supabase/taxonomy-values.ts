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
 * MANTENIMIENTO: los valores de STAGE_DB_VALUES son grafías del dato,
 * verificadas contra la vista el 2026-08-06. Si alguien renombra un stage en
 * el Hub, hay que tocar este archivo a mano o la faceta se vacía en silencio.
 * `taxonomy-values.test.ts` atrapa los typos, pero no puede saber que el Hub
 * cambió. Para TYPE_DB_VALUES esto ya no aplica igual: deriva de
 * `PRODUCT_TYPE_SPELLINGS` en `product-types.ts`, así que una grafía nueva se
 * agrega ahí (única fuente) y este archivo la recibe solo.
 */

import { PRODUCT_TYPES, PRODUCT_TYPE_SPELLINGS } from '@/lib/catalog/product-types';

/** Slug canónico de etapa → grafías aceptadas en la columna `stage`. */
export const STAGE_DB_VALUES: Record<string, string[]> = {
  preventa: ['Preventa'],
  construccion: ['En construcción'],
  entrega_inmediata: ['Entrega inmediata'],
};

/**
 * Slug de tipo → grafías aceptadas dentro del array `property_types`.
 *
 * Deriva del catálogo. Antes se declaraba a mano aquí y había que acordarse de
 * tocar los dos lugares: si alguien añadía una grafía en un sitio y no en el
 * otro, la faceta devolvía menos resultados sin dar ningún error.
 *
 * `terreno` cubre lote y terreno, singular y plural, porque el inventario los
 * distingue sin criterio estable y para quien compra son el mismo producto.
 */
export const TYPE_DB_VALUES: Record<string, string[]> = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t, [...PRODUCT_TYPE_SPELLINGS[t]]]),
);

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
  'Residencia',
  'Terrenos',
  'Terreno',
  'Lote',
  'Lotes',
  'Local comercial',
  'Lote comercial',
  'Oficina',
  'Estudio',
  '2 Recámaras',
];

/** Grafías que el catálogo declara y que el inventario NO tenía el 2026-08-20.
 *  Se aceptan a propósito: la faceta existe y quedará vacía hasta que haya
 *  producto de ese tipo. */
export const VALUES_NOT_IN_INVENTORY = [
  'Macrolote', 'Macrolotes', 'Townhouse', 'Departamentos', 'Casas',
  'Residencias', 'Villas', 'Penthouses', 'Local', 'Locales comerciales',
  'Oficinas', 'Studio', 'Loft',
];
