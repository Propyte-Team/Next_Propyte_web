import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getZoneDetail,
  getOccupancyTrend,
  getADRTrend,
  getForecasts,
  getSeasonalIndices,
} from '@/lib/supabase/queries';
import { CITY_TO_AIRDNA, ZONE_TO_AIRDNA_SUBMARKETS } from '@/lib/calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const zone = searchParams.get('zone');

    if (!city || !zone) {
      return NextResponse.json({ error: 'city and zone parameters required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const market = CITY_TO_AIRDNA[city] || city.toLowerCase();
    const submarketCodes = ZONE_TO_AIRDNA_SUBMARKETS[zone] || [];
    const submarket = submarketCodes[0] || null;

    // Fetch all data in parallel
    const [zoneDetail, occupancyTrend, adrTrend, forecasts, seasonality] = await Promise.all([
      getZoneDetail(supabase, city, zone),
      getOccupancyTrend(supabase, market, submarket, 36),
      getADRTrend(supabase, market, submarket, 36),
      getForecasts(supabase, market, submarket),
      getSeasonalIndices(supabase, market, submarket),
    ]);

    // Separate forecasts by metric
    const occupancyForecasts = forecasts.filter(f => f.metric_name === 'occupancy');
    const adrForecasts = forecasts.filter(f => f.metric_name === 'daily_rate');
    const revparForecasts = forecasts.filter(f => f.metric_name === 'revpar');

    // Separate seasonality by metric
    const occupancySeasonality = seasonality.filter(s => s.metric_name === 'occupancy');
    const adrSeasonality = seasonality.filter(s => s.metric_name === 'daily_rate');

    return NextResponse.json({
      city,
      zone,
      market,
      submarket,
      score: zoneDetail.score,
      trends: {
        occupancy: occupancyTrend,
        adr: adrTrend,
      },
      forecasts: {
        occupancy: occupancyForecasts,
        adr: adrForecasts,
        revpar: revparForecasts,
      },
      seasonality: {
        occupancy: occupancySeasonality,
        adr: adrSeasonality,
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('Zone detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
