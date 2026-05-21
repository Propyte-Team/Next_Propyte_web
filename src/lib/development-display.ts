/**
 * Helpers compartidos para renderizar cards/listados que consumen
 * `real_estate_hub.v_developments` raw (sin pasar por mapDevelopmentToProperty).
 *
 * - `getDisplayTitle`: oculta el nombre interno del desarrollo (cae a publication_title → meta_title → name).
 * - `normalizeStage`: mapea valores legacy del Hub ("Entregado", "Entrega inmediata") a la key i18n canónica.
 * - `getStageLabel`: traduce con guard de fallback (next-intl devuelve "stages.X" literal cuando falta key).
 */

type DevRow = {
  name: string;
  publication_title?: string | null;
  meta_title?: string | null;
};

export function getDisplayTitle(row: DevRow): string {
  return row.publication_title || row.meta_title || row.name;
}

const CANONICAL_STAGES = new Set([
  'preventa',
  'nuevo',
  'construccion',
  'entrega_inmediata',
  'proximamente',
  'reservado',
  'vendido',
]);

export function normalizeStage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (CANONICAL_STAGES.has(lower)) return lower;
  if (lower === 'entregado' || lower === 'entrega inmediata') return 'entrega_inmediata';
  if (lower === 'construcción' || lower === 'en construcción' || lower === 'en construccion') return 'construccion';
  if (lower === 'pre-venta' || lower === 'pre venta') return 'preventa';
  return null;
}

/**
 * Traduce stage con guard contra path-fallback de next-intl
 * (cuando falta la key, retorna "stages.X" literal sin throw).
 */
export function getStageLabel(
  raw: string | null | undefined,
  tStages: (key: string) => string,
): string | null {
  const key = normalizeStage(raw);
  if (!key) return null;
  const label = tStages(key);
  return label.startsWith('stages.') ? null : label;
}
