import type { Property, PropertyStage, PropertyUsage, PropertyBadge } from '@/types/property';

/**
 * Raw row from `real_estate_hub.v_developments`.
 * Fields are loose — many are null in current data (see debug endpoint).
 */
export interface DevelopmentRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  zone: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  price_min_mxn: number | null;
  price_max_mxn: number | null;
  stage: string | null;
  property_types: string[] | null;
  usage: string[] | null;
  amenities: string[] | null;
  images: string[] | null;
  virtual_tour_url: string | null;
  video_url: string | null;
  roi_projected: number | null;
  roi_rental_monthly: number | null;
  roi_appreciation: number | null;
  financing_down_payment: number | null;
  financing_months: number[] | null;
  financing_interest: number | null;
  description_es: string | null;
  description_en: string | null;
  badge: string | null;
  featured: boolean | null;
  created_at: string | null;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  area_min: number | null;
  developer_name: string | null;
  [key: string]: unknown;
}

const VALID_STAGES: ReadonlyArray<PropertyStage> = ['preventa', 'construccion', 'entrega_inmediata'];
const VALID_USAGES: ReadonlyArray<PropertyUsage> = ['residencial', 'vacacional', 'renta', 'mixto'];
const VALID_BADGES: ReadonlyArray<Exclude<PropertyBadge, null>> = ['preventa', 'nuevo', 'entrega_inmediata'];

/**
 * Maps a Supabase v_developments row to the UI Property type.
 * Defaults nulls to empty/zero so downstream components don't crash.
 */
export function mapDevelopmentToProperty(row: DevelopmentRow): Property {
  const stage: PropertyStage = VALID_STAGES.includes(row.stage as PropertyStage)
    ? (row.stage as PropertyStage)
    : 'preventa';

  const badge: PropertyBadge = VALID_BADGES.includes(row.badge as Exclude<PropertyBadge, null>)
    ? (row.badge as PropertyBadge)
    : null;

  const usage: PropertyUsage[] = (row.usage || [])
    .filter((u): u is string => typeof u === 'string')
    .filter((u) => VALID_USAGES.includes(u as PropertyUsage)) as PropertyUsage[];

  const firstType = (row.property_types && row.property_types[0]) || 'departamento';
  const specType: Property['specs']['type'] = ['departamento', 'penthouse', 'terreno', 'macrolote', 'casa'].includes(
    firstType
  )
    ? (firstType as Property['specs']['type'])
    : 'departamento';

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developer: row.developer_name || '',
    location: {
      city: row.city || '',
      zone: row.zone || row.city || '',
      state: row.state || '',
      lat: row.lat || 0,
      lng: row.lng || 0,
      address: row.address || '',
    },
    price: {
      mxn: row.price_min_mxn || 0,
      currency: 'MXN',
    },
    specs: {
      bedrooms: row.bedrooms_min || 0,
      bathrooms: row.bathrooms_min || 0,
      area: row.area_min || 0,
      type: specType,
    },
    stage,
    usage: usage.length > 0 ? usage : ['residencial'],
    amenities: row.amenities || [],
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
    featured: row.featured === true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}
