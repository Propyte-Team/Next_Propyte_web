// Datos que la home v3 recibe ya preparados desde el servidor (page.tsx), para
// no mandar al cliente las filas completas de v_developments.

export type StageKey = 'presale' | 'construction' | 'ready';

export interface HomeCard {
  id: string;
  slug: string;
  name: string;
  zone: string | null;
  city: string;
  /** "Zona, Ciudad" sin repetir la ciudad cuando la zona ya la incluye. */
  place: string;
  priceLabel: string | null;
  stage: StageKey;
  types: string[];
  available: number | null;
  image: string | null;
}

export interface HomeCity {
  key: string;
  name: string;
  href: string;
  count: number;
  fromLabel: string | null;
  zones: string[];
  image: string | null;
  items: HomeCard[];
}

export interface HeroSlide {
  src: string;
  name: string;
}

export interface HomeStats {
  developments: number;
  units: number;
  cities: number;
  zones: number;
}
