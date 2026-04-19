import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopmentBySlug, getDeveloperById } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  const { data: p } = await getDevelopmentBySlug(supabase, slug);
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const pr = p as Record<string, unknown>;
  const devId = pr.developer_id as string | null;
  const record = devId ? await getDeveloperById(supabase, devId) : null;

  // Also probe v_developers directly
  let vDev: unknown = null;
  if (devId) {
    const r = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developers')
      .select('*')
      .eq('id', devId)
      .maybeSingle();
    vDev = { data: r.data, error: r.error?.message };
  }

  return NextResponse.json({
    slug,
    fromView: {
      developer_id: pr.developer_id,
      developer_name: pr.developer_name,
      developer_slug: pr.developer_slug,
      developer_logo_url: pr.developer_logo_url,
    },
    getDeveloperByIdResult: record,
    vDevelopersDirectQuery: vDev,
  });
}
