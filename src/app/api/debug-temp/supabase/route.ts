import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Debug endpoint — remove once confirmed
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no client' });

  const hub = supabase.schema('real_estate_hub' as 'public');

  const [devs, units, devsWithFilter, unitsWithFilter, devCol, unitCol] = await Promise.all([
    hub.from('v_developments').select('id', { count: 'exact', head: true }),
    hub.from('v_units').select('id', { count: 'exact', head: true }),
    hub
      .from('v_developments')
      .select('id', { count: 'exact', head: true })
      .not('approved_at', 'is', null)
      .in('zoho_pipeline_status', ['aprobado', 'Aprobado', 'listo', 'Listo']),
    hub
      .from('v_units')
      .select('id', { count: 'exact', head: true })
      .not('approved_at', 'is', null)
      .in('zoho_pipeline_status', ['aprobado', 'Aprobado', 'listo', 'Listo']),
    hub.from('v_developments').select('*').limit(1),
    hub.from('v_units').select('*').limit(1),
  ]);

  return NextResponse.json({
    counts_raw: { devs: devs.count, units: units.count },
    counts_filtered: { devs: devsWithFilter.count, units: unitsWithFilter.count },
    devErr: devs.error?.message,
    unitErr: units.error?.message,
    devFiltErr: devsWithFilter.error?.message,
    unitFiltErr: unitsWithFilter.error?.message,
    dev_sample_keys: devCol.data?.[0] ? Object.keys(devCol.data[0]) : [],
    unit_sample_keys: unitCol.data?.[0] ? Object.keys(unitCol.data[0]) : [],
    dev_sample_status: devCol.data?.[0] ? { approved_at: (devCol.data[0] as any).approved_at, zoho: (devCol.data[0] as any).zoho_pipeline_status } : null,
    unit_sample_status: unitCol.data?.[0] ? { approved_at: (unitCol.data[0] as any).approved_at, zoho: (unitCol.data[0] as any).zoho_pipeline_status } : null,
  });
}
