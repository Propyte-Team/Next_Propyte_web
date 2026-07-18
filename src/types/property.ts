export interface PropertyLocation {
  city: string;
  zone: string;
  state: string;
  lat: number | null;
  lng: number | null;
  address: string;
}

export interface PropertyPrice {
  mxn: number;
  /** Moneda en la que el desarrollo/unidad está dada de alta. UI debe mostrarla
   *  junto al monto: "$9,500,000 MXN" o "$450,000 USD". */
  currency: 'MXN' | 'USD';
  /** Cuando currency='USD', el monto original en USD (price.mxn igual lleva
   *  el valor en MXN para sorting/filtering consistente).
   *  Cuando currency='MXN', es undefined. */
  usd?: number;
}

export interface PropertySpecs {
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: 'departamento' | 'penthouse' | 'terreno' | 'macrolote' | 'casa';
  tipoEntrega?: string | null;
}

export interface PropertyROI {
  projected: number;
  rentalMonthly: number;
  appreciation: number;
}

export interface PropertyFinancing {
  downPaymentMin: number;   // % enganche efectivo (fin_enganche_pct)
  months: number[];         // opciones de plazo (fin_meses_opciones)
  interestRate: number;     // tasa anual efectiva (fin_tasa)
  /** true si hay financiamiento directo del desarrollador (gate de la corrida) */
  directo?: boolean;
  /** nota libre del plazo, ej. "Hasta entrega de obra" */
  mesesNota?: string;
  /** esquema de pago descriptivo */
  esquema?: string;
  aceptaHipotecario?: boolean;
  aceptaInfonavit?: boolean;
  aceptaFovissste?: boolean;
  /** Esquemas de pago (v2). Si vacío, el UI usa el fallback derivado del config plano. */
  esquemas?: import('@/lib/esquemas-pago').EsquemaPago[];
}

export interface PropertyDescription {
  es: string;
  en: string;
}

export type PropertyStage = 'preventa' | 'construccion' | 'entrega_inmediata';
export type PropertyUsage = 'residencial' | 'vacacional' | 'renta' | 'mixto';
export type PropertyBadge =
  | 'preventa'
  | 'nuevo'
  | 'construccion'
  | 'entrega_inmediata'
  | 'proximamente'
  | 'reservado'
  | 'vendido'
  | null;

export interface PropertyMedia {
  virtualTour?: string;   // URL to 360° tour (Matterport, Kuula, etc.)
  video?: string;         // YouTube/Vimeo embed URL
}

export type PropertyKind = 'development' | 'unit';

/** Tipos canónicos de desarrollo según Manual de Identidad Propyte + Hub form. */
export type DevelopmentType =
  | 'residencial-vertical'
  | 'residencial-horizontal'
  | 'mixto'
  | 'comercial'
  | 'hotelero'
  | 'torre-oficinas'
  | 'condominio'
  | 'townhouse'
  | 'lotes'
  | 'macrolotes';

export interface PropertyInventory {
  available?: number;
  total?: number;
  reserved?: number;
  sold?: number;
}

export interface PropertyDelivery {
  estimated?: string;   // ISO date or quarter string
  text?: string;        // free-form, e.g. "Q3 2027"
  progress?: number;    // 0-100, construction progress
}

export interface PropertyAssets {
  brochure?: string;    // PDF url
  masterplan?: string;  // image url
  priceList?: string;   // PDF url
  drive?: string;       // Google Drive folder
}

export interface PropertyPromo {
  /** Short banner copy. Bilingual via _es/_en, falls back to es when en missing. */
  textEs: string;
  textEn?: string;
  /** ISO date — banner hides automatically after this. */
  validUntil?: string;
}

/**
 * Descuento activo sobre una unidad. Source: real_estate_hub.v_units.discount_*.
 * Server-side filtra vigencia (descuento_valid_until ≥ today). El cliente sólo
 * decide cómo render (badge %, line-through brand cyan).
 *
 * Para kind='development', `discount` no se setea; en su lugar
 * `discountedUnitsCount` indica cuántas unidades hijas tienen descuento activo.
 */
export interface PropertyDiscount {
  /** Precio post-descuento en MXN (lo que paga el cliente). */
  priceMxn: number;
  /** % descuento, redondeado a 1 decimal. Calculado en BD vía GENERATED column. */
  pct: number;
  /** ISO date. Undefined = sin expiración. */
  validUntil?: string;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  developer: string;
  developerSlug?: string;
  location: PropertyLocation;
  price: PropertyPrice;
  priceMax?: number;  // price ceiling (v_developments.price_max_mxn) en MXN
  priceMaxUsd?: number;  // price ceiling en USD cuando currency='USD'
  specs: PropertySpecs;
  /**
   * Catálogo canónico de tipo de desarrollo (Manual de Identidad Propyte +
   * Hub form). Solo aplica a kind='development'. Valores: 'residencial-vertical',
   * 'residencial-horizontal', 'mixto', 'comercial', 'hotelero', 'torre-oficinas',
   * 'condominio', 'townhouse', 'lotes', 'macrolotes'. Mapeo se hace en
   * `mapDevelopmentToProperty` para tolerar legacy/dirty values en BD.
   */
  developmentType?: DevelopmentType;
  /** Rango de recámaras agregado desde v_units (kind='development' only). */
  bedroomsMin?: number;
  bedroomsMax?: number;
  stage: PropertyStage;
  usage: PropertyUsage[];
  amenities: string[];
  images: string[];
  media?: PropertyMedia;
  roi: PropertyROI;
  financing: PropertyFinancing;
  description: PropertyDescription;
  /**
   * Contenido editorial extendido (bodies de features/location/lifestyle + FAQs).
   * Vienen del JSON ext_content_{es,en} en BD. Cuando existen, agregan
   * 500-3000 chars de copy estructurado al tab Descripción.
   */
  richContent?: {
    features?: { es?: string; en?: string };
    location?: { es?: string; en?: string };
    lifestyle?: { es?: string; en?: string };
    /** Consolidated long-form editorial content as Markdown (replaces features/location/lifestyle). */
    editorial?: { es?: string; en?: string };
    faqs?: { es?: Array<{ q: string; a: string }>; en?: Array<{ q: string; a: string }> };
  };
  badge: PropertyBadge;
  featured: boolean;
  createdAt: string;
  // Kind discriminator (development aggregate vs single unit)
  kind?: PropertyKind;
  // Development-only (aggregates). For units these are always undefined.
  inventory?: PropertyInventory;
  delivery?: PropertyDelivery;
  assets?: PropertyAssets;
  // Unit-only: link to parent development
  parentDevelopmentSlug?: string;
  parentDevelopmentName?: string;
  // Financial metrics from development_financials (optional, enriched at listing level)
  capRate?: number;
  annualRevenue?: number;
  // Promo / discount surface — optional, only set when Supabase has explicit promo data
  /** Pre-discount price; rendered as strikethrough when greater than `price.mxn`. */
  priceOriginal?: number;
  /** Promotional banner shown over the card image. */
  promo?: PropertyPromo;
  /**
   * Sistema de descuentos (2026-05-22). Unit-only: cuando está set,
   * `price.mxn` ya es el precio post-descuento y `priceOriginal` viene del
   * mapper como precio de lista (precio_mxn). Solo aplica a kind='unit'.
   */
  discount?: PropertyDiscount;
  /**
   * Development-only rollup: cuántas unidades hijas tienen descuento activo.
   * Usado para mostrar badge "Propiedades con descuento" en card de desarrollo.
   */
  discountedUnitsCount?: number;
}
