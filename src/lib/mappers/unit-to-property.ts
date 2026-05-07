import type { Property, PropertyStage, PropertyUsage, PropertyBadge, PropertyPromo } from '@/types/property';

/**
 * Raw row from `real_estate_hub.v_units`.
 * Maps WP plugin field names (see class-propyte-sync-manager.php).
 *
 * v_units está vacía en Supabase al 2026-04-18 — mapper listo para
 * cuando se llene desde Zoho → Supabase sync.
 */
export interface UnitRow {
  id: string;
  slug: string;
  name: string;
  unit_number: string | null;
  // Parent development FK
  development_id: string | null;
  development_slug: string | null;
  development_name: string | null;
  // Location (inherited from parent — may be on v_units or joined)
  city: string | null;
  zone: string | null;
  neighborhood: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  // Price
  price_mxn: number | null;
  price_usd: number | null;
  currency: string | null;
  // Unit-specific specs (THIS is the key difference vs v_developments)
  bedrooms: number | null;
  bathrooms: number | null;
  half_baths: number | null;
  area_m2: number | null;
  lot_area_m2: number | null;
  parking: number | null;
  floor: number | null;
  // Classification
  unit_type: string | null;       // departamento, penthouse, casa, terreno
  stage: string | null;
  usage: string[] | null;
  availability_status: string | null;  // disponible, reservado, vendido
  // Media
  images: string[] | null;
  virtual_tour_url: string | null;
  video_url: string | null;
  // Financials
  roi_projected: number | null;
  roi_rental_monthly: number | null;
  roi_appreciation: number | null;
  cap_rate: number | null;
  annual_revenue: number | null;
  financing_down_payment: number | null;
  financing_months: number[] | null;
  financing_interest: number | null;
  // Copy
  description_es: string | null;
  description_en: string | null;
  // Workflow
  created_at: string | null;
  updated_at: string | null;
  approved_at: string | null;
  zoho_pipeline_status: string | null;
  // Developer info (from dev join)
  developer_name: string | null;
  [key: string]: unknown;
}

const VALID_STAGES: ReadonlyArray<PropertyStage> = ['preventa', 'construccion', 'entrega_inmediata'];
const VALID_USAGES: ReadonlyArray<PropertyUsage> = ['residencial', 'vacacional', 'renta', 'mixto'];
const AVAILABILITY_TO_BADGE: Record<string, Exclude<PropertyBadge, null>> = {
  disponible: 'nuevo',
  reservado: 'reservado',
  vendido: 'vendido',
};

/**
 * Maps a Supabase v_units row to the UI Property type (kind='unit').
 *
 * Unit-level specs (bedrooms/bathrooms/area) are real values here (unlike
 * development aggregates which default to 0). Links back to parent
 * development via parentDevelopmentSlug for the "View development" CTA.
 */
export function mapUnitToProperty(row: UnitRow): Property {
  const stage: PropertyStage = VALID_STAGES.includes(row.stage as PropertyStage)
    ? (row.stage as PropertyStage)
    : 'preventa';

  const usage: PropertyUsage[] = (row.usage || [])
    .filter((u): u is string => typeof u === 'string')
    .filter((u) => VALID_USAGES.includes(u as PropertyUsage)) as PropertyUsage[];

  const specType: Property['specs']['type'] = ['departamento', 'penthouse', 'terreno', 'macrolote', 'casa'].includes(
    row.unit_type || ''
  )
    ? (row.unit_type as Property['specs']['type'])
    : 'departamento';

  // Availability → badge
  const statusKey = (row.availability_status || '').toLowerCase();
  const badge: PropertyBadge = AVAILABILITY_TO_BADGE[statusKey] ?? null;

  // Promo / discount fields are optional in v_units — read defensively.
  const priceOriginalRaw = row.price_original_mxn;
  const priceOriginal = typeof priceOriginalRaw === 'number' && priceOriginalRaw > 0
    ? priceOriginalRaw
    : undefined;

  const promoTextEs = typeof row.promo_text_es === 'string' ? row.promo_text_es.trim() : '';
  const promoTextEn = typeof row.promo_text_en === 'string' ? row.promo_text_en.trim() : '';
  const promoValidUntil = typeof row.promo_valid_until === 'string' ? row.promo_valid_until : undefined;
  const promoExpired = promoValidUntil
    ? new Date(promoValidUntil).getTime() < Date.now()
    : false;
  const promo: PropertyPromo | undefined = promoTextEs && !promoExpired
    ? {
        textEs: promoTextEs,
        textEn: promoTextEn || undefined,
        validUntil: promoValidUntil,
      }
    : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.unit_number ? `${row.development_name || row.name} — ${row.unit_number}` : row.name,
    developer: row.developer_name || '',
    kind: 'unit',
    parentDevelopmentSlug: row.development_slug || undefined,
    parentDevelopmentName: row.development_name || undefined,
    location: {
      city: row.city || '',
      zone: row.zone || row.neighborhood || row.city || '',
      state: row.state || '',
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      address: row.address || '',
    },
    price: {
      mxn: row.price_mxn || 0,
      currency: 'MXN',
    },
    specs: {
      bedrooms: row.bedrooms || 0,
      bathrooms: (row.bathrooms || 0) + (row.half_baths || 0) * 0.5,
      area: row.area_m2 || row.lot_area_m2 || 0,
      type: specType,
    },
    stage,
    usage: usage.length > 0 ? usage : ['residencial'],
    amenities: [],
    images: (row.images || []).filter((img): img is string => typeof img === 'string'),
    media: {
      virtualTour: row.virtual_tour_url || undefined,
      video: row.video_url || undefined,
    },
    roi: {
      projected: row.roi_projected || 0,
      rentalMonthly: row.roi_rental_monthly || 0,
      appreciation: row.roi_appreciation || 0,
    },
    financing: {
      downPaymentMin: row.financing_down_payment || 0,
      months: row.financing_months || [60, 120, 180, 240],
      interestRate: row.financing_interest || 0,
    },
    description: {
      es: row.description_es || '',
      en: row.description_en || '',
    },
    badge,
    featured: false,
    createdAt: row.created_at || new Date().toISOString(),
    capRate: row.cap_rate ?? undefined,
    annualRevenue: row.annual_revenue ?? undefined,
    priceOriginal,
    promo,
  };
}
