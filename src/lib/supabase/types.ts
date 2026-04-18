// ============================================================
// Propyte — Centralized Database Types (auto-generated from schema v2)
// ============================================================

// Enums
export type DevelopmentStage = 'proximamente' | 'preventa' | 'construccion' | 'entrega_inmediata' | 'vendido' | 'suspendido';
export type PropType = 'departamento' | 'penthouse' | 'casa' | 'terreno' | 'macrolote' | 'local_comercial' | 'townhouse' | 'studio';
export type UnitStatus = 'disponible' | 'apartada' | 'vendida' | 'no_disponible';
export type CrmRole = 'admin' | 'director' | 'gerente' | 'team_leader' | 'asesor_sr' | 'asesor_jr' | 'hostess' | 'marketing' | 'developer_ext';
export type DealStage = 'new_lead' | 'contacted' | 'discovery' | 'discovery_done' | 'tour_scheduled' | 'tour_done' | 'proposal' | 'negotiation' | 'reserved' | 'contract' | 'closing' | 'won' | 'lost' | 'frozen';
export type DevRelationship = 'propio' | 'masterbroker' | 'corretaje';
export type DealType = 'nativa_contado' | 'nativa_financiamiento' | 'macrolote' | 'corretaje' | 'masterbroker';
export type CommissionStatus = 'pendiente' | 'facturada' | 'pagada';
export type PlazaType = 'PDC' | 'TULUM' | 'MERIDA' | 'CANCUN' | 'OTRO';
export type RentalType = 'residencial' | 'vacacional';

// Legacy aliases for backward compat in existing components
export type PropertyStage = DevelopmentStage;
export type PropertyType = PropType;
export type PropertyBadge = 'preventa' | 'nuevo' | 'entrega_inmediata';
export type UserRole = CrmRole;

// ============================================================
// Row Types
// ============================================================

