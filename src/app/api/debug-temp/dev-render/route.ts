import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getDevelopmentBySlug,
  getDevelopmentWithUnits,
  getDeveloperById,
  getDeveloperProjectCount,
  getSimilarDevelopments,
} from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  // Mirror DevelopmentDetailPage query path exactly
  let property: Record<string, unknown> | null = null;
  let queryPath = 'none';
  let errors: string[] = [];

  try {
    const { data, error } = await getDevelopmentWithUnits(supabase, slug);
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { units: _u, ...devData } = data as Record<string, unknown> & { units?: unknown };
      property = devData;
      queryPath = 'getDevelopmentWithUnits';
    } else if (error) {
      errors.push(`getDevelopmentWithUnits: ${error.message}`);
    }
  } catch (e) {
    errors.push(`getDevelopmentWithUnits threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!property) {
    try {
      const { data, error } = await getDevelopmentBySlug(supabase, slug);
      if (data) {
        property = data as Record<string, unknown>;
        queryPath = 'getDevelopmentBySlug';
      } else if (error) errors.push(`getDevelopmentBySlug: ${error.message}`);
    } catch (e) {
      errors.push(`getDevelopmentBySlug threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!property) {
    return NextResponse.json({ slug, queryPath, errors, found: false }, { status: 200 });
  }

  const developerId = (property.developer_id as string | null) ?? null;
  const developerRenderFields = {
    developer_id: property.developer_id ?? null,
    developer_name: property.developer_name ?? null,
    developer_slug: property.developer_slug ?? null,
    developer_logo_url: property.developer_logo_url ?? null,
  };

  let developerRecord: unknown = null;
  let developerRecordError: string | null = null;
  if (developerId) {
    try {
      developerRecord = await getDeveloperById(supabase, developerId);
    } catch (e) {
      developerRecordError = e instanceof Error ? e.message : String(e);
    }
  }

  let projectCount = 0;
  let projectCountError: string | null = null;
  if (developerId) {
    try {
      projectCount = await getDeveloperProjectCount(supabase, developerId);
    } catch (e) {
      projectCountError = e instanceof Error ? e.message : String(e);
    }
  }

  // Also test similar
  let similarCount = -1;
  let similarError: string | null = null;
  try {
    const res = await getSimilarDevelopments(supabase, {
      id: property.id as string,
      city: property.city as string,
      zone: (property.zone as string | null) || null,
      property_type: ((property.property_types as string[] | null)?.[0]) || null,
    }, 4);
    similarCount = res.length;
  } catch (e) {
    similarError = e instanceof Error ? e.message : String(e);
  }

  // Additional anon probes: read each filter variant of Propyte_desarrolladores for Avica's id
  const avicaProbes: Record<string, unknown> = {};
  if (developerId) {
    const probeDefs: Array<[string, (q: ReturnType<typeof makeQ>) => ReturnType<typeof makeQ>]> = [
      ['bareEq', (q) => q.eq('id', developerId)],
      ['byApprovedAt', (q) => q.eq('id', developerId).not('approved_at', 'is', null)],
      ['byPipelineIn', (q) => q.eq('id', developerId).in('zoho_pipeline_status', ['aprobado', 'Aprobado', 'Listo', 'listo'])],
      ['ilikeName', (q) => q.ilike('nombre_desarrollador', '%avica%')],
    ];

    function makeQ() {
      return supabase!.schema('real_estate_hub' as 'public')
        .from('Propyte_desarrolladores')
        .select('id, nombre_desarrollador, ext_slug_desarrollador, approved_at, zoho_pipeline_status, ext_publicado, deleted_at');
    }

    for (const [name, build] of probeDefs) {
      try {
        const r = await build(makeQ());
        avicaProbes[name] = { data: r.data, error: r.error?.message };
      } catch (e) {
        avicaProbes[name] = { exception: e instanceof Error ? e.message : String(e) };
      }
    }
  }

  // Also probe v_developers directly
  let vDevelopersForAvica: unknown = null;
  if (developerId) {
    try {
      const r = await supabase.schema('real_estate_hub' as 'public')
        .from('v_developers')
        .select('*')
        .eq('id', developerId)
        .maybeSingle();
      vDevelopersForAvica = { data: r.data, error: r.error?.message };
    } catch (e) {
      vDevelopersForAvica = { exception: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    slug,
    queryPath,
    errors,
    developerRenderFields,
    developerRecord,
    developerRecordError,
    projectCount,
    projectCountError,
    similarCount,
    similarError,
    avicaProbes,
    vDevelopersForAvica,
  }, { status: 200 });
}
