/**
 * Presentación de métricas de zona.
 *
 * Espejo en TypeScript de `analytics/ttm.py`. La estadística se calcula en el
 * pipeline; aquí solo se presenta lo que el pipeline decidió.
 *
 * Ninguna función devuelve 0 como "sin dato": mismo criterio que
 * `src/lib/investment/resolve.ts`, donde el 0 como sentinela ya está prohibido.
 */

import { TTM_WINDOW_MONTHS } from './pipeline-contract';

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
 *
 * Devuelve `null` cuando la entrada no es una fecha parseable: sin la guarda,
 * `toLocaleDateString` sobre un Date invalido publica el literal "Invalid Date"
 * como si fuera el corte de los datos. Mismo criterio que `isStale`, que ante una
 * fecha ilegible responde lo conservador en vez de inventar. El tipo obliga a
 * cada llamador a decidir el texto de ausencia; ninguno puede ignorarlo.
 */
export function formatDataThroughDate(
  dataThrough: string | null | undefined,
  locale: 'es' | 'en',
): string | null {
  if (!dataThrough) return null;
  const d = new Date(`${dataThrough}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Corte comun de un conjunto de zonas: el `data_through` MAS ANTIGUO.
 *
 * Antes cada superficie hacia `.sort().reverse()[0]` — el mas RECIENTE — y una
 * sola zona refrescada bastaba para rotular todo el tablero con esa fecha y
 * apagar el aviso de serie rancia de las otras 25, todavia congeladas en
 * febrero. La unica fecha que el conjunto entero sostiene es la mas antigua:
 * hasta ahi cubren TODAS las zonas.
 *
 * Nota de alcance: al llamador le toca pasar solo el pool que se publica. El
 * benchmark de CDMX no es oferta (ver `pools.ts`) y su frescura no dice nada
 * sobre las zonas del Caribe, asi que no debe entrar aqui.
 */
export function oldestDataThrough(
  zones: readonly { data_through: string | null }[],
): string | null {
  let oldest: string | null = null;
  for (const z of zones) {
    const d = z.data_through;
    if (!d) continue;
    if (oldest == null || d < oldest) oldest = d;
  }
  return oldest;
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

/** Etiqueta lista para renderizar: clave, tooltip y valores de interpolación. */
export interface OmissionBadge {
  /** Clave i18n de la etiqueta corta (namespace `comparisonTable`). */
  labelKey: string;
  /** Clave i18n del tooltip. */
  titleKey: string;
  /** Valores de interpolación. Vacío cuando la clave no pide ninguno. */
  values: Record<string, number>;
}

/**
 * Resuelve la etiqueta de omisión en un solo lugar, para que la tabla y la
 * tarjeta de zona no puedan divergir: hasta ahora ZoneScoreCard colapsaba TODA
 * omisión a "muestra baja" mientras la tabla de al lado, en la misma pantalla,
 * decía "sin tarifa publicada" para la misma zona (Playacar, 922 anuncios).
 *
 * `thin_cycle` interpola los meses observados — la cifra que el spec pide y que
 * `ttm_months_observed` escribía sin que nadie la leyera. Si esa columna llega
 * vacía se usa la variante SIN número: "serie incompleta (0 de 12 meses)" sería
 * inventar una medición a partir de un dato ausente.
 */
export function omissionBadge(
  reason: OmissionReason,
  monthsObserved: number | null | undefined,
): OmissionBadge | null {
  const labelKey = omissionLabelKey(reason);
  if (!labelKey) return null;
  if (labelKey === 'thinCycleBadge') {
    const n = usable(monthsObserved);
    return n != null && Number.isInteger(n) && n < TTM_WINDOW_MONTHS
      ? { labelKey, titleKey: 'thinCycleTitle', values: { n, total: TTM_WINDOW_MONTHS } }
      : { labelKey: 'thinCycleBadgeUnknown', titleKey: 'thinCycleTitle', values: {} };
  }
  return { labelKey, titleKey: labelKey.replace('Badge', 'Title'), values: {} };
}
