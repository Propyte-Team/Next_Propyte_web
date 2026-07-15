import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { buildComparison } from '@/lib/compare/build-comparison';

export const dynamic = 'force-dynamic';

// Validación de query params para GET /api/compare?kind=development&ids=uuid1,uuid2
// `ids` llega como string separado por comas; se transforma a array y cada
// elemento debe ser un UUID válido — esto evita que un id malformado tumbe
// el batch entero en Postgrest (buildComparison nunca lanza, pero un id no-UUID
// sí hace que la query de Supabase falle para todos los ids del lote).
const querySchema = z.object({
  kind: z.enum(['development', 'unit']),
  ids: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(2).max(4)),
});

export async function GET(request: Request) {
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

  const payload = await buildComparison(client, parsed.data.kind, parsed.data.ids);

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
}
