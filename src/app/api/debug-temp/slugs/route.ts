import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * TEMP DEBUG — remove after P0 slug-null audit (2026-04-18).
 * Checks whether v_developments.slug comes back null from Supabase.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('id, slug, name, publication_title, approved_at, zoho_pipeline_status')
      .not('approved_at', 'is', null)
      .in('zoho_pipeline_status', ['aprobado', 'Aprobado', 'listo', 'Listo'])
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    const rows = (data || []) as Array<{
      id: string;
      slug: string | null;
      name: string | null;
      publication_title: string | null;
      approved_at: string | null;
      zoho_pipeline_status: string | null;
    }>;
    const nullSlugs = rows.filter((r) => !r.slug).length;
    const validSlugs = rows.filter((r) => r.slug).length;

    return NextResponse.json({
      total: rows.length,
      nullSlugs,
      validSlugs,
      sample: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        slugType: typeof r.slug,
        name: r.name,
        publication_title: r.publication_title,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
