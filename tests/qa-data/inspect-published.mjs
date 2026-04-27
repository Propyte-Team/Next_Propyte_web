// Inspecciona los 4 desarrollos publicados — coords + samples
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await sb.schema('real_estate_hub').from('Propyte_desarrollos')
  .select('id, nombre_desarrollo, ext_slug_desarrollo, ciudad, colonia, zona, calle, latitud, longitud, ext_precio_min_mxn, ext_publicado, web_status, approved_at')
  .eq('ext_publicado', true)
  .order('id');

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`\n=== ${data.length} desarrollos publicados ===\n`);
data.forEach(d => {
  console.log(`#${d.id} ${d.nombre_desarrollo}`);
  console.log(`  slug: ${d.ext_slug_desarrollo}`);
  console.log(`  ubicación: ${[d.calle, d.colonia, d.zona, d.ciudad].filter(Boolean).join(', ')}`);
  console.log(`  lat/lng: ${d.latitud ?? 'NULL'} / ${d.longitud ?? 'NULL'}`);
  console.log(`  precio min: ${d.ext_precio_min_mxn}`);
  console.log(`  status: ${d.web_status} | approved_at: ${d.approved_at?.slice(0, 10)}`);
  console.log();
});

const sinCoords = data.filter(d => !d.latitud || !d.longitud);
console.log(`\nResumen: ${data.length} publicados, ${sinCoords.length} SIN lat/lng`);
if (sinCoords.length > 0) {
  console.log(`Necesitan geocoding: ${sinCoords.map(d => d.id).join(', ')}`);
}
