import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopmentBySlug, APPROVED_STATUSES } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  const { data: property } = await getDevelopmentBySlug(supabase, slug);
  if (!property) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const p = property as Record<string, unknown>;
  const seed = {
    id: p.id as string,
    city: p.city as string,
    zone: (p.zone as string | null) || null,
    property_type: ((p.property_types as string[] | null) || [])[0] || null,
  };

  const hub = () => supabase.schema('real_estate_hub' as 'public');
  const base = () =>
    hub()
      .from('v_developments')
      .select('id, slug, name, city, zone, images, price_min_mxn, price_mxn, stage, property_types')
      .not('approved_at', 'is', null)
      .in('zoho_pipeline_status', APPROVED_STATUSES)
      .neq('id', seed.id)
      .limit(4);

  const results: Record<string, unknown> = {};
  try {
    if (seed.zone && seed.property_type) {
      const r = await base().eq('zone', seed.zone).contains('property_types', [seed.property_type]);
      results.L1 = { count: r.data?.length || 0, error: r.error?.message };
    }
  } catch (e) { results.L1 = { exception: String(e) }; }
  try {
    if (seed.zone) {
      const r = await base().eq('zone', seed.zone);
      results.L2 = { count: r.data?.length || 0, error: r.error?.message };
    }
  } catch (e) { results.L2 = { exception: String(e) }; }
  try {
    if (seed.city) {
      const r = await base().eq('city', seed.city);
      results.L3 = { count: r.data?.length || 0, error: r.error?.message };
    }
  } catch (e) { results.L3 = { exception: String(e) }; }
  try {
    const r = await base().eq('featured', true).order('created_at', { ascending: false });
    results.L4 = { count: r.data?.length || 0, error: r.error?.message };
  } catch (e) { results.L4 = { exception: String(e) }; }
  try {
    const r = await base().order('created_at', { ascending: false });
    results.L5 = { count: r.data?.length || 0, error: r.error?.message, firstSlugs: r.data?.slice(0, 3).map((d: Record<string, unknown>) => d.slug) };
  } catch (e) { results.L5 = { exception: String(e) }; }

  // Also count TOTAL v_developments for anon (no filters beyond approved)
  const total = await hub()
    .from('v_developments')
    .select('id', { count: 'exact', head: true })
    .not('approved_at', 'is', null)
    .in('zoho_pipeline_status', APPROVED_STATUSES);

  return NextResponse.json({ slug, seed, results, anonTotal: total.count, anonTotalError: total.error?.message });
}
