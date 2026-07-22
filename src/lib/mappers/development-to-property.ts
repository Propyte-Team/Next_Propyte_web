import type {
  Property,
  PropertyStage,
  PropertyUsage,
  PropertyBadge,
  PropertyPromo,
  DevelopmentType,
} from '@/types/property';

/**
 * Raw row from `real_estate_hub.v_developments`.
 * Fields are loose — many are null in current data.
 */
export interface DevelopmentRow {
  id: string;
  slug: string;
  name: string;
  publication_title: string | null;
  publication_title_en?: string | null;
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
  development_type: string | null;
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
  // Discount rollup (v_developments column 2026-05-22)
  discounted_units_count?: number | null;
  [key: string]: unknown;
}

const VALID_STAGES: ReadonlyArray<PropertyStage> = ['preventa', 'construccion', 'entrega_inmediata'];

type FaqRaw = { q?: string; a?: string; question?: string; answer?: string };
export function buildRichContent(row: Record<string, unknown>): Property['richContent'] {
  const pickStr = (k: string): string | undefined => {
    const v = row[k];
    return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
  };
  const pickFaq = (k: string): Array<{ q: string; a: string }> | undefined => {
    const raw = row[k];
    if (!Array.isArray(raw)) return undefined;
    const items = (raw as FaqRaw[])
      .map((f) => ({ q: f.q || f.question || '', a: f.a || f.answer || '' }))
      .filter((f) => f.q && f.a);
    return items.length > 0 ? items : undefined;
  };

  const features_es = pickStr('content_features_es');
  const features_en = pickStr('content_features_en');
  const location_es = pickStr('content_location_es');
  const location_en = pickStr('content_location_en');
  const lifestyle_es = pickStr('content_lifestyle_es');
  const lifestyle_en = pickStr('content_lifestyle_en');
  const editorial_es = pickStr('descripcion_editorial_es_md');
  const editorial_en = pickStr('descripcion_editorial_en_md');
  const faqs_es = pickFaq('faq_es');
  const faqs_en = pickFaq('faq_en');

  const hasAny =
    features_es || features_en || location_es || location_en ||
    lifestyle_es || lifestyle_en || editorial_es || editorial_en ||
    faqs_es || faqs_en;
  if (!hasAny) return undefined;
  return {
    features: features_es || features_en ? { es: features_es, en: features_en } : undefined,
    location: location_es || location_en ? { es: location_es, en: location_en } : undefined,
    lifestyle: lifestyle_es || lifestyle_en ? { es: lifestyle_es, en: lifestyle_en } : undefined,
    editorial: editorial_es || editorial_en ? { es: editorial_es, en: editorial_en } : undefined,
    faqs: faqs_es || faqs_en ? { es: faqs_es, en: faqs_en } : undefined,
  };
}

/**
 * Normalize raw stage values from Hub/Supabase to the canonical i18n keys.
 * El Hub a veces graba valores legacy con mayúscula/acento ("Entregado",
 * "En construcción") que no existen como keys en messages/{es,en}.json y
 * crashean tStages() server-side con MISSING_MESSAGE. Mapeamos defensivamente.
 */
function normalizeStage(raw: string | null | undefined): PropertyStage | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (VALID_STAGES.includes(lower as PropertyStage)) return lower as PropertyStage;
  if (lower === 'entregado' || lower === 'entrega inmediata') return 'entrega_inmediata';
  if (lower === 'construcción' || lower === 'en construcción' || lower === 'en construccion') return 'construccion';
  if (lower === 'pre-venta' || lower === 'pre venta') return 'preventa';
  return null;
}
const VALID_USAGES: ReadonlyArray<PropertyUsage> = ['residencial', 'vacacional', 'renta', 'mixto'];
const VALID_BADGES: ReadonlyArray<Exclude<PropertyBadge, null>> = ['preventa', 'nuevo', 'entrega_inmediata'];

/**
 * Normaliza `development_type` (texto sucio en BD: 'vertical', 'preventa',
 * 'Residencial vertical', 'mixto', etc.) al catálogo canónico. Retorna
 * `undefined` cuando no hay match → la card no muestra el chip de tipo.
 *
 * BD plan de limpieza (entregado al usuario 2026-05-20):
 *   - vertical → residencial-vertical
 *   - mixto → mixto
 *   - preventa → null (legacy stage misplaced en columna type)
 *   - Residencial vertical → residencial-vertical
 *   - RESIDENCIAL_VERTICAL → residencial-vertical (enum Zoho mayúsculas + guion bajo)
 *
 * El catálogo canónico usa guion-medio (`residencial-vertical`), pero la BD
 * trae el enum de Zoho en mayúsculas con guion bajo (`RESIDENCIAL_VERTICAL`).
 * Normalizamos `_` → `-` para que ambos formatos converjan; sin esto el valor
 * crudo llegaba a `t('developmentTypes.RESIDENCIAL_VERTICAL')`, clave inexistente
 * que next-intl devuelve como ruta literal (no lanza), mostrando
 * "DEVELOPMENTTYPES.RESIDENCIAL_VERTICAL" en la card.
 */
