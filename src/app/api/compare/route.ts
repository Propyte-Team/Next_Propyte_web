import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/rateLimit';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { buildComparison } from '@/lib/compare/build-comparison';

export const dynamic = 'force-dynamic';

// Lectura ligera pero hace fan-out a DB (hasta 4 devs × getUnits + AirDNA por
// item). Límite más holgado que generate-pdf (5/min) porque es barato y el
// usuario compara varias veces.
const RL = { bucket: 'compare', limit: 30, windowMs: 60_000 };

// Validación de query params para GET /api/compare?kind=development&ids=uuid1,uuid2
// `ids` llega como string separado por comas; se transforma a array, se
// deduplica y cada elemento debe ser un UUID válido — esto evita que un id
// malformado tumbe el batch entero en Postgrest. El dedup va ANTES del
// min(2)/max(4): `uuid,uuid` colapsa a 1 → falla min(2), que es correcto
// (no tiene sentido comparar algo consigo mismo).
const querySchema = z.object({
  kind: z.enum(['development', 'unit']),
  ids: z
    .string()
    .transform((s) => [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))])
    .pipe(z.array(z.string().uuid()).min(2).max(4)),
});

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, RL);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    kind: searchParams.get('kind'),
    ids: searchParams.get('ids') ?? '',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = createPublicSupabaseClient();
  if (!client) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  try {
    const payload = await buildComparison(client, parsed.data.kind, parsed.data.ids);
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('compare failed:', err);
    return NextResponse.json({ error: 'compare failed' }, { status: 500 });
  }
}
