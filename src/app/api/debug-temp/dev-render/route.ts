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
  }, { status: 200 });
}
