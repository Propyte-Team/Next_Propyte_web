export interface PropertyLocation {
  city: string;
  zone: string;
  state: string;
  lat: number;
  lng: number;
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
export type PropertyBadge = 'preventa' | 'nuevo' | 'entrega_inmediata' | null;

export interface PropertyMedia {
  virtualTour?: string;   // URL to 360° tour (Matterport, Kuula, etc.)
  video?: string;         // YouTube/Vimeo embed URL
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  developer: string;
  location: PropertyLocation;
  price: PropertyPrice;
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
  // Financial metrics from development_financials (optional, enriched at listing level)
  capRate?: number;
  annualRevenue?: number;
}