function normalizeDevelopmentType(raw: string | null | undefined): DevelopmentType | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase().trim().replace(/_/g, '-');
  // Direct canonical matches
  if (lower === 'residencial-vertical' || lower === 'residencial vertical' || lower === 'vertical') {
    return 'residencial-vertical';
  }
  if (lower === 'residencial-horizontal' || lower === 'residencial horizontal' || lower === 'horizontal') {
    return 'residencial-horizontal';
  }
  if (lower === 'mixto') return 'mixto';
  if (lower === 'comercial') return 'comercial';
  if (lower === 'hotelero' || lower === 'hotel') return 'hotelero';
  if (lower === 'torre-oficinas' || lower === 'torre de oficinas' || lower === 'oficinas') return 'torre-oficinas';
  if (lower === 'condominio') return 'condominio';
  if (lower === 'townhouse' || lower === 'town-house') return 'townhouse';
  if (lower === 'lotes' || lower === 'lote') return 'lotes';
  if (lower === 'macrolotes' || lower === 'macrolote') return 'macrolotes';
  // Legacy stage misplaced in type column → ignore
  return undefined;
}

/**
 * Resuelve el tipo canónico de specs desde `property_types` (texto sucio en
 * BD: "Lotes", "Terrenos", "Lote comercial") con fallback a `development_type`
 * cuando el array viene null/vacío (~95% de los rows de v_developments).
 * Sin el fallback, todo desarrollo sin property_types caía a 'departamento' —
 * bug visible en Datos Clave de desarrollos de lotes.
 */
export function resolveSpecType(
  propertyTypes: string[] | string | null | undefined,
  developmentType?: string | null,
): Property['specs']['type'] {
  const first = Array.isArray(propertyTypes) ? propertyTypes[0] : propertyTypes;
  const firstType = (first || '').toLowerCase().trim();
  if (firstType) {
    return firstType.startsWith('macrolote') || firstType.startsWith('megalote') ? 'macrolote'
      : firstType.startsWith('terreno') || firstType.startsWith('lote') ? 'terreno'
      : firstType.startsWith('penthouse') ? 'penthouse'
      : firstType.startsWith('casa') || firstType.startsWith('villa') || firstType.startsWith('townhouse') ? 'casa'
      : 'departamento';
  }
  switch (normalizeDevelopmentType(developmentType)) {
    case 'lotes': return 'terreno';
    case 'macrolotes': return 'macrolote';
    case 'residencial-horizontal':
    case 'townhouse': return 'casa';
    default: return 'departamento';
  }
}

/**
 * Maps a Supabase v_developments row to the UI Property type (kind='development').
 *
 * Note: bedrooms/bathrooms/area are 0 at the development level — those specs
 * live at the unit level (v_units). Cards hide them when 0.
 */
export function mapDevelopmentToProperty(row: DevelopmentRow, locale?: string): Property {
  const stage: PropertyStage = normalizeStage(row.stage) ?? 'preventa';

  const badge: PropertyBadge = VALID_BADGES.includes(row.badge as Exclude<PropertyBadge, null>)
    ? (row.badge as PropertyBadge)
    : null;

  const usage: PropertyUsage[] = (row.usage || [])
    .filter((u): u is string => typeof u === 'string')
    .filter((u) => VALID_USAGES.includes(u as PropertyUsage)) as PropertyUsage[];

  const specType = resolveSpecType(row.property_types, row.development_type);

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

  // Promo / discount fields are optional in v_developments — read defensively.
  // When Supabase doesn't have these columns, the card simply doesn't render them.
  // Number() defensive: Supabase NUMERIC se serializa como string.
  const priceOriginalNum = Number(row.price_original_mxn);
  const priceOriginal = Number.isFinite(priceOriginalNum) && priceOriginalNum > 0
    ? priceOriginalNum
    : undefined;

  const promoTextEs = typeof row.promo_text_es === 'string' ? row.promo_text_es.trim() : '';
  const promoTextEn = typeof row.promo_text_en === 'string' ? row.promo_text_en.trim() : '';
  const promoValidUntil = typeof row.promo_valid_until === 'string' ? row.promo_valid_until : undefined;
  // Filter expired promos server-side so client cards don't need impure Date.now() in render.
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
    name: (locale === 'en' && row.publication_title_en) || row.publication_title || row.name,
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
      currency: (row.currency || 'MXN').toUpperCase() === 'USD' ? 'USD' : 'MXN',
    },
    priceMax: row.price_max_mxn ?? undefined,
    developmentType: normalizeDevelopmentType(row.development_type as string | null | undefined),
    bedroomsMin: typeof row.bedrooms_min === 'number' && row.bedrooms_min > 0 ? row.bedrooms_min : undefined,
    bedroomsMax: typeof row.bedrooms_max === 'number' && row.bedrooms_max > 0 ? row.bedrooms_max : undefined,
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
    richContent: buildRichContent(row),
    badge,
    featured: row.featured === true,
    createdAt: row.created_at || new Date().toISOString(),
    inventory: hasInventory ? inventory : undefined,
    delivery: hasDelivery ? delivery : undefined,
    assets: hasAssets ? assets : undefined,
    priceOriginal,
    promo,
    discountedUnitsCount: typeof row.discounted_units_count === 'number' && row.discounted_units_count > 0
      ? row.discounted_units_count
      : undefined,
  };
}
