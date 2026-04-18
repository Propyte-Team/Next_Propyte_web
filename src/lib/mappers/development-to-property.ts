import type { Property, PropertyStage, PropertyUsage, PropertyBadge } from '@/types/property';

/**
 * Raw row from `real_estate_hub.v_developments`.
 * Fields are loose — many are null in current data.
 */
export interface DevelopmentRow {
  id: string;
  slug: string;
  name: string;
  publication_title: string | null;
  // Location
  city: string | null;
  zone: string | null;
  neighborhood: string | null;
  state: string | null;
  country: string | null;
  municipality: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  zip_code: string | null;
  maps_url: string | null;
  // Proximity
  beach_distance: number | null;
  airport_name: string | null;
  airport_distance: number | null;
  // Price
  price_min_mxn: number | null;
  price_max_mxn: number | null;
  currency: string | null;
  // Meta/classification
  stage: string | null;
  property_types: string[] | null;
  usage: string[] | null;
  amenities: string[] | null;
  badge: string | null;
  featured: boolean | null;
  plaza: string | null;
  // Media + assets
  images: string[] | null;
  virtual_tour_url: string | null;
  video_url: string | null;
  brochure_url: string | null;
  masterplan: string | null;
  price_list_url: string | null;
  drive_url: string | null;
  // Inventory aggregates
  total_units: number | null;
  available_units: number | null;
  reserved_units: number | null;
  sold_units: number | null;
  // Delivery
  estimated_delivery: string | null;
  delivery_text: string | null;
  construction_progress: number | null;
  // Financials
  roi_projected: number | null;
  roi_rental_monthly: number | null;
  roi_appreciation: number | null;
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
  // Developer FK
  developer_id: string | null;
  developer_name: string | null;
  developer_slug: string | null;
  [key: string]: unknown;
}

const VALID_STAGES: ReadonlyArray<PropertyStage> = ['preventa', 'construccion', 'entrega_inmediata'];
const VALID_USAGES: ReadonlyArray<PropertyUsage> = ['residencial', 'vacacional', 'renta', 'mixto'];
const VALID_BADGES: ReadonlyArray<Exclude<PropertyBadge, null>> = ['preventa', 'nuevo', 'entrega_inmediata'];

/**
 * Maps a Supabase v_developments row to the UI Property type (kind='development').
 *
 * Note: bedrooms/bathrooms/area are 0 at the development level — those specs
 * live at the unit level (v_units). Cards hide them when 0.
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

  const inventory = {
    available: row.available_units ?? undefined,
    total: row.total_units ?? undefined,
    reserved: row.reserved_units ?? undefined,
    sold: row.sold_units ?? undefined,
  };
  const hasInventory = Object.values(inventory).some((v) => v !== undefined);

  const delivery = {
    estimated: row.estimated_delivery ?? undefined,
    text: row.delivery_text ?? undefined,
    progress: row.construction_progress ?? undefined,
  };
  const hasDelivery = Object.values(delivery).some((v) => v !== undefined);

  const assets = {
    brochure: row.brochure_url ?? undefined,
    masterplan: row.masterplan ?? undefined,
    priceList: row.price_list_url ?? undefined,
    drive: row.drive_url ?? undefined,
  };
  const hasAssets = Object.values(assets).some((v) => v !== undefined);

  return {
    id: row.id,
    slug: row.slug,
    name: row.publication_title || row.name,
    developer: row.developer_name || '',
    developerSlug: row.developer_slug || undefined,
    kind: 'development',
    location: {
      city: row.city || '',
      zone: row.zone || row.neighborhood || row.city || '',
      state: row.state || '',
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      address: row.address || '',
    },
    price: {
      mxn: row.price_min_mxn || 0,
      currency: 'MXN',
    },
    priceMax: row.price_max_mxn ?? undefined,
    specs: {
      // Developments have no single unit's specs — surfaced only for units
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
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
    inventory: hasInventory ? inventory : undefined,
    delivery: hasDelivery ? delivery : undefined,
    assets: hasAssets ? assets : undefined,
  };
}
