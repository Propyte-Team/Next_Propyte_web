/**
 * Stats de mercado para /como-invertir.
 *
 * REGLA ANTI-HUMO (Web_ComoInvertirCopyFinal v1.0, Apéndice B):
 * Estos valores SOLO se llenan cuando la herramienta de mercado de Propyte
 * (en desarrollo) provea datos REALES y verificables. NUNCA con números
 * provisionales "razonables" — un número a mano escondido aquí sigue siendo humo.
 * Mientras un valor sea `null`, su stat NO se muestra en la página.
 *
 * Las cifras de Airbnb, cuando lleguen, deben reflejar la realidad del mercado
 * (p. ej. la corrección de Tulum), no el viejo "60-75% ocupación".
 */
export interface MarketStats {
  roi_plusvalia: string | null;
  roi_renta_residencial: string | null;
  roi_airbnb: string | null;
  desc_preventa: string | null;
  desc_construccion: string | null;
  desc_entrega: string | null;
}

export const MARKET_STATS: MarketStats = {
  roi_plusvalia: null,
  roi_renta_residencial: null,
  roi_airbnb: null,
  desc_preventa: null,
  desc_construccion: null,
  desc_entrega: null,
};

/**
 * El comparador de inversión (Bienes raíces vs CETES vs Bolsa vs Fibras vs Banco)
 * solo se muestra cuando hay tasas REALES detrás — en especial la tasa
 * inmobiliaria de referencia. Hasta entonces se oculta (no se inventa un IRR).
 * Para reactivarlo: poner `true` y cablear las tasas reales en
 * `InvestmentComparison` (hoy son placeholders y NO deben publicarse).
 */
export const COMPARATOR_READY = false;
