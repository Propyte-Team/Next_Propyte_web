// Construye la URL de /propiedades con los filtros que `useFilters` ya sabe
// parsear desde searchParams (ver src/hooks/useFilters.ts → parseFiltersFromParams).
// Los nombres de query param DEBEN coincidir exactamente con ese parser.
//
// Función pura y sin dependencias del DOM → testeable en aislamiento.

export interface PropertySearchArgs {
  search?: string;
  city?: string;
  zone?: string;
  type?: string;
  /** Recámaras mínimas. 4 = "4 o más". */
  bedrooms?: number;
  /** Precio mínimo en MXN. */
  priceMin?: number;
  /** Precio máximo en MXN. */
  priceMax?: number;
  /** ROI anual mínimo estimado (%). */
  roiMin?: number;
  stage?: string;
  usage?: string;
}

// Espejo de los enums válidos de useFilters — descartamos valores fuera de
// rango para no ensuciar la URL con filtros que el parser ignoraría igual.
const VALID_STAGES = ['preventa', 'construccion', 'entrega_inmediata'];
const VALID_USAGES = ['residencial', 'vacacional', 'renta', 'mixto'];

function addString(params: URLSearchParams, key: string, value?: string) {
  const v = value?.trim();
  if (v) params.set(key, v);
}

function addPositiveInt(params: URLSearchParams, key: string, value?: number) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    params.set(key, String(Math.floor(value)));
  }
}

/**
 * @param locale  'es' | 'en' — se antepone al path (next-intl usa prefijo siempre).
 * @param args    Filtros provenientes de la herramienta WebMCP.
 * @returns       Ruta relativa lista para router.push, p.ej. `/es/propiedades?city=Tulum&bedrooms=2`.
 */
export function buildPropertySearchUrl(locale: string, args: PropertySearchArgs = {}): string {
  const params = new URLSearchParams();

  addString(params, 'search', args.search);
  addString(params, 'city', args.city);
  addString(params, 'zone', args.zone);
  addString(params, 'type', args.type);
  addPositiveInt(params, 'bedrooms', args.bedrooms);
  addPositiveInt(params, 'priceMin', args.priceMin);
  addPositiveInt(params, 'priceMax', args.priceMax);
  addPositiveInt(params, 'roiMin', args.roiMin);

  if (args.stage && VALID_STAGES.includes(args.stage)) params.set('stage', args.stage);
  if (args.usage && VALID_USAGES.includes(args.usage)) params.set('usage', args.usage);

  const base = `/${locale}/propiedades`;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
