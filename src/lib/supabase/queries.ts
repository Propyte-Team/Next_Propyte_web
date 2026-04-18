import type { SupabaseClient } from '@supabase/supabase-js';
import { RENT_BOUNDS, AIRDNA_SUBMARKET_TO_ZONE } from '@/lib/calculator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

// ============================================================
// DEVELOPMENT QUERIES (replaces old property queries)
// ============================================================

export interface DevelopmentFilters {
  city?: string;
  zone?: string;
  zoneId?: string;
  plaza?: string;
  type?: string;        // property_types contains
  stage?: string;
  minPrice?: number;
  maxPrice?: number;
  minRoi?: number;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'price_asc' | 'price_desc' | 'newest' | 'roi' | 'units';
}

export async function getDevelopments(client: Client, filters: DevelopmentFilters = {}) {
  let query = client
    .from('developments')
    .select('*, developers(name, logo_url, verified, slug)', { count: 'exact' })
    .eq('published', true)
    .is('deleted_at', null);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.zone) query = query.eq('zone', filters.zone);
  if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);
  if (filters.plaza) query = query.eq('plaza', filters.plaza);
  if (filters.type) query = query.contains('property_types', [filters.type]);
  if (filters.stage) query = query.eq('stage', filters.stage);
  if (filters.minPrice) query = query.gte('price_min_mxn', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_min_mxn', filters.maxPrice);
  if (filters.minRoi) query = query.gte('roi_projected', filters.minRoi);
  if (filters.featured) query = query.eq('featured', true);

  if (filters.search) {
    query = query.textSearch('fts', filters.search, { type: 'websearch', config: 'spanish' });
  }

  switch (filters.orderBy) {
    case 'price_asc':
      query = query.order('price_min_mxn', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price_min_mxn', { ascending: false });
      break;
    case 'roi':
      query = query.order('roi_projected', { ascending: false, nullsFirst: false });
      break;
    case 'units':
      query = query.order('available_units', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  return query;
}

export async function getDevelopmentBySlug(client: Client, slug: string) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url, verified, slug)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
}

export async function getDevelopmentWithUnits(client: Client, slug: string) {
  // Get development
  const { data: dev, error: devError } = await client
    .from('developments')
    .select('*, developers(name, logo_url, verified, slug)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (devError || !dev) return { data: null, error: devError };

  // Get its units
  const { data: units, error: unitsError } = await client
    .from('units')
    .select('*')
    .eq('development_id', dev.id)
    .is('deleted_at', null)
    .order('unit_number', { ascending: true });

  return {
    data: { ...dev, units: units || [] },
    error: unitsError,
  };
}

export async function getSimilarDevelopments(client: Client, dev: { id: string; city: string; stage: string }, limit = 4) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url)')
    .eq('published', true)
    .is('deleted_at', null)
    .neq('id', dev.id)
    .or(`city.eq.${dev.city},stage.eq.${dev.stage}`)
    .limit(limit);
}

