/**
 * Cataloga los slots de materiales del sitio (FUENTE ÚNICA) para que el Hub los
 * liste automáticamente en "Materiales del sitio". El Hub hace fetch de este
 * endpoint (prod + staging) y lo usa como catálogo dinámico.
 */
import { NextResponse } from 'next/server';
import { SITE_MEDIA_SLOTS } from '@/lib/site-media/slots';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { slots: SITE_MEDIA_SLOTS },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  );
}
