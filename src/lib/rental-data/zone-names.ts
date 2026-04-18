/**
 * Maps raw zone/submarket names from AirDNA to human-readable display names.
 * Used by the vacacional tab to show clean zone names to investors.
 */

export interface ZoneInfo {
  displayName: string;
  description_es: string;
  description_en: string;
}

export const STR_ZONE_NAME_MAP: Record<string, ZoneInfo> = {
  // ── Cancún ──
  'Zona Hotelera': {
    displayName: 'Zona Hotelera',
    description_es: 'Corredor turístico principal de Cancún',
    description_en: 'Main tourist corridor in Cancun',
  },
  'Puerto Cancún': {
    displayName: 'Puerto Cancún',
    description_es: 'Desarrollo premium con marina y campo de golf',
    description_en: 'Premium development with marina and golf course',
  },
  'Centro': {
    displayName: 'Centro',
    description_es: 'Centro urbano de Cancún, mercado local',
    description_en: 'Downtown Cancun, local market',
  },
  'Supermanzana 11-17': {
    displayName: 'SM 11-17',
    description_es: 'Zona céntrica con alta actividad comercial',
    description_en: 'Central zone with high commercial activity',
  },

  // ── Playa del Carmen ──
  'Playacar': {
    displayName: 'Playacar',
    description_es: 'Zona residencial premium al sur de Playa del Carmen',
    description_en: 'Premium residential zone south of Playa del Carmen',
  },
  '28 de Junio': {
    displayName: '28 de Junio',
    description_es: 'Barrio en expansión, precio de entrada accesible',
    description_en: 'Expanding neighborhood, accessible entry price',
  },
  'Ejidal': {
    displayName: 'Ejidal',
    description_es: 'Zona interior, precio de entrada accesible',
    description_en: 'Interior zone, accessible entry price',
  },
  'Los Olivos': {
    displayName: 'Los Olivos',
    description_es: 'Fraccionamiento residencial consolidado',
    description_en: 'Established residential neighborhood',
  },
  'Zazil-Ha': {
    displayName: 'Zazil-Ha',
    description_es: 'Fraccionamiento residencial establecido',
    description_en: 'Established residential neighborhood',
  },

  // ── Tulum ──
  'Tulum Centro': {
    displayName: 'Tulum Centro',
    description_es: 'Centro del pueblo de Tulum',
    description_en: 'Tulum town center',
  },
  'Aldea Zamá': {
    displayName: 'Aldea Zamá',
    description_es: 'Zona premium de departamentos, alta plusvalía',
    description_en: 'Premium condo zone, high appreciation',
  },

  // ── CDMX ──
  'Roma Norte': {
    displayName: 'Roma Norte',
    description_es: 'Colonia trendy con alta demanda turística',
    description_en: 'Trendy neighborhood with high tourist demand',
  },
  'Roma Sur': {
    displayName: 'Roma Sur',
    description_es: 'Extensión de Roma Norte, más residencial',
    description_en: 'Extension of Roma Norte, more residential',
  },
  'Polanco': {
    displayName: 'Polanco',
    description_es: 'Zona premium, turismo de lujo y negocios',
    description_en: 'Premium zone, luxury and business tourism',
  },
  'Condesa': {
    displayName: 'Condesa',
    description_es: 'Zona bohemia con parques y alta ocupación',
    description_en: 'Bohemian zone with parks and high occupancy',
  },
  'Hipódromo': {
    displayName: 'Hipódromo',
    description_es: 'Sub-zona de Condesa, arquitectura art déco',
    description_en: 'Condesa sub-zone, art deco architecture',
  },
  'Coyoacán': {
    displayName: 'Coyoacán',
    description_es: 'Barrio cultural, Frida Kahlo, demanda estable',
    description_en: 'Cultural neighborhood, Frida Kahlo, stable demand',
  },
  'Cuauhtémoc': {
    displayName: 'Cuauhtémoc',
    description_es: 'Centro histórico y negocios',
    description_en: 'Historic center and business district',
  },
  'Centro Histórico': {
    displayName: 'Centro Histórico',
    description_es: 'Zócalo, Bellas Artes, turismo cultural',
    description_en: 'Zocalo, Fine Arts Palace, cultural tourism',
  },
  'Juárez': {
    displayName: 'Juárez',
    description_es: 'Colonia céntrica, mix negocios y turismo',
    description_en: 'Central neighborhood, business and tourism mix',
  },
  'Nápoles': {
    displayName: 'Nápoles',
    description_es: 'Zona de oficinas con demanda corporativa',
    description_en: 'Office zone with corporate demand',
  },
  'Tabacalera': {
    displayName: 'Tabacalera',
    description_es: 'Colonia en gentrificación, precio accesible',
    description_en: 'Gentrifying neighborhood, accessible price',
  },
  'Doctores': {
    displayName: 'Doctores',
    description_es: 'Zona céntrica emergente, turismo médico',
    description_en: 'Emerging central zone, medical tourism',
  },
  'Escandón': {
    displayName: 'Escandón',
    description_es: 'Colonia residencial en auge gastronómico',
    description_en: 'Residential neighborhood with gastronomic boom',
  },
  'San Rafael': {
    displayName: 'San Rafael',
    description_es: 'Colonia tradicional en revalorización',
    description_en: 'Traditional neighborhood being revalued',
  },
  'Narvarte': {
    displayName: 'Narvarte',
    description_es: 'Zona residencial con buena conectividad',
    description_en: 'Residential zone with good connectivity',
  },
  'Del Valle Sur': {
    displayName: 'Del Valle Sur',
    description_es: 'Zona residencial consolidada, clase media alta',
    description_en: 'Established residential zone, upper-middle class',
  },
  'Anzures': {
    displayName: 'Anzures',
    description_es: 'Zona residencial cerca de Polanco',
    description_en: 'Residential zone near Polanco',
  },

  // ── Mérida ──
  'CP 97314': {
    displayName: 'Norte de Mérida',
    description_es: 'Zona norte, desarrollos nuevos',
    description_en: 'North zone, new developments',
  },

  // ── Akumal ──
  'Bahía de Akumal': {
    displayName: 'Bahía de Akumal',
    description_es: 'Playa principal, snorkel con tortugas',
    description_en: 'Main beach, turtle snorkeling',
  },
  'Akumal Centro': {
    displayName: 'Akumal Centro',
    description_es: 'Pueblo de Akumal, servicios básicos',
    description_en: 'Akumal town, basic services',
  },
  'Zona de Resorts': {
    displayName: 'Zona de Resorts',
    description_es: 'Franja hotelera all-inclusive',
    description_en: 'All-inclusive hotel strip',
  },
  'Bahía Príncipe': {
    displayName: 'Bahía Príncipe',
    description_es: 'Complejo turístico integrado',
    description_en: 'Integrated resort complex',
  },
  'Tulum Country Club': {
    displayName: 'Tulum Country Club',
    description_es: 'Desarrollo residencial de lujo',
    description_en: 'Luxury residential development',
  },
};

/**
 * Get display info for a zone. Falls back to capitalizing the raw name.
 */
export function getZoneInfo(rawZone: string): ZoneInfo {
  const mapped = STR_ZONE_NAME_MAP[rawZone];
  if (mapped) return mapped;

  // Fallback: capitalize and clean
  const displayName = rawZone
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    displayName,
    description_es: '',
    description_en: '',
  };
}
