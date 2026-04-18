import type { ZoneScore } from '@/lib/supabase/queries';

export type TabId = 'vacacional' | 'tradicional';
export type Currency = 'MXN' | 'USD';

// ── Short-term rental (vacacional) ──

export type CleanSTRZone = ZoneScore & {
  displayName: string;
  description_es: string;
  description_en: string;
  index_level: 'high' | 'mid' | 'low';
  competition_level: 'low' | 'medium' | 'high';
  competition_tag_es: string;
  competition_tag_en: string;
  trend_direction: 'up' | 'stable' | 'down';
  insight_es: string;
  insight_en: string;
  est_monthly_income_mxn: number;
};

export interface STRMeta {
  total_zones: number;
  avg_index: number;
  avg_occupancy: number;
  total_listings: number;
  data_updated_at: string;
}

// ── Long-term rental (tradicional) ──

export interface LTRFilters {
  city: string;
  zone: string;
  type: string;
  bedrooms: string;
  rentalType: string;
  furnished: string;
  rentMin: number;
  rentMax: number;
  minSamples: number;
}

export interface LTRMeta {
  total_comparables: number;
  total_cities: number;
  rent_median_mxn: number;
  rent_avg_mxn: number;
  rent_low_mxn: number;
  rent_high_mxn: number;
  rent_per_sqm: number;
  sources: { name: string; count: number }[];
  data_updated_at: string;
}

// ── Shared ──

export interface MercadoPageProps {
  tab: TabId;
  city?: string;
  locale: string;
}
