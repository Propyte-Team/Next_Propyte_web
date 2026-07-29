import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getRentalAnalysis } from '@/lib/rental-data/analysis';

export const revalidate = 3600; // Cache for 1 hour

const RL = { bucket: 'rental-analysis', limit: 15, windowMs: 60_000 };

// La logica vive en lib/rental-data/analysis.ts porque el server component de /mercado
// tambien la necesita. Esta ruta queda para el refetch interactivo del cliente.
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, RL);
  if (limited) return limited;

  const city = request.nextUrl.searchParams.get('city');
  const data = await getRentalAnalysis(city);
  if (!data) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
