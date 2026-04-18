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
  currency: 'MXN';
}

export interface PropertySpecs {
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: 'departamento' | 'penthouse' | 'terreno' | 'macrolote' | 'casa';
}

export interface PropertyROI {
  projected: number;
  rentalMonthly: number;
  appreciation: number;
}

export interface PropertyFinancing {
  downPaymentMin: number;
  months: number[];
  interestRate: number;
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

export interface Property {
  id: string;
  slug: string;
  name: string;
  developer: string;
  developerSlug?: string;
  location: PropertyLocation;
  price: PropertyPrice;
  priceMax?: number;  // price ceiling (v_developments.price_max_mxn)
  specs: PropertySpecs;
  stage: PropertyStage;
  usage: PropertyUsage[];
  amenities: string[];
  images: string[];
  media?: PropertyMedia;
  roi: PropertyROI;
  financing: PropertyFinancing;
  description: PropertyDescription;
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
}
