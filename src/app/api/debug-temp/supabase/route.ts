import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Debug endpoint — remove once confirmed
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no client' });

  const hub = supabase.schema('real_estate_hub' as 'public');

  const devs = await hub
    .from('v_developments')
    .select('id, name, zone, city, property_types, available_units, total_units')
    .not('approved_at', 'is', null)
    .in('zoho_pipeline_status', ['aprobado', 'Aprobado', 'listo', 'Listo']);

  const data = (devs.data || []) as Array<Record<string, unknown>>;
  const zonesSet = new Set(data.map((d) => d.zone as string).filter(Boolean));
  const citiesSet = new Set(data.map((d) => d.city as string).filter(Boolean));
  const typeCounts: Record<string, number> = {};
  let totalAvailable = 0;
  let totalUnits = 0;
  for (const d of data) {
    if (d.property_types && Array.isArray(d.property_types)) {
      for (const t of d.property_types) typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    if (typeof d.available_units === 'number') totalAvailable += d.available_units;
    if (typeof d.total_units === 'number') totalUnits += d.total_units;
  }

  return NextResponse.json({
    total: data.length,
    zonesCount: zonesSet.size,
    zones: [...zonesSet].slice(0, 10),
    citiesCount: citiesSet.size,
    cities: [...citiesSet],
    typeCounts,
    totalAvailableUnits: totalAvailable,
    totalUnits,
    sample: data.slice(0, 3).map((d) => ({
      name: d.name,
      zone: d.zone,
      city: d.city,
      types: d.property_types,
      available: d.available_units,
      total: d.total_units,
    })),
  });
}
