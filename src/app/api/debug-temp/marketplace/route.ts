import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getDevelopments } from '@/lib/supabase/queries';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';

export async function GET() {
  try {
    const supabase = (await createServiceRoleClient()) || (await createServerSupabaseClient());
    if (!supabase) return NextResponse.json({ error: 'no client' });

    const res = await getDevelopments(supabase, { limit: 100 });
    const rawCount = res.data?.length || 0;
    const error = res.error?.message || null;

    const mapped = (res.data as DevelopmentRow[] | null)?.map(mapDevelopmentToProperty) || [];
    const firstMapped = mapped[0] || null;

    return NextResponse.json({
      rawCount,
      mappedCount: mapped.length,
      error,
      countFromDB: res.count,
      firstMapped,
    });
  } catch (err) {
    return NextResponse.json({
      error: String(err),
    });
  }
}
