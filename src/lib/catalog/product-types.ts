/**
 * Catálogo canónico de tipos de PRODUCTO — qué vende un desarrollo.
 *
 * ÚNICA fuente de la normalización de tipos en todo el sitio. La vista
 * `v_developments.property_types` devuelve grafías CRUDAS a propósito: si el
 * SQL también normalizara, las dos implementaciones divergirían y nadie se
 * enteraría hasta que un filtro se vaciara en silencio.
 *
 * No confundir con `developmentType` (residencial-vertical, mixto, hotelero…),
 * que describe el FORMATO del desarrollo, no el producto en venta.
 *
 * Spec: docs/superpowers/specs/2026-08-20-tipos-producto-multiples-design.md
 */

/** Orden de presentación. Fijo: v_units es un subconjunto del inventario real,
 *  así que ordenar por frecuencia inventaría una jerarquía que el dato no
 *  respalda. */
export const PRODUCT_TYPES = [
  'departamento',
  'penthouse',
  'casa',
  'villa',
  'terreno',
  'macrolote',
  'comercial',
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

/**
 * Grafías crudas que el inventario guarda para cada canónico, verificadas
 * contra `Propyte_unidades.tipo_unidad` y `ext_property_types` el 2026-08-20.
 *
 * MANTENIMIENTO: de aquí sale también el mapa que usan las facetas SEO para
 * filtrar en Supabase (`taxonomy-values.ts`). Si alguien captura una grafía
 * nueva en el Hub y no está aquí, ese desarrollo deja de aparecer en su filtro
 * — sin error, solo un resultado menos.
 *
 * `Condominio` NO está: es régimen de propiedad, no producto.
 */
export const PRODUCT_TYPE_SPELLINGS: Record<ProductType, readonly string[]> = {
  departamento: ['Departamento', 'Departamentos', 'Estudio', 'Studio', 'Loft', '2 Recámaras'],
  penthouse: ['Penthouse', 'Penthouses'],
  casa: ['Casa', 'Casas', 'Residencia', 'Residencias', 'Townhouse'],
  villa: ['Villa', 'Villas'],
  terreno: ['Terreno', 'Terrenos', 'Lote', 'Lotes'],
  macrolote: ['Macrolote', 'Macrolotes'],
  // `Local` es la grafía del picklist de Zoho (verificado 2026-08-20), y es la
  // que el Hub escribe. `Local comercial` está en el dato histórico.
  comercial: ['Local', 'Local comercial', 'Locales comerciales', 'Lote comercial', 'Oficina', 'Oficinas'],
};

/** Índice grafía-en-minúsculas → canónico, construido una vez. */
const BY_SPELLING: ReadonlyMap<string, ProductType> = new Map(
  PRODUCT_TYPES.flatMap((t) =>
    PRODUCT_TYPE_SPELLINGS[t].map((s) => [s.toLowerCase(), t] as const),
  ),
);

/**
 * Grafía cruda → canónico, o `null` si no corresponde a ningún producto.
 *
 * `null` es un resultado legítimo y frecuente: 162 filas de unidad tienen
 * `tipo_unidad` NULL. Devolver `'departamento'` para lo desconocido es lo que
 * hacía pasar una oficina por departamento.
 */
export function resolveProductType(raw: string | null | undefined): ProductType | null {
  const lower = (raw ?? '').toLowerCase().trim();
  if (!lower) return null;

  const exacto = BY_SPELLING.get(lower);
  if (exacto) return exacto;

  // Tolerancia por prefijo para variantes que nadie catalogó («lote
  // residencial», «casa de playa»). El orden importa: 'lote comercial'
  // tiene que caer en comercial ANTES de que la regla de lote lo atrape.
  if (lower.includes('comercial') || lower.startsWith('local') || lower.startsWith('oficina')) {
    return 'comercial';
  }
  if (lower.startsWith('macrolote') || lower.startsWith('megalote')) return 'macrolote';
  if (lower.startsWith('terreno') || lower.startsWith('lote')) return 'terreno';
  if (lower.startsWith('penthouse')) return 'penthouse';
  if (lower.startsWith('villa')) return 'villa';
  if (lower.startsWith('casa') || lower.startsWith('townhouse') || lower.startsWith('residencia')) {
    return 'casa';
  }
  if (lower.startsWith('departamento') || lower.startsWith('depto') ||
      lower.startsWith('estudio') || lower.startsWith('studio') || lower.startsWith('loft')) {
    return 'departamento';
  }
  return null;
}
