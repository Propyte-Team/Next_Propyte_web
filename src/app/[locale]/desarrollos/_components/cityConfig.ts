/**
 * City configuration for /desarrollos/{city} literal routes.
 * Each entry powers a thin page.tsx wrapper that renders CityDevelopmentsPage.
 *
 * Adding a new city: append to CITY_MAP + create app/[locale]/desarrollos/{slug}/page.tsx
 * (copy any of the existing city wrappers and change `citySlug`).
 */
export interface CityInfo {
  name: string;
  state: string;
  /**
   * Variantes de escritura de la ciudad tal como puede aparecer en la columna
   * `city`. **ILIKE es case-insensitive pero accent-SENSITIVE**: `'%Cancun%'`
   * NO matchea `'Cancún'`. Medido 2026-07-28 en prod: la columna solo tiene la
   * forma acentuada (`Cancún` 141 filas, `Mérida` 216; cero sin acento), así que
   * un `matchTerm` sin acento devolvía 0 resultados y las páginas de Cancún y
   * Mérida estaban vacías en producción. Tulum y Playa del Carmen funcionaban
   * solo porque no llevan acento. Se listan todas las variantes y se combinan
   * con `.or()`.
   */
  matchTerms: string[];
  descEs: string;
  descEn: string;
}

export const CITY_MAP: Record<string, CityInfo> = {
  cancun: {
    name: 'Cancún',
    state: 'Quintana Roo',
    matchTerms: ['Cancún', 'Cancun'],
    descEs:
      'Explora los nuevos desarrollos inmobiliarios en Cancún, Quintana Roo. Preventas de departamentos, casas y terrenos con los mejores precios.',
    descEn:
      'Explore new real estate developments in Cancún, Quintana Roo. Pre-sale apartments, houses, and land at the best prices.',
  },
  'playa-del-carmen': {
    name: 'Playa del Carmen',
    state: 'Quintana Roo',
    matchTerms: ['Playa del Carmen'],
    descEs:
      'Descubre los nuevos desarrollos en Playa del Carmen. Condos de inversión, preventas y oportunidades en la Riviera Maya.',
    descEn:
      'Discover new developments in Playa del Carmen. Investment condos, pre-sales, and opportunities in the Riviera Maya.',
  },
  tulum: {
    name: 'Tulum',
    state: 'Quintana Roo',
    matchTerms: ['Tulum'],
    descEs:
      'Nuevos lanzamientos inmobiliarios en Tulum. Departamentos, villas y terrenos en preventa con alto potencial de inversión.',
    descEn:
      'New real estate launches in Tulum. Apartments, villas, and land in pre-sale with high investment potential.',
  },
  merida: {
    name: 'Mérida',
    state: 'Yucatán',
    matchTerms: ['Mérida', 'Merida'],
    descEs:
      'Desarrollos inmobiliarios en Mérida, Yucatán. Terrenos, casas y departamentos en preventa en las mejores zonas.',
    descEn:
      'Real estate developments in Mérida, Yucatán. Land, houses, and apartments in pre-sale in the best zones.',
  },
};

export const CITY_SLUGS = Object.keys(CITY_MAP);

/** Filtro PostgREST `.or()` que matchea cualquiera de las variantes de la ciudad.
 *  Ej: `city.ilike.%Cancún%,city.ilike.%Cancun%`. */
export function cityMatchFilter(matchTerms: string[]): string {
  return matchTerms.map((term) => `city.ilike.%${term}%`).join(',');
}
