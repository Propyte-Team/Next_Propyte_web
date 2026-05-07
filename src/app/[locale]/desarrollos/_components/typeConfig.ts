/**
 * Property type taxonomy for /desarrollos/tipo/{type} routes.
 * Each entry powers a thin page wrapper that renders the marketplace
 * pre-filtered by `property_types` on Supabase.
 */
export interface TypeInfo {
  /** Canonical slug used in URLs (e.g. "departamento"). */
  slug: string;
  /** Singular display name. */
  nameEs: string;
  nameEn: string;
  /** Plural for hero copy. */
  pluralEs: string;
  pluralEn: string;
  descEs: string;
  descEn: string;
}

export const TYPE_MAP: Record<string, TypeInfo> = {
  departamento: {
    slug: 'departamento',
    nameEs: 'Departamento',
    nameEn: 'Apartment',
    pluralEs: 'Departamentos',
    pluralEn: 'Apartments',
    descEs:
      'Departamentos en preventa y construcción en la Riviera Maya, Cancún, Tulum y Mérida. Inversión inmobiliaria con precios de lanzamiento.',
    descEn:
      'Pre-sale and under-construction apartments in the Riviera Maya, Cancun, Tulum, and Merida. Real estate investment at launch prices.',
  },
  penthouse: {
    slug: 'penthouse',
    nameEs: 'Penthouse',
    nameEn: 'Penthouse',
    pluralEs: 'Penthouses',
    pluralEn: 'Penthouses',
    descEs:
      'Penthouses de lujo en Riviera Maya y Yucatán. Vistas panorámicas, terrazas privadas y amenidades premium en preventa.',
    descEn:
      'Luxury penthouses in the Riviera Maya and Yucatán. Panoramic views, private terraces, and premium amenities at pre-sale.',
  },
  casa: {
    slug: 'casa',
    nameEs: 'Casa',
    nameEn: 'House',
    pluralEs: 'Casas',
    pluralEn: 'Houses',
    descEs:
      'Casas en preventa y entrega inmediata en privadas y residenciales. Opciones de inversión y vivienda en Cancún, Playa del Carmen, Tulum y Mérida.',
    descEn:
      'Pre-sale and ready-to-move-in houses in gated communities and residential areas. Investment and primary residence options across Cancun, Playa del Carmen, Tulum, and Merida.',
  },
  terreno: {
    slug: 'terreno',
    nameEs: 'Terreno',
    nameEn: 'Land',
    pluralEs: 'Terrenos',
    pluralEn: 'Land Lots',
    descEs:
      'Terrenos residenciales y de inversión en preventa. Lotes con servicios en Tulum, Playa del Carmen, Mérida y zonas estratégicas.',
    descEn:
      'Residential and investment land lots in pre-sale. Plots with services in Tulum, Playa del Carmen, Merida, and strategic zones.',
  },
  macrolote: {
    slug: 'macrolote',
    nameEs: 'Macrolote',
    nameEn: 'Large Lot',
    pluralEs: 'Macrolotes',
    pluralEn: 'Large Lots',
    descEs:
      'Macrolotes para desarrollo inmobiliario en Yucatán y Quintana Roo. Oportunidades de inversión a gran escala con vocación residencial o turística.',
    descEn:
      'Large land parcels for real estate development in Yucatán and Quintana Roo. Large-scale investment opportunities with residential or tourism use.',
  },
};

export const TYPE_SLUGS = Object.keys(TYPE_MAP);
