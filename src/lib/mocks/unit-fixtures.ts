import type { UnitRow } from '@/lib/mappers/unit-to-property';

/**
 * Unit fixtures for development while v_units is empty in Supabase.
 * Each fixture mirrors the UnitRow shape returned by `real_estate_hub.v_units`.
 * Delete this file or gate with NODE_ENV when Luis populates v_units.
 */
const FIXTURES: Record<string, UnitRow> = {
  'akora-a301-cancun': {
    id: 'mock-unit-akora-a301',
    slug: 'akora-a301-cancun',
    name: 'Akora Residencial',
    unit_number: 'A-301',
    development_id: 'mock-dev-akora',
    development_slug: 'akora-residencial-b73b319b',
    development_name: 'Akora Residencial',
    city: 'Cancun',
    zone: 'Puerto Cancún',
    neighborhood: 'Puerto Cancún',
    state: 'Quintana Roo',
    lat: 21.1743,
    lng: -86.8466,
    address: 'Blvd. Kukulcán km 10, Puerto Cancún',
    price_mxn: 8_950_000,
    price_usd: null,
    currency: 'MXN',
    bedrooms: 2,
    bathrooms: 2,
    half_baths: 1,
    area_m2: 124,
    lot_area_m2: null,
    parking: 2,
    floor: 3,
    unit_type: 'departamento',
    stage: 'preventa',
    usage: ['residencial', 'vacacional'],
    availability_status: 'disponible',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80',
      'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=1600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80',
    ],
    virtual_tour_url: null,
    video_url: null,
    roi_projected: 12.4,
    roi_rental_monthly: 48_000,
    roi_appreciation: 8,
    cap_rate: 6.4,
    annual_revenue: 576_000,
    financing_down_payment: 20,
    financing_months: [60, 120, 180, 240],
    financing_interest: 9.5,
    description_es: 'Departamento con acabados premium en torre frente a la marina. Vista panorámica al mar, balcón amplio, cocina equipada y acceso directo a amenidades del desarrollo: alberca infinity, gym, spa y roof garden con terraza social. Puerto Cancún es la zona de mayor plusvalía en la Riviera Maya con acceso controlado 24/7 y club de golf privado.',
    description_en: 'Premium apartment in marina-front tower. Panoramic ocean view, spacious balcony, equipped kitchen, and direct access to development amenities: infinity pool, gym, spa, and rooftop lounge. Puerto Cancún is the highest-appreciation zone in the Riviera Maya with 24/7 gated access and a private golf club.',
    created_at: '2025-08-15T00:00:00Z',
    updated_at: '2026-04-10T00:00:00Z',
    approved_at: '2025-09-01T00:00:00Z',
    zoho_pipeline_status: 'published',
    developer_name: 'Grupo Akora',
  },
  'nativa-jungla-t12-tulum': {
    id: 'mock-unit-nativa-t12',
    slug: 'nativa-jungla-t12-tulum',
    name: 'Nativa Jungla',
    unit_number: 'T-12',
    development_id: 'mock-dev-nativa',
    development_slug: 'nativa-jungla',
    development_name: 'Nativa Jungla',
    city: 'Tulum',
    zone: 'Aldea Zamá',
    neighborhood: 'Aldea Zamá',
    state: 'Quintana Roo',
    lat: 20.2119,
    lng: -87.4655,
    address: 'Aldea Zamá, Tulum',
    price_mxn: 5_450_000,
    price_usd: null,
    currency: 'MXN',
    bedrooms: 1,
    bathrooms: 1,
    half_baths: 0,
    area_m2: 78,
    lot_area_m2: null,
    parking: 1,
    floor: 2,
    unit_type: 'departamento',
    stage: 'construccion',
    usage: ['vacacional', 'residencial'],
    availability_status: 'disponible',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80',
    ],
    virtual_tour_url: null,
    video_url: null,
    roi_projected: 14.8,
    roi_rental_monthly: 42_000,
    roi_appreciation: 11,
    cap_rate: 7.1,
    annual_revenue: 504_000,
    financing_down_payment: 30,
    financing_months: [48, 96, 120],
    financing_interest: 10,
    description_es: 'Departamento tipo loft en desarrollo eco-lujo en la selva de Aldea Zamá. Diseño biofílico, acabados artesanales, alberca privada y acceso a rooftop con cenote y bar. Vista a palapa jardín y selva nativa.',
    description_en: 'Loft-style apartment in eco-luxury development in Aldea Zamá jungle. Biophilic design, artisan finishes, private pool, and access to a rooftop with cenote and bar. Palapa garden and native jungle views.',
    created_at: '2025-11-01T00:00:00Z',
    updated_at: '2026-04-12T00:00:00Z',
    approved_at: '2025-12-10T00:00:00Z',
    zoho_pipeline_status: 'published',
    developer_name: 'Nativa Desarrollos',
  },
  'playacar-residencias-b205-playa-del-carmen': {
    id: 'mock-unit-playacar-b205',
    slug: 'playacar-residencias-b205-playa-del-carmen',
    name: 'Playacar Residencias',
    unit_number: 'B-205',
    development_id: 'mock-dev-playacar',
    development_slug: 'playacar-residencias',
    development_name: 'Playacar Residencias',
    city: 'Playa del Carmen',
    zone: 'Playacar',
    neighborhood: 'Playacar Fase 2',
    state: 'Quintana Roo',
    lat: 20.6194,
    lng: -87.0739,
    address: 'Playacar Fase 2, Playa del Carmen',
    price_mxn: 6_800_000,
    price_usd: null,
    currency: 'MXN',
    bedrooms: 2,
    bathrooms: 2,
    half_baths: 0,
    area_m2: 95,
    lot_area_m2: null,
    parking: 1,
    floor: 2,
    unit_type: 'departamento',
    stage: 'entrega_inmediata',
    usage: ['residencial', 'vacacional'],
    availability_status: 'disponible',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1600&q=80',
    ],
    virtual_tour_url: null,
    video_url: null,
    roi_projected: 11.6,
    roi_rental_monthly: 38_000,
    roi_appreciation: 7,
    cap_rate: 5.9,
    annual_revenue: 456_000,
    financing_down_payment: 25,
    financing_months: [60, 120, 180],
    financing_interest: 9.5,
    description_es: 'Residencia en Playacar Fase 2, a 5 minutos caminando de la playa. Club de playa privado, campo de golf, seguridad 24/7 y acceso a Quinta Avenida. Ideal para renta vacacional con alta demanda todo el año.',
    description_en: 'Residence in Playacar Fase 2, 5-minute walk to the beach. Private beach club, golf course, 24/7 security, and access to Quinta Avenida. Ideal for vacation rental with year-round high demand.',
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2026-04-08T00:00:00Z',
    approved_at: '2025-07-15T00:00:00Z',
    zoho_pipeline_status: 'published',
    developer_name: 'Grupo Playacar',
  },
};

export const MOCK_UNIT_SLUGS = Object.keys(FIXTURES);

export function getMockUnit(slug: string): UnitRow | null {
  return FIXTURES[slug] ?? null;
}

export function getAllMockUnits(): UnitRow[] {
  return Object.values(FIXTURES);
}

export function getSimilarMockUnits(currentSlug: string, city?: string, limit = 4): UnitRow[] {
  return Object.values(FIXTURES)
    .filter((u) => u.slug !== currentSlug)
    .sort((a, b) => {
      if (city) {
        const aMatch = a.city === city ? 1 : 0;
        const bMatch = b.city === city ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      return 0;
    })
    .slice(0, limit);
}
