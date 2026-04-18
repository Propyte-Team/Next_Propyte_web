import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActiveAlerts } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || undefined;
    const severity = searchParams.get('severity') || undefined;

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const alerts = await getActiveAlerts(supabase, city, severity);

    return NextResponse.json({
      count: alerts.length,
      alerts,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('Market alerts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
