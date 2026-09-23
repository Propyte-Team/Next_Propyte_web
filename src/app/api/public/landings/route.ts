/**
 * Cataloga las landing pages que este build SIRVE de verdad (FUENTE ÚNICA),
 * para que el Hub las liste automáticamente en "Landing pages".
 *
 * Hermano de `/api/public/site-media-slots`. El Hub hace fetch de este endpoint
 * y reconcilia contra `real_estate_hub.landing_pages`: lo que aparece aquí y no
 * está en la tabla se da de alta solo; lo que está en la tabla y ya no aparece
 * aquí se marca `pausada`.
 *
 * Que la lista salga del build y no de `main` es deliberado: el deploy de
 * propyte.com compila EN EL SERVIDOR y no pasa por GitHub Actions, así que
 * "está en main" y "se está sirviendo" son cosas distintas. Este endpoint
 * responde la segunda.
 */
import { NextResponse } from 'next/server';
import { LP_MANIFEST } from '@/lib/lp/manifest.generated';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { landings: LP_MANIFEST },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  );
}
