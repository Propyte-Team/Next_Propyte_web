/**
 * Presentación de métricas de zona.
 *
 * Espejo en TypeScript de `analytics/ttm.py`. La estadística se calcula en el
 * pipeline; aquí solo se presenta lo que el pipeline decidió.
 *
 * Ninguna función devuelve 0 como "sin dato": mismo criterio que
 * `src/lib/investment/resolve.ts`, donde el 0 como sentinela ya está prohibido.
 */

/** Mismo umbral que `pipeline_health` usa para `airroi_str_zonal`. */
export const MAX_DATA_AGE_DAYS = 35;

export type OmissionReason =
  | 'thin_cycle'
  | 'sample_below_30'
  | 'missing_adr'
  | null;

/** Un valor sirve solo si es finito y > 0. */
function usable(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Ingreso bruto mensual estimado: tarifa por noche × ocupación × 30.
 * Bruto a propósito — no descuenta comisiones, administración, predial ni ISR.
 */
export function grossMonthlyIncome(
  adrP50: number | null,
  occP50: number | null,
): number | null {
  const adr = usable(adrP50);
  const occ = usable(occP50);
  if (adr == null || occ == null) return null;
  return Math.round(adr * (occ / 100) * 30);
}

/** Antigüedad de la serie. Rotula la cifra; nunca la oculta. */
export function isStale(dataThrough: string | null, asOf: Date): boolean {
  if (!dataThrough) return true;
  const through = new Date(`${dataThrough}T00:00:00Z`);
  if (Number.isNaN(through.getTime())) return true;
  const days = (asOf.getTime() - through.getTime()) / 86_400_000;
  return days > MAX_DATA_AGE_DAYS;
}

const OMISSION_LABEL_KEYS: Record<Exclude<OmissionReason, null>, string> = {
  sample_below_30: 'lowSampleBadge',
  missing_adr: 'missingAdrBadge',
  thin_cycle: 'thinCycleBadge',
};

/**
 * Clave i18n de la etiqueta. Antes TODA omisión renderizaba "muestra baja",
 * incluido Playacar con 922 anuncios y sin tarifa publicada.
 */
export function omissionLabelKey(reason: OmissionReason): string | null {
  return reason ? OMISSION_LABEL_KEYS[reason] : null;
}
