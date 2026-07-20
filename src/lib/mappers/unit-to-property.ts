import type { Property, PropertyStage, PropertyUsage, PropertyBadge, PropertyPromo, PropertyDiscount } from '@/types/property';
import { parseEsquemas, type EsquemaPago } from '@/lib/esquemas-pago';
import { parsePreventa } from '@/lib/preventa';

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
  /** v_units expone `title` (editorial ES) y `title_en` (editorial EN). */
  title?: string | null;
  title_en?: string | null;
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
  // Discount (v_units columns 2026-05-22)
  discount_price_mxn?: number | string | null;
  discount_pct?: number | string | null;
  discount_valid_until?: string | null;
  is_discount_active?: boolean | null;
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
  tipo_entrega: string | null;    // obra gris/con acabados/equipada/amueblada/llave en mano (v_units aún no lo expone → null)
  /** v_units column real: 'preventa' | 'disponible' | 'construccion' | etc.
   *  Reemplaza el `stage` y `availability_status` legacy. */
  status: string | null;
  /** Flag explícito de pre-venta. Cuando true forza stage='preventa'. */
  is_presale: boolean | null;
  usage: string[] | null;
  /** @deprecated v_units ya no expone esta columna — usar `status` */
  availability_status?: string | null;
  /** @deprecated v_units ya no expone esta columna — usar `status` */
  stage?: string | null;
  // Media
  images: string[] | null;
  virtual_tour_url: string | null;
  video_url: string | null;
  // Financials — nombres REALES de v_units (verificado en information_schema
  // 2026-07-16). Antes se leían roi_projected / roi_rental_monthly /
  // roi_appreciation / cap_rate / annual_revenue / financing_* que NO EXISTEN
  // en la vista → siempre undefined (apreciación caía al 8% hardcodeado y el
  // cap rate a null para el 100% de las unidades).
  roi_annual: number | string | null;
  estimated_rent_mxn: number | string | null;
  appreciation_annual: number | string | null;
  // Financiamiento efectivo (override unidad o herencia del desarrollo) — v_units fin_*
  fin_directo: boolean | null;
  fin_hipotecario: boolean | null;
  fin_infonavit: boolean | null;
  fin_fovissste: boolean | null;
  fin_enganche_pct: number | string | null;
  fin_meses_opciones: number[] | null;
  fin_meses_nota: string | null;
  fin_tasa: number | string | null;
  fin_esquema: string | null;
  fin_esquemas_pago: unknown;
  /** JSONB config de preventa (merge dev/unidad en v_units). Puede no existir aun. */
  fin_preventa?: unknown;
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

/**
 * Normaliza `unit_type` (texto sucio de Zoho/BD: "Terreno", "Lote residencial",
 * "Macrolote", "Departamento", etc.) al union canónico de `specs.type`.
 * Bug 2026-06-16: el match anterior era `['terreno',...].includes(row.unit_type)`
 * case-sensitive → "Terreno" caía a 'departamento' → lotes mostraban "Apartment".
 */
function normalizeUnitType(raw: string | null | undefined): Property['specs']['type'] {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return 'departamento';
  if (lower.startsWith('macrolote') || lower.startsWith('megalote')) return 'macrolote';
  if (lower.startsWith('terreno') || lower.startsWith('lote')) return 'terreno';
  if (lower.startsWith('penthouse')) return 'penthouse';
  if (lower.startsWith('casa') || lower.startsWith('villa') || lower.startsWith('townhouse')) return 'casa';
  return 'departamento';
}

/**
 * Construye richContent leyendo los campos JSON expuestos por v_units:
 * content_features_es/en, content_location_es/en, content_lifestyle_es/en, faq_es/en.
 * Solo retorna undefined si NO existe ninguno (evita objetos vacíos).
 */
