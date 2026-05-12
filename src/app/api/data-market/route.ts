import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAirdnaMarketSummary } from '@/lib/supabase/queries';
import { CITY_TO_MARKET_CODE } from '@/lib/calculator';
import { enforceRateLimit } from '@/lib/rateLimit';

const RL = { bucket: 'data-market', limit: 30, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, RL);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const marketParam = searchParams.get('market');

    const market = marketParam || (city ? CITY_TO_MARKET_CODE[city] : null);
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
    const cityName = city || Object.entries(CITY_TO_MARKET_CODE).find(([, v]) => v === market)?.[0] || market;

    return NextResponse.json({
      market,
      city: cityName,
      summary,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200' },
    });
  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