export interface DeveloperRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  description_es: string | null;
  description_en: string | null;
  city: string | null;
  state: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DevelopmentRow {
  id: string;
  slug: string;
  name: string;
  developer_id: string | null;
  city: string;
  zone: string | null;
  state: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  zone_id: string | null;
  plaza: PlazaType | null;
  development_type: string | null;
  property_types: string[];
  stage: DevelopmentStage;
  badge: string | null;
  price_min_mxn: number | null;
  price_max_mxn: number | null;
  currency: string;
  total_units: number | null;
  available_units: number | null;
  reserved_units: number;
  sold_units: number;
  roi_projected: number | null;
  roi_rental_monthly: number | null;
  roi_appreciation: number | null;
  financing_down_payment: number | null;
  financing_months: number[] | null;
  financing_interest: number | null;
  crm_relationship: DevRelationship | null;
  commission_rate: number | null;
  construction_progress: number;
  status: string;
  description_es: string | null;
  description_en: string | null;
  images: string[];
  amenities: string[];
  virtual_tour_url: string | null;
  video_url: string | null;
  brochure_url: string | null;
  usage: string[];
  sales_start_date: string | null;
  estimated_delivery: string | null;
  delivery_text: string | null;
  detection_source: string | null;
  source_url: string | null;
  drive_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  detected_at: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UnitRow {
  id: string;
  development_id: string;
  slug: string | null;
  unit_number: string | null;
  unit_type: PropType;
  typology: string | null;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  has_pool: boolean;
  price_mxn: number | null;
  price_usd: number | null;
  status: UnitStatus;
  reserved_by_contact_id: string | null;
  reserved_at: string | null;
  sold_at: string | null;
  sale_price: number | null;
  description_es: string | null;
  description_en: string | null;
  images: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ContactRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  contact_type: string;
  lead_source: string | null;
  lead_source_detail: string | null;
  temperature: string;
  score: number;
  tags: string[];
  investment_profile: string | null;
  property_type: string | null;
  purchase_timeline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  payment_method: string | null;
  preferred_zone: string | null;
  purchase_modality: string | null;
  rental_strategy: string | null;
  residence_city: string | null;
  residence_country: string | null;
  nationality: string | null;
  preferred_language: string;
  locale: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer_url: string | null;
  landing_page: string | null;
  message: string | null;
  source_development_id: string | null;
  assigned_to_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: CrmRole;
  career_level: string | null;
  plaza: PlazaType | null;
  team_leader_id: string | null;
  developer_id: string | null;
  is_active: boolean;
  sedetus_number: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DealRow {
  id: string;
  contact_id: string;
  assigned_to_id: string | null;
  development_id: string | null;
  unit_id: string | null;
  stage: DealStage;
  deal_type: DealType | null;
  estimated_value: number | null;
  currency: string;
  probability: number;
  expected_close: string | null;
  actual_close: string | null;
  lead_source_at_deal: string | null;
  lost_reason: string | null;
  lost_detail: string | null;
  won_notes: string | null;
  commission_total: number;
  commission_advisor: number;
  commission_tl: number;
  commission_gerente: number;
  commission_director: number;
  commission_broker_ext: number;
  commission_status: CommissionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================
// Rental Estimate Types
// ============================================================

export interface RentalComparableRow {
  id: string;
  source_portal: string;
  source_url: string | null;
  source_id: string | null;
  city: string;
  zone: string | null;
  state: string;
  property_type: PropType;
  rental_type: RentalType;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  monthly_rent_mxn: number;
  is_furnished: boolean | null;
  scraped_at: string;
  listing_date: string | null;
  active: boolean;
  created_at: string;
}

export interface RentalEstimateRow {
  city: string;
  zone: string | null;
  property_type: PropType;
  bedrooms: number | null;
  rental_type: RentalType;
  sample_size: number;
  median_rent_mxn: number;
  avg_rent_mxn: number;
  p25_rent_mxn: number;
  p75_rent_mxn: number;
  min_rent_mxn: number;
  max_rent_mxn: number;
  avg_rent_per_m2: number | null;
  last_updated: string;
}

// ============================================================
// ML Rental Estimate Types
// ============================================================

export interface RentalMlEstimateRow {
  id: string;
  development_id: string;
  unit_type: PropType;
  bedrooms: number | null;
  estimated_rent_residencial: number;
  estimated_rent_vacacional: number | null;
  confidence_score: number;
  model_version: string;
  computed_at: string;
}

export interface DevelopmentFinancialsRow {
  id: string;
  development_id: string;
  // Residencial metrics
  roi_annual_pct: number | null;
  irr_5yr: number | null;
  irr_10yr: number | null;
  cash_on_cash_pct: number | null;
  breakeven_months: number | null;
  monthly_net_flow: number | null;
  cap_rate: number | null;
  rent_yield_gross: number | null;
  rent_yield_net: number | null;
  estimated_rent_residencial: number | null;
  estimated_rent_vacacional: number | null;
  occupancy_rate_res: number | null;
  // Vacacional metrics
  roi_annual_pct_vac: number | null;
  irr_5yr_vac: number | null;
  irr_10yr_vac: number | null;
  cash_on_cash_pct_vac: number | null;
  breakeven_months_vac: number | null;
  monthly_net_flow_vac: number | null;
  cap_rate_vac: number | null;
  rent_yield_gross_vac: number | null;
  rent_yield_net_vac: number | null;
  occupancy_rate_vac: number | null;
  // Meta
  model_version: string | null;
  last_computed: string;
}

export interface AirdnaMetricRow {
  id: number;
  market: string;
  submarket: string | null;
  section: string;
  chart: string;
  metric_date: string;
  metric_name: string;
  metric_value: number | null;
  scraped_at: string;
  created_at: string;
}

// ============================================================
// Joined types (for views / common queries)
// ============================================================

export interface DevelopmentWithDeveloper extends DevelopmentRow {
  developers: Pick<DeveloperRow, 'name' | 'logo_url' | 'verified' | 'slug'> | null;
}

export interface DevelopmentWithUnits extends DevelopmentRow {
  developers: Pick<DeveloperRow, 'name' | 'logo_url' | 'verified' | 'slug'> | null;
  units: UnitRow[];
}

export interface ContactWithDevelopment extends ContactRow {
  developments: Pick<DevelopmentRow, 'name' | 'slug' | 'city'> | null;
}

// ============================================================
// Fact table types (for analytics dashboard)
// ============================================================

export interface FactInventoryWeekly {
  id: string;
  week_start: string;
  development_id: string;
  zone_id: string | null;
  total_units: number | null;
  available_units: number | null;
  reserved_units: number | null;
  sold_units: number | null;
  units_sold_this_week: number;
  units_reserved_this_week: number;
  price_min_mxn: number | null;
  price_max_mxn: number | null;
  price_avg_mxn: number | null;
  price_per_m2_avg: number | null;
  absorption_rate: number | null;
  weekly_velocity: number | null;
  months_to_sellout: number | null;
  days_on_market: number | null;
}

export interface FactLead {
  id: string;
  occurred_at: string;
  week_start: string;
  contact_id: string | null;
  development_id: string | null;
  zone_id: string | null;
  channel_id: string | null;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  locale: string | null;
  device_type: string | null;
  temperature: string | null;
  budget_min: number | null;
  budget_max: number | null;
  investment_profile: string | null;
  qualified: boolean | null;
  converted: boolean;
  first_response_minutes: number | null;
  total_touches: number;
}

export interface FactMarketingSpend {
  id: string;
  week_start: string;
  channel_id: string;
  campaign_id: string | null;
  development_id: string | null;
  zone_id: string | null;
  spend_mxn: number;
  spend_usd: number | null;
  impressions: number | null;
  clicks: number | null;
  reach: number | null;
  cpm_mxn: number | null;
  cpc_mxn: number | null;
  ctr: number | null;
  platform_leads: number | null;
  platform_cost_per_lead: number | null;
}

export interface MvMmmWeekly {
  week_start: string;
  zone_id: string;
  city: string;
  zone: string;
  plaza: PlazaType | null;
  total_leads: number;
  qualified_leads: number;
  deals_won: number;
  revenue_won: number;
  total_spend: number;
  fb_spend: number;
  ig_spend: number;
  google_spend: number;
  tiktok_spend: number;
  portal_spend: number;
  total_pageviews: number;
  organic_views: number;
  paid_views: number;
  whatsapp_clicks: number;
  form_submissions: number;
  avg_available_units: number | null;
  avg_price: number | null;
  avg_price_m2: number | null;
  avg_velocity: number | null;
  units_sold: number;
  crm_calls: number;
  crm_whatsapps: number;
  crm_tours: number;
  crm_walkins: number;
  new_launches: number;
  price_increases: number;
  sellouts: number;
}

// ============================================================
// Database type (Supabase client generics)
// ============================================================

export interface Database {
  public: {
    Tables: {
      developers: {
        Row: DeveloperRow;
        Insert: Partial<DeveloperRow> & { name: string; slug: string };
        Update: Partial<DeveloperRow>;
      };
      developments: {
        Row: DevelopmentRow;
        Insert: Partial<DevelopmentRow> & { name: string; slug: string; city: string; state: string; stage: DevelopmentStage };
        Update: Partial<DevelopmentRow>;
      };
      // Legacy alias — admin pages still reference 'properties'
      properties: {
        Row: DevelopmentRow;
        Insert: Partial<DevelopmentRow> & { name: string; slug: string; city: string; state: string; stage: DevelopmentStage };
        Update: Partial<DevelopmentRow>;
      };
      units: {
        Row: UnitRow;
        Insert: Partial<UnitRow> & { development_id: string; unit_type: PropType };
        Update: Partial<UnitRow>;
      };
      contacts: {
        Row: ContactRow;
        Insert: Partial<ContactRow> & { first_name: string };
        Update: Partial<ContactRow>;
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; full_name: string };
        Update: Partial<ProfileRow>;
      };
      deals: {
        Row: DealRow;
        Insert: Partial<DealRow> & { contact_id: string };
        Update: Partial<DealRow>;
      };
      fact_inventory_weekly: {
        Row: FactInventoryWeekly;
        Insert: Partial<FactInventoryWeekly> & { week_start: string; development_id: string };
        Update: Partial<FactInventoryWeekly>;
      };
      fact_leads: {
        Row: FactLead;
        Insert: Partial<FactLead> & { week_start: string };
        Update: Partial<FactLead>;
      };
      fact_marketing_spend: {
        Row: FactMarketingSpend;
        Insert: Partial<FactMarketingSpend> & { week_start: string; channel_id: string };
        Update: Partial<FactMarketingSpend>;
      };
      rental_comparables: {
        Row: RentalComparableRow;
        Insert: Partial<RentalComparableRow> & { city: string; state: string; property_type: PropType; monthly_rent_mxn: number; source_portal: string; source_id: string };
        Update: Partial<RentalComparableRow>;
      };
      rental_ml_estimates: {
        Row: RentalMlEstimateRow;
        Insert: Partial<RentalMlEstimateRow> & { development_id: string; unit_type: PropType; estimated_rent_residencial: number; model_version: string };
        Update: Partial<RentalMlEstimateRow>;
      };
      development_financials: {
        Row: DevelopmentFinancialsRow;
        Insert: Partial<DevelopmentFinancialsRow> & { development_id: string };
        Update: Partial<DevelopmentFinancialsRow>;
      };
      airdna_metrics: {
        Row: AirdnaMetricRow;
        Insert: Omit<AirdnaMetricRow, 'id' | 'created_at'>;
        Update: Partial<Omit<AirdnaMetricRow, 'id' | 'created_at'>>;
      };
    };
    Views: {
      developments_with_developer: {
        Row: DevelopmentWithDeveloper;
      };
      mv_mmm_weekly: {
        Row: MvMmmWeekly;
      };
      rental_estimates: {
        Row: RentalEstimateRow;
      };
    };
  };
}