export async function getFeaturedDevelopments(client: Client, limit = 6) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url)')
    .eq('published', true)
    .eq('featured', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function getDevelopmentsByCity(client: Client, city: string) {
  return client
    .from('developments')
    .select('*, developers(name, logo_url)', { count: 'exact' })
    .eq('published', true)
    .eq('city', city)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
}

export async function getCityCounts(client: Client) {
  // Returns count of developments per city
  return client
    .from('developments')
    .select('city', { count: 'exact', head: false })
    .eq('published', true)
    .is('deleted_at', null);
}

export async function getGlobalStats(client: Client) {
  const [devsRes, unitsRes] = await Promise.all([
    client
      .from('developments')
      .select('id, city, zone, property_types', { count: 'exact' })
      .eq('published', true)
      .is('deleted_at', null),
    client
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .is('deleted_at', null),
  ]);

  const devs = devsRes.data || [];
  const cities = new Set(devs.map(d => d.city).filter(Boolean));
  const zones = new Set(devs.map(d => d.zone).filter(Boolean));

  // Count by property type (flatten arrays)
  const typeCounts: Record<string, number> = {};
  for (const d of devs) {
    if (d.property_types && Array.isArray(d.property_types)) {
      for (const t of d.property_types) {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }
    }
  }

  return {
    developments: devsRes.count || devs.length,
    units: unitsRes.count || 0,
    cities: cities.size,
    zones: zones.size,
    typeCounts,
  };
}

export async function getBatchFinancials(client: Client, developmentIds: string[]) {
  if (developmentIds.length === 0) return [];
  const { data } = await client
    .from('development_financials')
    .select('development_id, cap_rate, estimated_rent_residencial, roi_annual_pct')
    .in('development_id', developmentIds);
  return data || [];
}

// ============================================================
// UNIT QUERIES
// ============================================================

export async function getUnitBySlug(client: Client, slug: string) {
  return client
    .from('units')
    .select('*, developments(name, slug, city, zone, developers(name, logo_url))')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
}

export async function getAvailableUnits(client: Client, developmentId: string) {
  return client
    .from('units')
    .select('*')
    .eq('development_id', developmentId)
    .eq('status', 'disponible')
    .is('deleted_at', null)
    .order('price_mxn', { ascending: true });
}

// ============================================================
// CONTACT/LEAD QUERIES (unified)
// ============================================================

export async function createContact(client: Client, data: Record<string, unknown>) {
  return client.from('contacts').insert(data).select().single();
}

export async function getContacts(client: Client, filters: { status?: string; temperature?: string; limit?: number; offset?: number } = {}) {
  let query = client
    .from('contacts')
    .select('*, developments:source_development_id(name, slug, city)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.temperature) query = query.eq('temperature', filters.temperature);

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  return query;
}

export async function updateContactStatus(client: Client, id: string, status: string) {
  return client.from('contacts').update({ status }).eq('id', id);
}

// ============================================================
// DEVELOPER QUERIES
// ============================================================

export async function getDevelopers(client: Client) {
  return client
    .from('developers')
    .select('*, developments(count)')
    .order('name');
}

export async function getDeveloperBySlug(client: Client, slug: string) {
  return client
    .from('developers')
    .select('*')
    .eq('slug', slug)
    .single();
}

// ============================================================
// ANALYTICS: WEB EVENTS
// ============================================================

export async function trackWebEvent(
  client: Client,
  developmentId: string,
  eventType: string,
  locale = 'es',
) {
  // Aggregate into fact_web_events (daily)
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart(new Date()).toISOString().slice(0, 10);

  const columnMap: Record<string, string> = {
    view: 'page_views',
    whatsapp_click: 'whatsapp_clicks',
    call_click: 'call_clicks',
    form_submit: 'form_submissions',
    share: 'shares',
    save: 'saves',
  };

  const column = columnMap[eventType] || 'page_views';

  // Try upsert with increment
  const { error } = await client.rpc('increment_web_event', {
    p_event_date: today,
    p_week_start: weekStart,
    p_development_id: developmentId,
    p_column: column,
  });

  // Fallback: direct insert if RPC not available
  if (error) {
    return client.from('fact_web_events').upsert({
      event_date: today,
      week_start: weekStart,
      development_id: developmentId,
      page_type: 'detail',
      [column]: 1,
    }, { onConflict: 'event_date,development_id,page_type' });
  }
}

// ============================================================
// ANALYTICS: DASHBOARD QUERIES
// ============================================================

export async function getInventorySnapshot(client: Client, developmentId: string, weeks = 12) {
  return client
    .from('fact_inventory_weekly')
    .select('*')
    .eq('development_id', developmentId)
    .order('week_start', { ascending: false })
    .limit(weeks);
}

export async function getLeadsByWeek(client: Client, zoneId?: string, weeks = 12) {
  let query = client
    .from('fact_leads')
    .select('week_start, channel_id, qualified, converted')
    .gte('week_start', getWeeksAgo(weeks).toISOString().slice(0, 10));

  if (zoneId) query = query.eq('zone_id', zoneId);

  return query;
}

export async function getMarketingSpend(client: Client, weeks = 12) {
  return client
    .from('fact_marketing_spend')
    .select('*')
    .gte('week_start', getWeeksAgo(weeks).toISOString().slice(0, 10))
    .order('week_start', { ascending: false });
}

export async function getMmmData(client: Client, zoneId?: string) {
  let query = client
    .from('mv_mmm_weekly')
    .select('*')
    .order('week_start', { ascending: true });

  if (zoneId) query = query.eq('zone_id', zoneId);

  return query;
}

// ============================================================
// RENTAL ESTIMATE QUERIES
// ============================================================

export interface RentalEstimate {
  city: string;
  zone: string | null;
  property_type: string;
  bedrooms: number | null;
  rental_type: string;
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

/**
 * Get rental estimate by querying rental_comparables directly.
 * Computes aggregates in JS since Supabase REST doesn't support percentile_cont.
 * Falls back: zone+type+beds → city+type+beds → city+type → city.
 */
export async function getRentalEstimate(
  client: Client,
  city: string,
  propertyType?: string | null,
  bedrooms?: number | null,
  zone?: string | null,
  rentalType: string = 'residencial',
): Promise<{ data: RentalEstimate | null; fallback: boolean }> {
  const MIN_SAMPLE = 3;

  // Normalize property type: penthouse → departamento for comparables search
  const normalizedType = propertyType === 'penthouse' ? 'departamento' : propertyType;

  // Build queries in fallback order
  const attempts: Array<{ filter: Record<string, unknown>; isFallback: boolean }> = [];

  if (zone && normalizedType && bedrooms) {
    attempts.push({ filter: { city, zone, property_type: normalizedType, bedrooms, rental_type: rentalType }, isFallback: false });
  }
  if (normalizedType && bedrooms) {
    attempts.push({ filter: { city, property_type: normalizedType, bedrooms, rental_type: rentalType }, isFallback: true });
  }
  if (normalizedType) {
    attempts.push({ filter: { city, property_type: normalizedType, rental_type: rentalType }, isFallback: true });
  }
  attempts.push({ filter: { city, rental_type: rentalType }, isFallback: true });

  // Data cleaning bounds (mirrors Python pipeline)
  const AREA_MIN = 15;
  const AREA_MAX = 800;
  const RENT_PER_M2_MAX = 2000;

  for (const attempt of attempts) {
    let query = client
      .from('rental_comparables')
      .select('monthly_rent_mxn, area_m2, bedrooms, zone')
      .eq('active', true)
      .gte('monthly_rent_mxn', RENT_BOUNDS.MIN)
      .lte('monthly_rent_mxn', RENT_BOUNDS.MAX);

    for (const [key, value] of Object.entries(attempt.filter)) {
      if (value != null) {
        query = query.eq(key, value);
      }
    }

    const { data } = await query.order('monthly_rent_mxn', { ascending: true });

    if (data && data.length >= MIN_SAMPLE) {
      // Clean: filter invalid areas and extreme rent/m² before computing stats
      const cleaned = data.filter((d: { monthly_rent_mxn: number; area_m2: number | null }) => {
        if (d.area_m2 != null && d.area_m2 > 0) {
          if (d.area_m2 < AREA_MIN || d.area_m2 > AREA_MAX) return false;
          const rpm2 = d.monthly_rent_mxn / d.area_m2;
          if (rpm2 > RENT_PER_M2_MAX) return false;
        }
        return true;
      });
      if (cleaned.length < MIN_SAMPLE) continue;

      // IQR outlier removal within this group
      const allRents = cleaned.map((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn).sort((a: number, b: number) => a - b);
      const q1 = allRents[Math.floor(allRents.length * 0.25)];
      const q3 = allRents[Math.floor(allRents.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 2.5 * iqr;
      const upper = q3 + 2.5 * iqr;
      const filtered = iqr > 0
        ? cleaned.filter((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn >= lower && d.monthly_rent_mxn <= upper)
        : cleaned;
      if (filtered.length < MIN_SAMPLE) continue;

      const prices = filtered.map((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn).sort((a: number, b: number) => a - b);
      const areas = filtered
        .filter((d: { area_m2: number | null }) => d.area_m2 && d.area_m2 >= AREA_MIN)
        .map((d: { area_m2: number; monthly_rent_mxn: number }) => d.monthly_rent_mxn / d.area_m2);

      const median = prices[Math.floor(prices.length / 2)];
      const p25 = prices[Math.floor(prices.length * 0.25)];
      const p75 = prices[Math.floor(prices.length * 0.75)];
      const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
      const avgPerM2 = areas.length >= 3
        ? Math.round((areas.reduce((a: number, b: number) => a + b, 0) / areas.length) * 100) / 100
        : null;

      return {
        data: {
          city,
          zone: zone || null,
          property_type: propertyType || 'departamento',
          bedrooms: bedrooms || null,
          rental_type: rentalType,
          sample_size: prices.length,
          median_rent_mxn: median,
          avg_rent_mxn: avg,
          p25_rent_mxn: p25,
          p75_rent_mxn: p75,
          min_rent_mxn: prices[0],
          max_rent_mxn: prices[prices.length - 1],
          avg_rent_per_m2: avgPerM2,
          last_updated: new Date().toISOString(),
        },
        fallback: attempt.isFallback,
      };
    }
  }

  return { data: null, fallback: true };
}

/**
 * Get both residential and vacation rental estimates.
 */
export async function getRentalEstimates(
  client: Client,
  city: string,
  propertyType?: string | null,
  bedrooms?: number | null,
  zone?: string | null,
): Promise<{ residencial: RentalEstimate | null; vacacional: RentalEstimate | null }> {
  const [residencial, vacacional] = await Promise.all([
    getRentalEstimate(client, city, propertyType, bedrooms, zone, 'residencial'),
    getRentalEstimate(client, city, propertyType, bedrooms, zone, 'vacacional'),
  ]);

  return {
    residencial: residencial.data,
    vacacional: vacacional.data,
  };
}

// ============================================================
// ML RENTAL ESTIMATES & DEVELOPMENT FINANCIALS
// ============================================================

export async function getDevelopmentFinancials(client: Client, developmentId: string) {
  const { data, error } = await client
    .from('development_financials')
    .select('*')
    .eq('development_id', developmentId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getMlRentalEstimates(client: Client, developmentId: string) {
  const { data } = await client
    .from('rental_ml_estimates')
    .select('*')
    .eq('development_id', developmentId)
    .order('bedrooms', { ascending: true });

  return data || [];
}

export async function getMlRentalEstimateForUnit(
  client: Client,
  developmentId: string,
  unitType: string,
  bedrooms: number,
) {
  const { data } = await client
    .from('rental_ml_estimates')
    .select('*')
    .eq('development_id', developmentId)
    .eq('unit_type', unitType)
    .eq('bedrooms', bedrooms)
    .single();

  return data || null;
}

// ============================================================
// AIRDNA MARKET DATA
// ============================================================

export interface AirdnaZoneSummary {
  zone: string;
  submarket: string;
  occupancy: number | null;
  adr: number | null;
}

export interface AirdnaMarketSummary {
  current_occupancy: number | null;
  avg_occupancy_12m: number | null;
  current_adr: number | null;
  adr_by_beds: Record<string, number>;
  active_listings: number | null;
  rate_tiers: Record<string, number>;
  latest_date: string | null;
  occupancy_trend: Array<{ date: string; value: number }>;
  zones: AirdnaZoneSummary[];
}

export async function getAirdnaMarketSummary(
  client: Client,
  market: string,
): Promise<AirdnaMarketSummary | null> {
  if (!market) return null;

  // Fetch latest data points in parallel
  const [occResult, adrResult, adrBedsResult, listingsResult, tiersResult] = await Promise.all([
    // Occupancy trend (last 12 unique dates, market-level)
    client.from('airdna_metrics')
      .select('metric_date, metric_value')
      .eq('market', market).eq('section', 'occupancy').eq('chart', 'chart_1').eq('metric_name', 'occupancy')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(12),
    // ADR overall
    client.from('airdna_metrics')
      .select('metric_value, metric_date')
      .eq('market', market).eq('section', 'rates').eq('chart', 'chart_1').eq('metric_name', 'daily_rate')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(1),
    // ADR by bedrooms (latest)
    client.from('airdna_metrics')
      .select('metric_name, metric_value, metric_date')
      .eq('market', market).eq('section', 'rates').eq('chart', 'chart_2')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(12),
    // Listings by bedrooms (latest)
    client.from('airdna_metrics')
      .select('metric_name, metric_value, metric_date')
      .eq('market', market).eq('section', 'listings').eq('chart', 'chart_1')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(6),
    // Rate tiers (latest)
    client.from('airdna_metrics')
      .select('metric_name, metric_value')
      .eq('market', market).eq('section', 'rates').eq('chart', 'chart_3')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(5),
  ]);

  const occData = occResult.data || [];
  if (occData.length === 0) return null; // No AirDNA data for this market

  // Deduplicate occupancy by date (take first per date)
  const seenDates = new Set<string>();
  const uniqueOcc: Array<{ date: string; value: number }> = [];
  for (const r of occData) {
    if (r.metric_value != null && !seenDates.has(r.metric_date)) {
      seenDates.add(r.metric_date);
      uniqueOcc.push({ date: r.metric_date, value: r.metric_value });
    }
  }

  const currentOcc = uniqueOcc[0]?.value ?? null;
  const avgOcc = uniqueOcc.length > 0
    ? Math.round((uniqueOcc.reduce((s, r) => s + r.value, 0) / uniqueOcc.length) * 100) / 100
    : null;

  // ADR by bedrooms — deduplicate by metric_name (take latest per name)
  const adrByBeds: Record<string, number> = {};
  for (const r of (adrBedsResult.data || [])) {
    if (r.metric_value != null && !adrByBeds[r.metric_name]) {
      adrByBeds[r.metric_name] = Math.round(r.metric_value);
    }
  }

  // Total listings
  const totalListings = (listingsResult.data || [])
    .filter((r, i, arr) => {
      // Take latest date only
      const latestDate = arr[0]?.metric_date;
      return r.metric_date === latestDate && r.metric_value != null;
    })
    .reduce((sum, r) => sum + (r.metric_value || 0), 0);

  // Rate tiers
  const rateTiers: Record<string, number> = {};
  for (const r of (tiersResult.data || [])) {
    if (r.metric_value != null && !rateTiers[r.metric_name]) {
      rateTiers[r.metric_name] = Math.round(r.metric_value);
    }
  }

  return {
    current_occupancy: currentOcc,
    avg_occupancy_12m: avgOcc,
    current_adr: adrResult.data?.[0]?.metric_value ? Math.round(adrResult.data[0].metric_value) : null,
    adr_by_beds: adrByBeds,
    active_listings: totalListings || null,
    rate_tiers: rateTiers,
    latest_date: uniqueOcc[0]?.date ?? null,
    occupancy_trend: uniqueOcc.reverse(),
    zones: await fetchSubmarketZones(client, market),
  };
}

async function fetchSubmarketZones(
  client: Client,
  market: string,
): Promise<AirdnaZoneSummary[]> {
  // Get latest occupancy and ADR per submarket
  const { data } = await client
    .from('airdna_metrics')
    .select('submarket, section, chart, metric_name, metric_value, metric_date')
    .eq('market', market)
    .not('submarket', 'is', null)
    .in('section', ['occupancy', 'rates'])
    .order('metric_date', { ascending: false })
    .limit(2000);

  if (!data || data.length === 0) return [];

  // Group by submarket, take latest occupancy and ADR
  const bySubmarket: Record<string, { occupancy: number | null; adr: number | null }> = {};
  for (const r of data) {
    const sub = r.submarket!;
    if (!bySubmarket[sub]) bySubmarket[sub] = { occupancy: null, adr: null };
    if (r.section === 'occupancy' && r.chart === 'chart_1' && r.metric_name === 'occupancy' && bySubmarket[sub].occupancy === null) {
      bySubmarket[sub].occupancy = r.metric_value;
    }
    if (r.section === 'rates' && r.chart === 'chart_1' && r.metric_name === 'daily_rate' && bySubmarket[sub].adr === null) {
      bySubmarket[sub].adr = r.metric_value ? Math.round(r.metric_value) : null;
    }
  }

  return Object.entries(bySubmarket)
    .map(([submarket, vals]) => ({
      zone: AIRDNA_SUBMARKET_TO_ZONE[submarket] || submarket.toUpperCase(),
      submarket,
      occupancy: vals.occupancy,
      adr: vals.adr,
    }))
    .sort((a, b) => (b.adr || 0) - (a.adr || 0));
}

// ============================================================
// ADMIN: DEVELOPMENT CRUD
// ============================================================

export async function createDevelopment(client: Client, data: Record<string, unknown>) {
  return client.from('developments').insert(data).select().single();
}

export async function updateDevelopment(client: Client, id: string, data: Record<string, unknown>) {
  return client.from('developments').update(data).eq('id', id).select().single();
}

export async function deleteDevelopment(client: Client, id: string) {
  // Soft delete
  return client.from('developments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
}

export async function bulkInsertDevelopments(client: Client, developments: Record<string, unknown>[]) {
  return client.from('developments').insert(developments).select();
}

// ============================================================
// ADMIN: UNIT CRUD
// ============================================================

export async function createUnit(client: Client, data: Record<string, unknown>) {
  return client.from('units').insert(data).select().single();
}

export async function updateUnit(client: Client, id: string, data: Record<string, unknown>) {
  return client.from('units').update(data).eq('id', id).select().single();
}

export async function bulkInsertUnits(client: Client, units: Record<string, unknown>[]) {
  return client.from('units').insert(units).select();
}

// ============================================================
// AUTH HELPERS
// ============================================================

export async function getCurrentProfile(client: Client) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

// ============================================================
// HELPERS
// ============================================================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function getWeeksAgo(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return getWeekStart(d);
}

// ============================================================
// ANALYTICS: ZONE SCORES
// ============================================================

export interface ZoneScore {
  id: number;
  city: string;
  zone: string;
  score: number | null;
  yield_component: number | null;
  occupancy_component: number | null;
  adr_growth_component: number | null;
  supply_pressure_component: number | null;
  revpar: number | null;
  price_to_rent_ratio: number | null;
  yield_spread: number | null;
  supply_demand_ratio: number | null;
  active_listings: number | null;
  median_adr: number | null;
  median_occupancy: number | null;
  median_rent: number | null;
  cluster_label: string | null;
  computed_at: string;
}

// Zone names that are DB slugs, not real geography
const INVALID_ZONE_PATTERNS = [
  /^SUBMARKET_/i,
  /^ZONA_/i,
  /^zona_/,
  /^submarket_/,
];
const INVALID_ZONE_NAMES = new Set([
  'Venta', 'Villa', 'Piso', 'Casa', 'Departamento', 'Penthouse',
  'venta', 'villa', 'piso', 'casa', 'departamento', 'penthouse',
]);

function isValidZoneName(zone: string): boolean {
  if (!zone || zone.length > 50) return false;
  if (INVALID_ZONE_NAMES.has(zone)) return false;
  if (INVALID_ZONE_PATTERNS.some((p) => p.test(zone))) return false;
  // Single word that looks like a listing title (contains uppercase + lowercase mix with spaces)
  if (zone.includes('RENTA') || zone.includes('VENTA')) return false;
  return true;
}

export async function getZoneScores(client: Client, city?: string) {
  let query = client
    .from('zone_scores')
    .select('*')
    .order('computed_at', { ascending: false });

  if (city) query = query.eq('city', city);

  // Get latest snapshot: deduplicate by zone
  const { data, error } = await query.limit(5000);
  if (error || !data) return [];

  // Keep only latest per (city, zone)
  const seen = new Set<string>();
  const deduplicated = data.filter((row: ZoneScore) => {
    const key = `${row.city}:${row.zone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as ZoneScore[];

  // Filter out invalid zone names (DB slugs, listing titles, generic words)
  const validZones = deduplicated.filter((row) => isValidZoneName(row.zone));

  // Filter out cities with corrupt data (>50% identical scores or 0% occupancy)
  const cityGroups = new Map<string, ZoneScore[]>();
  for (const row of validZones) {
    const list = cityGroups.get(row.city) || [];
    list.push(row);
    cityGroups.set(row.city, list);
  }

  const cleanZones: ZoneScore[] = [];
  for (const [, zones] of cityGroups) {
    // Check if >50% have identical scores (fallback data)
    const scoreCounts = new Map<number, number>();
    for (const z of zones) {
      const s = Math.round(z.score ?? 0);
      scoreCounts.set(s, (scoreCounts.get(s) || 0) + 1);
    }
    const maxSameScore = Math.max(...scoreCounts.values());
    if (maxSameScore / zones.length > 0.5 && zones.length > 5) continue; // Skip corrupt city

    // Check if avg occupancy is 0 (no real data)
    const avgOcc = zones.reduce((a, z) => a + (z.median_occupancy ?? 0), 0) / zones.length;
    if (avgOcc < 1) continue; // Skip city with 0% occupancy

    cleanZones.push(...zones);
  }

  return cleanZones;
}

export async function getZoneDetail(client: Client, city: string, zone: string) {
  // Zone score
  const { data: scoreData } = await client
    .from('zone_scores')
    .select('*')
    .eq('city', city)
    .eq('zone', zone)
    .order('computed_at', { ascending: false })
    .limit(1);

  const score = scoreData?.[0] || null;

  // Get zone's submarket code for AirDNA lookups
  const submarkets = AIRDNA_SUBMARKET_TO_ZONE;
  const zoneSubmarkets = Object.entries(submarkets)
    .filter(([, z]) => z === zone)
    .map(([sub]) => sub);

  return { score, submarkets: zoneSubmarkets };
}

// ============================================================
// ANALYTICS: FORECASTS
// ============================================================

export interface MetricForecast {
  market: string;
  submarket: string | null;
  metric_name: string;
  forecast_date: string;
  predicted_value: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  model_type: string | null;
}

export async function getForecasts(
  client: Client,
  market: string,
  submarket?: string | null,
  metricName?: string,
): Promise<MetricForecast[]> {
  let query = client
    .from('metric_forecasts')
    .select('*')
    .eq('market', market)
    .order('forecast_date', { ascending: true });

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }
  if (metricName) query = query.eq('metric_name', metricName);

  const { data } = await query.limit(100);
  return (data || []) as MetricForecast[];
}

// ============================================================
// ANALYTICS: SEASONAL INDICES
// ============================================================

export interface SeasonalIndex {
  market: string;
  submarket: string | null;
  metric_name: string;
  month: number;
  seasonal_factor: number;
}

export async function getSeasonalIndices(
  client: Client,
  market: string,
  submarket?: string | null,
  metricName?: string,
): Promise<SeasonalIndex[]> {
  let query = client
    .from('seasonal_indices')
    .select('market,submarket,metric_name,month,seasonal_factor')
    .eq('market', market)
    .order('month', { ascending: true });

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }
  if (metricName) query = query.eq('metric_name', metricName);

  const { data } = await query.limit(100);
  return (data || []) as SeasonalIndex[];
}

// ============================================================
// ANALYTICS: MARKET ALERTS
// ============================================================

export interface MarketAlert {
  id: number;
  alert_type: string;
  city: string | null;
  zone: string | null;
  market: string | null;
  metric_name: string | null;
  current_value: number | null;
  expected_value: number | null;
  deviation_pct: number | null;
  severity: string;
  message: string | null;
  detected_at: string;
  resolved_at: string | null;
}

export async function getActiveAlerts(
  client: Client,
  city?: string,
  severity?: string,
): Promise<MarketAlert[]> {
  let query = client
    .from('market_alerts')
    .select('*')
    .is('resolved_at', null)
    .order('detected_at', { ascending: false });

  if (city) query = query.eq('city', city);
  if (severity) query = query.eq('severity', severity);

  const { data } = await query.limit(50);
  return (data || []) as MarketAlert[];
}

// ============================================================
// ANALYTICS: OCCUPANCY TREND (extended for charts)
// ============================================================

export async function getOccupancyTrend(
  client: Client,
  market: string,
  submarket?: string | null,
  months = 24,
): Promise<Array<{ date: string; value: number }>> {
  let query = client
    .from('airdna_metrics')
    .select('metric_date, metric_value')
    .eq('market', market)
    .eq('section', 'occupancy')
    .eq('chart', 'chart_1')
    .eq('metric_name', 'occupancy')
    .order('metric_date', { ascending: true })
    .limit(months);

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }

  const { data } = await query;
  if (!data) return [];

  const seen = new Set<string>();
  return data
    .filter((r: { metric_date: string; metric_value: number | null }) => {
      if (r.metric_value == null || seen.has(r.metric_date)) return false;
      seen.add(r.metric_date);
      return true;
    })
    .map((r: { metric_date: string; metric_value: number }) => ({
      date: r.metric_date,
      value: r.metric_value,
    }));
}

export async function getADRTrend(
  client: Client,
  market: string,
  submarket?: string | null,
  months = 24,
): Promise<Array<{ date: string; value: number }>> {
  let query = client
    .from('airdna_metrics')
    .select('metric_date, metric_value')
    .eq('market', market)
    .eq('section', 'rates')
    .eq('chart', 'chart_1')
    .eq('metric_name', 'daily_rate')
    .order('metric_date', { ascending: true })
    .limit(months);

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }

  const { data } = await query;
  if (!data) return [];

  const seen = new Set<string>();
  return data
    .filter((r: { metric_date: string; metric_value: number | null }) => {
      if (r.metric_value == null || seen.has(r.metric_date)) return false;
      seen.add(r.metric_date);
      return true;
    })
    .map((r: { metric_date: string; metric_value: number }) => ({
      date: r.metric_date,
      value: Math.round(r.metric_value),
    }));
}

// ============================================================
// BACKWARD COMPAT: old function names mapping to new
// ============================================================

/** @deprecated Use getDevelopments() */
export const getProperties = getDevelopments;
/** @deprecated Use getDevelopmentBySlug() */
export const getPropertyBySlug = getDevelopmentBySlug;
/** @deprecated Use getSimilarDevelopments() */
export const getSimilarProperties = getSimilarDevelopments;
/** @deprecated Use getFeaturedDevelopments() */
export const getFeaturedProperties = getFeaturedDevelopments;
/** @deprecated Use createContact() */
export const createLead = createContact;
/** @deprecated Use getContacts() */
export const getLeads = getContacts;
/** @deprecated Use createDevelopment() */
export const createProperty = createDevelopment;
/** @deprecated Use updateDevelopment() */
export const updateProperty = updateDevelopment;
/** @deprecated Use deleteDevelopment() */
export const deleteProperty = deleteDevelopment;
/** @deprecated Use bulkInsertDevelopments() */
export const bulkInsertProperties = bulkInsertDevelopments;
