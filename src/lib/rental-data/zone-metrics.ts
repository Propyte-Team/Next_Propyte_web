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

// Vocabulario real de analytics/publication_gates.py:gate_zone(). El componente
// faltante llega como 'missing:<component>' (dos puntos), no como
// 'missing_<component>'. 'sample_below_15' no aparece aqui: gate_zone lo
// resuelve a "drop" y esa fila nunca se escribe en zone_scores.
export type OmissionReason =
  | 'sample_below_30'
  | 'missing:occupancy'
  | 'missing:adr'
  | 'missing:adr_growth_pct'
  | 'missing:revpar'
  | 'thin_cycle'
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

/**
 * Umbrales calibrados sobre la distribución de medianas TTM (39.7–60.7, mediana ~50).
 * Los anteriores (58/40) venían de la escala inflada por los picos de febrero: con
 * medianas reales dejaban casi todas las zonas en 'flat'.
 */
const TREND_UP = 54;
const TREND_DOWN = 45;

/** Sin dato no implica mercado a la baja: es 'flat', no 'down'. */
export function occupancyTrend(occP50: number | null): 'up' | 'down' | 'flat' {
  const occ = usable(occP50);
  if (occ == null) return 'flat';
  if (occ >= TREND_UP) return 'up';
  if (occ <= TREND_DOWN) return 'down';
  return 'flat';
}

/**
 * Formatea un `data_through` ('YYYY-MM-DD' plano) como "mes de año" localizado.
 *
 * Parsear con `new Date('2026-02-01')` y formatear sin `timeZone: 'UTC'` corre
 * el mes hacia atras en cualquier huso negativo (UTC-6 incluido): el string se
 * interpreta como medianoche UTC, y `toLocaleDateString` sin zona explicita usa
 * la zona local, que cae en el dia anterior — enero en vez de febrero. Anclar
 * el parseo a T00:00:00Z y fijar `timeZone: 'UTC'` en el formateo evita el salto.
 */
export function formatDataThroughDate(dataThrough: string, locale: 'es' | 'en'): string {
  const d = new Date(`${dataThrough}T00:00:00Z`);
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Antigüedad de la serie. Rotula la cifra; nunca la oculta. */
export function isStale(dataThrough: string | null, asOf: Date): boolean {
  if (!dataThrough) return true;
  const through = new Date(`${dataThrough}T00:00:00Z`);
  if (Number.isNaN(through.getTime())) return true;
  const days = (asOf.getTime() - through.getTime()) / 86_400_000;
  return days > MAX_DATA_AGE_DAYS;
}

// missing:adr conserva su propia etiqueta porque "sin tarifa nocturna
// publicada" es un hecho que el inversionista puede accionar. Los otros tres
// missing:* colapsan a incompleteDataBadge a proposito: al lector no le hace
// falta saber cual componente interno falto, solo que el indice no se pudo
// calcular.
const OMISSION_LABEL_KEYS: Record<Exclude<OmissionReason, null>, string> = {
  sample_below_30: 'lowSampleBadge',
  'missing:adr': 'missingAdrBadge',
  'missing:occupancy': 'incompleteDataBadge',
  'missing:adr_growth_pct': 'incompleteDataBadge',
  'missing:revpar': 'incompleteDataBadge',
  thin_cycle: 'thinCycleBadge',
};

/**
 * Clave i18n de la etiqueta. Antes TODA omisión renderizaba "muestra baja",
 * incluido Playacar con 922 anuncios y sin tarifa publicada.
 */
export function omissionLabelKey(reason: OmissionReason): string | null {
  return reason ? OMISSION_LABEL_KEYS[reason] : null;
}
