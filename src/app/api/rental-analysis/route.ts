import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const revalidate = 3600; // Cache for 1 hour

// ── Data cleaning constants (mirrors Python pipeline) ──
const RENT_MIN = 2_000;
const RENT_MAX = 500_000;
const AREA_MIN = 15;
const AREA_MAX = 800;
const RENT_PER_M2_MIN = 20;
const RENT_PER_M2_MAX = 2_000;
const BEDROOMS_MAX = 10;
const IQR_MULTIPLIER = 2.5;

interface RawComparable {
  city: string;
  zone: string | null;
  property_type: string;
  bedrooms: number | null;
  monthly_rent_mxn: number;
  area_m2: number | null;
  rental_type: string;
  is_furnished: boolean | null;
  source_portal: string;
  scraped_at: string;
}

function cleanComparables(raw: RawComparable[]): { cleaned: RawComparable[]; removed: Record<string, number> } {
  const removed: Record<string, number> = {};
  let data = [...raw];

  const filter = (fn: (r: RawComparable) => boolean, reason: string) => {
    const before = data.length;
    data = data.filter(fn);
    const n = before - data.length;
    if (n > 0) removed[reason] = n;
  };

  // Stage 1: Rent bounds
  filter(r => r.monthly_rent_mxn >= RENT_MIN, `rent < $${RENT_MIN.toLocaleString()}`);
  filter(r => r.monthly_rent_mxn <= RENT_MAX, `rent > $${RENT_MAX.toLocaleString()} (sale price)`);

  // Stage 2: Area bounds (only filter if area exists)
  filter(r => !r.area_m2 || r.area_m2 >= AREA_MIN, `area < ${AREA_MIN}m²`);
  filter(r => !r.area_m2 || r.area_m2 <= AREA_MAX, `area > ${AREA_MAX}m²`);

  // Stage 3: Rent/m² bounds
  filter(r => {
    if (!r.area_m2 || r.area_m2 < AREA_MIN) return true; // no area = keep
    const rpm2 = r.monthly_rent_mxn / r.area_m2;
    return rpm2 >= RENT_PER_M2_MIN && rpm2 <= RENT_PER_M2_MAX;
  }, 'rent/m² out of range');

  // Stage 4: Bedrooms
  filter(r => !r.bedrooms || r.bedrooms <= BEDROOMS_MAX, `bedrooms > ${BEDROOMS_MAX}`);

  // Stage 5: Zone-level IQR outlier removal
  const byZone = new Map<string, RawComparable[]>();
  for (const r of data) {
    const key = `${r.city}::${r.zone || ''}`;
    if (!byZone.has(key)) byZone.set(key, []);
    byZone.get(key)!.push(r);
  }

  const outlierIds = new Set<number>();
  for (const group of byZone.values()) {
    if (group.length < 5) continue;
    const rents = group.map(r => r.monthly_rent_mxn).sort((a, b) => a - b);
    const q1 = rents[Math.floor(rents.length * 0.25)];
    const q3 = rents[Math.floor(rents.length * 0.75)];
    const iqr = q3 - q1;
    if (iqr === 0) continue;
    const lower = q1 - IQR_MULTIPLIER * iqr;
    const upper = q3 + IQR_MULTIPLIER * iqr;
    for (let i = 0; i < group.length; i++) {
      if (group[i].monthly_rent_mxn < lower || group[i].monthly_rent_mxn > upper) {
        outlierIds.add(data.indexOf(group[i]));
      }
    }
  }
  if (outlierIds.size > 0) {
    removed['zone IQR outlier'] = outlierIds.size;
    data = data.filter((_, i) => !outlierIds.has(i));
  }

  // Stage 6: Dedup (same city+zone+rent+area+beds+type)
  const seen = new Set<string>();
  const beforeDedup = data.length;
  data = data.filter(r => {
    const key = `${r.city}|${r.zone}|${r.monthly_rent_mxn}|${r.area_m2}|${r.bedrooms}|${r.property_type}|${r.rental_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const nDedup = beforeDedup - data.length;
  if (nDedup > 0) removed['duplicates'] = nDedup;

  return { cleaned: data, removed };
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const city = searchParams.get('city');

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch development financials with development info
    let devQuery = supabase
      .from('development_financials')
      .select(`
        *,
        developments!inner(
          id, slug, name, city, zone, state, stage,
          property_types, price_min_mxn, price_max_mxn,
          images, published, deleted_at
        )
      `)
      .is('developments.deleted_at', null)
      .eq('developments.published', true);

    if (city) {
      devQuery = devQuery.eq('developments.city', city);
    }

    const { data: financials } = await devQuery
      .order('rent_yield_gross', { ascending: false })
      .limit(100);

    // 2. Fetch ALL rental comparables
    const allComparables: RawComparable[] = [];
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page } = await supabase
        .from('rental_comparables')
        .select('city, zone, property_type, bedrooms, monthly_rent_mxn, area_m2, rental_type, is_furnished, source_portal, scraped_at')
        .eq('active', true)
        .gte('monthly_rent_mxn', 1000)
        .range(offset, offset + pageSize - 1);
      if (!page || page.length === 0) break;
      allComparables.push(...(page as RawComparable[]));
      if (page.length < pageSize) break;
      offset += pageSize;
    }

    // 3. Clean data (same 6-stage pipeline as Python)
    const { cleaned: comparables, removed } = cleanComparables(allComparables);

    // Source stats
    const sourceMap: Record<string, number> = {};
    let latestScraped = '';
    for (const r of comparables) {
      const src = r.source_portal || 'otro';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
      if (r.scraped_at && r.scraped_at > latestScraped) latestScraped = r.scraped_at;
    }
    const sourceStats = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate comparables by city
    const cityGroups: Record<string, RawComparable[]> = {};
    for (const r of comparables) {
      if (!cityGroups[r.city]) cityGroups[r.city] = [];
      cityGroups[r.city].push(r);
    }

    const cityStats = Object.entries(cityGroups).map(([cityName, rows]) => {
      const rents = rows.map(r => r.monthly_rent_mxn);
      const areasWithM2 = rows.filter(r => r.area_m2 && r.area_m2 >= AREA_MIN);
      const rentPerM2 = areasWithM2.map(r => r.monthly_rent_mxn / r.area_m2!);

      // By type
      const byType: Record<string, { count: number; avg_rent: number; median_rent: number }> = {};
      for (const r of rows) {
        const pt = r.property_type || 'otro';
        if (!byType[pt]) byType[pt] = { count: 0, avg_rent: 0, median_rent: 0 };
        byType[pt].count++;
      }
      for (const [pt, stats] of Object.entries(byType)) {
        const typeRents = rows.filter(r => (r.property_type || 'otro') === pt).map(r => r.monthly_rent_mxn);
        stats.median_rent = median(typeRents);
        stats.avg_rent = Math.round(typeRents.reduce((a, b) => a + b, 0) / typeRents.length);
      }

      // By bedrooms
      const byBedrooms: Record<string, { count: number; avg_rent: number; median_rent: number }> = {};
      for (const r of rows) {
        const beds = String(r.bedrooms ?? 'N/A');
        if (!byBedrooms[beds]) byBedrooms[beds] = { count: 0, avg_rent: 0, median_rent: 0 };
        byBedrooms[beds].count++;
      }
      for (const [beds, stats] of Object.entries(byBedrooms)) {
        const bedRents = rows.filter(r => String(r.bedrooms ?? 'N/A') === beds).map(r => r.monthly_rent_mxn);
        stats.median_rent = median(bedRents);
        stats.avg_rent = Math.round(bedRents.reduce((a, b) => a + b, 0) / bedRents.length);
      }

      return {
        city: cityName,
        count: rows.length,
        avg_rent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
        median_rent: median(rents),
        min_rent: Math.min(...rents),
        max_rent: Math.max(...rents),
        avg_rent_m2: rentPerM2.length > 0
          ? Math.round(rentPerM2.reduce((a, b) => a + b, 0) / rentPerM2.length * 100) / 100
          : null,
        median_rent_m2: rentPerM2.length > 0
          ? Math.round(median(rentPerM2) * 100) / 100
          : null,
        by_type: byType,
        by_bedrooms: byBedrooms,
      };
    }).sort((a, b) => b.count - a.count);

    // Model summary
    const modelInfo = financials && financials.length > 0
      ? { version: (financials[0] as Record<string, unknown>).model_version, last_computed: (financials[0] as Record<string, unknown>).last_computed }
      : null;

    return NextResponse.json({
      comparables: comparables.map(r => ({
        city: r.city,
        zone: r.zone,
        pt: r.property_type,
        beds: r.bedrooms,
        rent: r.monthly_rent_mxn,
        m2: r.area_m2,
        rt: r.rental_type,
        fur: r.is_furnished,
      })),
      developments: (financials || []).map((f: Record<string, unknown>) => {
        const dev = f.developments as Record<string, unknown> | null;
        return {
          id: f.development_id,
          slug: dev?.slug,
          name: dev?.name,
          city: dev?.city,
          zone: dev?.zone,
          stage: dev?.stage,
          price_min: dev?.price_min_mxn,
          price_max: dev?.price_max_mxn,
          image: (dev?.images as string[])?.[0] || null,
          roi_annual_pct: f.roi_annual_pct,
          irr_5yr: f.irr_5yr,
          irr_10yr: f.irr_10yr,
          cash_on_cash_pct: f.cash_on_cash_pct,
          breakeven_months: f.breakeven_months,
          monthly_net_flow: f.monthly_net_flow,
          cap_rate: f.cap_rate,
          rent_yield_gross: f.rent_yield_gross,
          rent_yield_net: f.rent_yield_net,
          estimated_rent: f.estimated_rent_residencial,
          estimated_rent_vac: f.estimated_rent_vacacional,
          roi_annual_pct_vac: f.roi_annual_pct_vac,
          irr_5yr_vac: f.irr_5yr_vac,
          cap_rate_vac: f.cap_rate_vac,
          rent_yield_gross_vac: f.rent_yield_gross_vac,
          rent_yield_net_vac: f.rent_yield_net_vac,
          monthly_net_flow_vac: f.monthly_net_flow_vac,
          occupancy_rate_vac: f.occupancy_rate_vac,
        };
      }),
      city_stats: cityStats,
      source_stats: sourceStats,
      data_freshness: latestScraped || null,
      data_quality: {
        raw_count: allComparables.length,
        clean_count: comparables.length,
        removed_count: allComparables.length - comparables.length,
        removed_pct: Math.round((allComparables.length - comparables.length) / allComparables.length * 100),
        removed_reasons: removed,
      },
      model: modelInfo,
      total_comparables: comparables.length,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('Rental analysis API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
