import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getForecasts, getOccupancyTrend, getADRTrend } from '@/lib/supabase/queries';
import { CITY_TO_AIRDNA } from '@/lib/calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const marketParam = searchParams.get('market');
    const metric = searchParams.get('metric') || undefined;

    const market = marketParam || (city ? CITY_TO_AIRDNA[city] : null);
    if (!market) {
      return NextResponse.json({ error: 'city or market parameter required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Fetch historical data and forecasts in parallel
    const [forecasts, occupancyHistory, adrHistory] = await Promise.all([
      getForecasts(supabase, market, null, metric),
      getOccupancyTrend(supabase, market, null, 36),
      getADRTrend(supabase, market, null, 36),
    ]);

    return NextResponse.json({
      market,
      history: {
        occupancy: occupancyHistory,
        adr: adrHistory,
      },
      forecasts,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('Market forecast API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
