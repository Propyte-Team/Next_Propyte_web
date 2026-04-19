import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopmentBySlug, getDeveloperProjectCount } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  const { data: dev, error: devErr } = await getDevelopmentBySlug(supabase, slug);

  const developerFields: Record<string, unknown> = {};
  if (dev) {
    for (const key of Object.keys(dev)) {
      if (key.toLowerCase().includes('developer') || key.toLowerCase().includes('desarrollador')) {
        developerFields[key] = (dev as Record<string, unknown>)[key];
      }
    }
  }

  let directDevelopersQuery: unknown = null;
  let directDevelopersError: unknown = null;
  if (dev && (dev as { developer_id?: string }).developer_id) {
    const devId = (dev as { developer_id: string }).developer_id;
    const r = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developers')
      .select('*')
      .eq('id', devId)
      .maybeSingle();
    directDevelopersQuery = r.data;
    directDevelopersError = r.error;
  }

  let projectCount = 0;
  let projectCountError: unknown = null;
  try {
    if (dev && (dev as { developer_id?: string }).developer_id) {
      projectCount = await getDeveloperProjectCount(supabase, (dev as { developer_id: string }).developer_id);
    }
  } catch (e) {
    projectCountError = e instanceof Error ? e.message : String(e);
  }

  const allKeys = dev ? Object.keys(dev).sort() : [];

  return NextResponse.json({
    slug,
    devFound: !!dev,
    devError: devErr,
    allKeys,
    developerFields,
    directDevelopersQuery,
    directDevelopersError,
    projectCount,
    projectCountError,
  }, { status: 200 });
}
