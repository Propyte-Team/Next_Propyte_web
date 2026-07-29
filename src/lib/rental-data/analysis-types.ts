/**
 * Forma de la respuesta del análisis de renta tradicional.
 *
 * Vivía declarada dentro de `TradicionalTab.tsx`, así que el server component no podía
 * tiparla sin duplicarla. La tabla de esa pestaña ES el contenido de /mercado y tiene
 * que renderizarse en el servidor, de modo que el tipo tiene que ser compartido entre
 * la ruta API y el server component. Movida verbatim, sin cambios de forma.
 */

export interface Comparable {
  city: string;
  zone: string | null;
  pt: string;   // property_type
  beds: number | null;
  rent: number;
  m2: number | null;
  rt: string;   // rental_type
  fur: boolean | null;
}

export interface DevelopmentFinancial {
  id: string;
  slug: string;
  name: string;
  city: string;
  zone: string | null;
  stage: string;
  price_min: number | null;
  price_max: number | null;
  image: string | null;
  roi_annual_pct: number | null;
  irr_5yr: number | null;
  irr_10yr: number | null;
  cash_on_cash_pct: number | null;
  breakeven_months: number | null;
  monthly_net_flow: number | null;
  cap_rate: number | null;
  rent_yield_gross: number | null;
  rent_yield_net: number | null;
  estimated_rent: number | null;
  estimated_rent_vac: number | null;
}

export interface SourceStat {
  source: string;
  count: number;
}

export interface AnalysisData {
  comparables: Comparable[];
  developments: DevelopmentFinancial[];
  city_stats: Array<Record<string, unknown>>;
  source_stats: SourceStat[];
  data_freshness: string | null;
  model: { version: string; last_computed: string } | null;
  total_comparables: number;
}
