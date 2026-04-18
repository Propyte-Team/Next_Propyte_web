import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAirdnaMarketSummary } from '@/lib/supabase/queries';
import { CITY_TO_AIRDNA } from '@/lib/calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const marketParam = searchParams.get('market');

    const market = marketParam || (city ? CITY_TO_AIRDNA[city] : null);
    if (!market) {
      return NextResponse.json({ error: 'city or market parameter required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const summary = await getAirdnaMarketSummary(supabase, market);

    if (!summary) {
      return NextResponse.json({ market, city: city || market, summary: null }, {
        headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200' },
      });
    }

    // Find the city name from the market slug
    const cityName = city || Object.entries(CITY_TO_AIRDNA).find(([, v]) => v === market)?.[0] || market;

    return NextResponse.json({
      market,
      city: cityName,
      summary,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200' },
    });
  } catch (error) {
    console.error('AirDNA market API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