type FaqRaw = { q?: string; a?: string; question?: string; answer?: string };
function buildRichContent(row: Record<string, unknown>): Property['richContent'] {
  const pickStr = (k: string): string | undefined => {
    const v = row[k];
    return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
  };
  const pickFaq = (k: string): Array<{ q: string; a: string }> | undefined => {
    const raw = row[k];
    if (!Array.isArray(raw)) return undefined;
    const items = (raw as FaqRaw[])
      .map((f) => ({
        q: f.q || f.question || '',
        a: f.a || f.answer || '',
      }))
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
function buildFallbackEsquemas(
  directo: boolean, engPct: number, mesesOpts: number[], tasa: number,
): EsquemaPago[] {
  const terms = mesesOpts.filter((m) => Number(m) > 0);
  if (!directo && terms.length === 0 && engPct <= 0) return [];
  if (terms.length === 0) {
    return [{ id: 'v1_0', label: 'Financiamiento', label_en: 'Financing', enganche_pct: engPct, meses: 0, tasa, descuento_pct: 0, orden: 0 }];
  }
  return terms.map((m, i) => ({
    id: `v1_${m}`, label: `Financiamiento ${m} meses`, label_en: `Financing ${m} months`, enganche_pct: engPct, meses: m, tasa, descuento_pct: 0, orden: i,
  }));
}

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
export function mapUnitToProperty(row: UnitRow, locale?: string): Property {
  // v_units NO expone `stage` ni `availability_status` — usar `status` +
  // `is_presale`. Fix bug 2026-05-20: el mapper antiguo caía a 'preventa'
  // como fallback cuando row.stage venía undefined → TODAS las unidades
  // mostraban badge "PREVENTA" aunque status fuera 'disponible'.
  const statusRaw = (row.status || '').toLowerCase().trim();
  const stage: PropertyStage = row.is_presale === true || statusRaw === 'preventa'
    ? 'preventa'
    : statusRaw === 'construccion' || statusRaw === 'construcción'
      ? 'construccion'
      : 'entrega_inmediata';

  const usage: PropertyUsage[] = (row.usage || [])
    .filter((u): u is string => typeof u === 'string')
    .filter((u) => VALID_USAGES.includes(u as PropertyUsage)) as PropertyUsage[];

  const specType: Property['specs']['type'] = normalizeUnitType(row.unit_type);

  // Availability → badge. AVAILABILITY_TO_BADGE solo aplica para 'reservado'/
  // 'vendido' (visualización). 'disponible' no necesita badge — el stage ya
  // comunica el estado de la unidad.
  const badge: PropertyBadge = AVAILABILITY_TO_BADGE[statusRaw] ?? null;

  // Promo (banner) — legacy, sigue funcionando si Hub llena los campos.
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

  // ─── Sistema de descuentos (2026-05-22) ────────────────────────────────
  // Source: v_units columns discount_price_mxn + discount_pct + discount_valid_until.
  // v_units.is_discount_active ya filtra vigencia + monto válido. Si está activo,
  // exponemos `discount` y reescribimos price.mxn al precio post-descuento +
  // priceOriginal al precio de lista — así el render (strikethrough + badge)
  // funciona en un único componente sin condicionales en cards.
  const discountPriceRaw = row.discount_price_mxn;
  const discountPctRaw = row.discount_pct;
  const isDiscountActive = row.is_discount_active === true;
  const discountPrice = typeof discountPriceRaw === 'number' && discountPriceRaw > 0
    ? discountPriceRaw
    : Number(discountPriceRaw) > 0 ? Number(discountPriceRaw) : null;
  const discountPct = typeof discountPctRaw === 'number' && discountPctRaw > 0
    ? discountPctRaw
    : Number(discountPctRaw) > 0 ? Number(discountPctRaw) : null;
  const discount: PropertyDiscount | undefined = isDiscountActive && discountPrice && discountPct
    ? {
        priceMxn: discountPrice,
        pct: discountPct,
        validUntil: typeof row.discount_valid_until === 'string' ? row.discount_valid_until : undefined,
      }
    : undefined;

  // priceOriginal: cuando hay descuento, el "precio de lista" (precio_mxn) es
  // el precio original tachado. Sin descuento, se respeta el legacy `priceOriginal`
  // (siempre undefined porque la columna no existe — defensive).
  // IMPORTANTE: Supabase NUMERIC se serializa como STRING (memoria
  // feedback_v_units_idiosyncrasies). `typeof === 'number'` falla → Number() defensive.
  const priceListMxnNum = Number(row.price_mxn);
  const priceListMxn = Number.isFinite(priceListMxnNum) && priceListMxnNum > 0 ? priceListMxnNum : null;
  const priceOriginalNum = Number(row.price_original_mxn);
  const priceOriginal = discount && priceListMxn
    ? priceListMxn
    : Number.isFinite(priceOriginalNum) && priceOriginalNum > 0
      ? priceOriginalNum
      : undefined;

  const esquemasReales = parseEsquemas(row.fin_esquemas_pago);
  const esquemas: EsquemaPago[] = esquemasReales.length > 0
    ? esquemasReales
    : buildFallbackEsquemas(
        row.fin_directo === true,
        Number(row.fin_enganche_pct) || 0,
        Array.isArray(row.fin_meses_opciones) ? row.fin_meses_opciones : [],
        Number(row.fin_tasa) || 0,
      );

  return {
    id: row.id,
    slug: row.slug,
    // v_units expone `title` (no `name`). Si Marketing llenó titulo_unidad en Hub,
    // ese es el título editorial y gana. Solo si no hay título personalizado caemos al
    // fallback "<development_name> — <unit_number>".
    name: (() => {
      // En inglés prefiere el título editorial EN (title_en), con fallback al
      // editorial ES (title/name) si está vacío. Nunca rompe los listados ES.
      const editorialEn = locale === 'en' ? (row.title_en as string | null) : null;
      const editorial = editorialEn || (row.title as string | null) || (row.name as string | null);
      if (editorial) return editorial;
      const fallbackBase = row.development_name || row.slug || 'Propiedad';
      return row.unit_number ? `${fallbackBase} — ${row.unit_number}` : fallbackBase;
    })(),
    developer: row.developer_name || '',
    kind: 'unit',
    parentDevelopmentSlug: row.development_slug || undefined,
    parentDevelopmentName: row.development_name || undefined,
    location: {
      city: row.city || '',
      zone: row.zone || row.neighborhood || row.city || '',
      state: row.state || '',
      // Supabase JS serializa NUMERIC como string para preservar precisión.
      // Google Maps requiere number; coerción explícita evita crash en
      // <Map defaultCenter={{lat, lng}}>. Tras migration 013, v_units expone
      // lat/lng (antes era undefined → null), entonces esta coerción es
      // requisito para que rendere la sección de mapa.
      lat: row.lat != null ? Number(row.lat) : null,
      lng: row.lng != null ? Number(row.lng) : null,
      address: row.address || '',
    },
    price: {
      // Con discount activo: price.mxn = precio post-descuento (lo que paga el
      // cliente). priceOriginal abajo lleva el precio_mxn de lista para tachado.
      // Sin discount: price.mxn = precio_mxn directo. Number() defensive por
      // NUMERIC-as-string de Supabase.
      mxn: discount ? discount.priceMxn : (Number(row.price_mxn) || 0),
      currency: (row.currency || 'MXN').toUpperCase() === 'USD' ? 'USD' : 'MXN',
      usd: Number(row.price_usd) > 0 ? Number(row.price_usd) : undefined,
    },
    specs: {
      bedrooms: row.bedrooms || 0,
      bathrooms: (row.bathrooms || 0) + (row.half_baths || 0) * 0.5,
      area: row.area_m2 || row.lot_area_m2 || 0,
      type: specType,
      tipoEntrega: row.tipo_entrega ?? null,
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
      projected: Number(row.roi_annual) || 0,
      rentalMonthly: Number(row.estimated_rent_mxn) || 0,
      appreciation: Number(row.appreciation_annual) || 0,
    },
    financing: {
      downPaymentMin: Number(row.fin_enganche_pct) || 0,
      months:
        Array.isArray(row.fin_meses_opciones) && row.fin_meses_opciones.length > 0
          ? row.fin_meses_opciones
          : [60, 120, 180, 240],
      interestRate: Number(row.fin_tasa) || 0,
      directo: row.fin_directo === true,
      mesesNota: row.fin_meses_nota || undefined,
      esquema: row.fin_esquema || undefined,
      aceptaHipotecario: row.fin_hipotecario === true,
      aceptaInfonavit: row.fin_infonavit === true,
      aceptaFovissste: row.fin_fovissste === true,
      esquemas,
      // fin_preventa puede no existir aun en v_units (llega con el DDL del Hub); parsePreventa tolera undefined -> null.
      preventa: parsePreventa(row.fin_preventa),
    },
    description: {
      es: row.description_es || '',
      en: row.description_en || '',
    },
    richContent: buildRichContent(row),
    badge,
    featured: false,
    createdAt: row.created_at || new Date().toISOString(),
    // cap_rate / annual_revenue NO existen en v_units. El cap rate se calcula
    // en vivo en el simulador; quedan undefined hasta exponerse (ver Fase 3).
    capRate: undefined,
    annualRevenue: undefined,
    priceOriginal,
    promo,
    discount,
  };
}
