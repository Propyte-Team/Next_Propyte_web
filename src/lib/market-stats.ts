/**
 * Stats de mercado para /como-invertir — FUENTE ÚNICA (ROI + descuentos + tasas).
 *
 * REGLA ANTI-HUMO (Web_ComoInvertirCopyFinal v1.0, Apéndice B):
 * ROI por estrategia y descuentos por etapa SOLO se muestran si la herramienta
 * de mercado de Propyte (en el Hub) provee datos REALES; si no, se OCULTAN
 * (nunca números provisionales). El comparador SÍ se muestra (es una calculadora
 * interactiva), pero su tasa inmobiliaria se marca como REFERENCIAL/ILUSTRATIVA
 * hasta que el Hub dé un dato con fuente; las tasas públicas (CETES, Fibras,
 * Bolsa, Banco) usan referencias de mercado conocidas.
 *
 * Hoy el endpoint del Hub aún no existe → getMarketStats() cae a EMPTY (todo
 * null) → la página oculta el ROI por estrategia y los descuentos, y el
 * comparador corre con tasas referenciales (RE etiquetado "ilustrativo"). Cuando
 * exista la tabla/endpoint en el Hub, sobrescribe lo que tenga, sin tocar código
 * ni redeploy (refresca por el tag `hub:market-stats`).
 *
 * Las cifras de Airbnb, cuando lleguen, deben reflejar la realidad del mercado
 * (p. ej. la corrección de Tulum), no el viejo "60-75% ocupación".
 *
 * Nada de esto va en env vars: son datos que se mueven con el mercado y los
 * edita el backend/Hub. Las env vars quedan para secretos y config por ambiente.
 */

// Mismo origen que el resto de lecturas del Hub (ver hub-content.ts).
const HUB_BASE = process.env.PROPYTE_HUB_URL ?? process.env.HUB_API_URL ?? '';

export interface MarketStats {
  // ROI por estrategia (texto, p. ej. "8-14% anual"). null = stat oculto.
  roi_plusvalia: string | null;
  roi_renta_residencial: string | null;
  roi_airbnb: string | null;
  // Descuento por etapa de construcción (texto, p. ej. "20-40%"). null = "según proyecto".
  desc_preventa: string | null;
  desc_construccion: string | null;
  desc_entrega: string | null;
  // Tasas anuales del comparador (decimal, p. ej. 0.105 = 10.5%). null = comparador oculto.
  tasa_inmobiliaria: number | null;
  tasa_cetes: number | null;
  tasa_bolsa: number | null;
  tasa_fibras: number | null;
  tasa_banco: number | null;
  // Fecha del dato (para el disclaimer del comparador).
  fecha: string | null;
}

export const EMPTY_MARKET_STATS: MarketStats = {
  roi_plusvalia: null,
  roi_renta_residencial: null,
  roi_airbnb: null,
  desc_preventa: null,
  desc_construccion: null,
  desc_entrega: null,
  tasa_inmobiliaria: null,
  tasa_cetes: null,
  tasa_bolsa: null,
  tasa_fibras: null,
  tasa_banco: null,
  fecha: null,
};

/**
 * Lee los stats de mercado del Hub.
 * Endpoint esperado: `GET {HUB}/api/public/market-stats` → MarketStats (claves arriba).
 * Si el Hub no está configurado, el endpoint no existe o la red falla,
 * regresa EMPTY → todo oculto (fail-closed). Cache 5 min + revalidación por tag.
 */
export async function getMarketStats(): Promise<MarketStats> {
  if (!HUB_BASE) return EMPTY_MARKET_STATS;
  try {
    const res = await fetch(`${HUB_BASE}/api/public/market-stats`, {
      next: { revalidate: 300, tags: ['hub:market-stats'] },
    });
    if (!res.ok) return EMPTY_MARKET_STATS;
    const data = (await res.json()) as Partial<MarketStats>;
    return { ...EMPTY_MARKET_STATS, ...data };
  } catch {
    return EMPTY_MARKET_STATS;
  }
}

/**
 * Tasas anuales referenciales de mercado (decimal). Las 4 financieras son
 * benchmarks públicos conocidos (CETES/Fibras/Bolsa/Banco). `inmobiliaria` es
 * una referencia ILUSTRATIVA hasta que la herramienta de mercado del Hub provea
 * un dato con fuente — por eso se marca como tal en el comparador.
 */
export const REFERENTIAL_RATES = {
  inmobiliaria: 0.12,
  cetes: 0.105,
  bolsa: 0.10,
  fibras: 0.085,
  banco: 0.05,
} as const;

export interface ComparatorRates {
  inmobiliaria: number;
  cetes: number;
  bolsa: number;
  fibras: number;
  banco: number;
  fecha: string | null;
  /** true mientras la tasa inmobiliaria sea la referencial (no dato del Hub). */
  reReferential: boolean;
}

/**
 * Siempre devuelve las 5 tasas (el comparador es una calculadora y se muestra
 * siempre). Usa el dato del Hub cuando existe; si no, la referencia de mercado.
 * `reReferential` indica que la tasa inmobiliaria aún es referencial → el
 * comparador la etiqueta como "ilustrativa".
 */
export function getComparatorRates(s: MarketStats): ComparatorRates {
  return {
    inmobiliaria: s.tasa_inmobiliaria ?? REFERENTIAL_RATES.inmobiliaria,
    cetes: s.tasa_cetes ?? REFERENTIAL_RATES.cetes,
    bolsa: s.tasa_bolsa ?? REFERENTIAL_RATES.bolsa,
    fibras: s.tasa_fibras ?? REFERENTIAL_RATES.fibras,
    banco: s.tasa_banco ?? REFERENTIAL_RATES.banco,
    fecha: s.fecha,
    reReferential: s.tasa_inmobiliaria == null,
  };
}
