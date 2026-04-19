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
  descEs: string;
  descEn: string;
}

export const CITY_MAP: Record<string, CityInfo> = {
  cancun: {
    name: 'Cancun',
    state: 'Quintana Roo',
    descEs:
      'Explora los nuevos desarrollos inmobiliarios en Cancun, Quintana Roo. Preventas de departamentos, casas y terrenos con los mejores precios.',
    descEn:
      'Explore new real estate developments in Cancun, Quintana Roo. Pre-sale apartments, houses, and land at the best prices.',
  },
  'playa-del-carmen': {
    name: 'Playa del Carmen',
    state: 'Quintana Roo',
    descEs:
      'Descubre los nuevos desarrollos en Playa del Carmen. Condos de inversion, preventas y oportunidades en la Riviera Maya.',
    descEn:
      'Discover new developments in Playa del Carmen. Investment condos, pre-sales, and opportunities in the Riviera Maya.',
  },
  tulum: {
    name: 'Tulum',
    state: 'Quintana Roo',
    descEs:
      'Nuevos lanzamientos inmobiliarios en Tulum. Departamentos, villas y terrenos en preventa con alto potencial de inversion.',
    descEn:
      'New real estate launches in Tulum. Apartments, villas, and land in pre-sale with high investment potential.',
  },
  merida: {
    name: 'Merida',
    state: 'Yucatan',
    descEs:
      'Desarrollos inmobiliarios en Merida, Yucatan. Terrenos, casas y departamentos en preventa en las mejores zonas.',
    descEn:
      'Real estate developments in Merida, Yucatan. Land, houses, and apartments in pre-sale in the best zones.',
  },
};

export const CITY_SLUGS = Object.keys(CITY_MAP);
