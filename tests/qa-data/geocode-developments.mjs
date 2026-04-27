// Geocodifica los desarrollos publicados sin lat/lng usando Google Maps Geocoding API
// Solo procesa los que tienen ext_publicado=true y latitud IS NULL
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!apiKey) { console.error('Missing GOOGLE_MAPS_API_KEY'); process.exit(1); }

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const APPLY = process.argv.includes('--apply');

async function geocodeGoogle(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=mx&key=${apiKey}`;
  const r = await fetch(url);
  const json = await r.json();
  if (json.status !== 'OK' || !json.results?.[0]) {
    return { ok: false, provider: 'google', status: json.status, error: json.error_message };
  }
  const top = json.results[0];
  return { ok: true, provider: 'google', lat: top.geometry.location.lat, lng: top.geometry.location.lng,
    formatted: top.formatted_address, location_type: top.geometry.location_type };
}

async function geocodeNominatim(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=mx&format=json&limit=1`;
  const r = await fetch(url, { headers: { 'User-Agent': 'PropyteGeocoder/1.0 (marketing@propyte.com)' } });
  if (!r.ok) return { ok: false, provider: 'nominatim', status: r.status };
  const json = await r.json();
  if (!json?.[0]) return { ok: false, provider: 'nominatim', status: 'no_results' };
  const top = json[0];
  return { ok: true, provider: 'nominatim', lat: parseFloat(top.lat), lng: parseFloat(top.lon),
    formatted: top.display_name, location_type: top.type };
}

async function geocode(address) {
  const g = await geocodeGoogle(address);
  if (g.ok) return g;
  console.log(`  google fallback (${g.status}); trying Nominatim...`);
  await new Promise(r => setTimeout(r, 1100)); // rate limit Nominatim 1 req/s
  return await geocodeNominatim(address);
}

const { data: rows, error } = await sb.schema('real_estate_hub').from('Propyte_desarrollos')
  .select('id, nombre_desarrollo, calle, colonia, zona, ciudad, estado, codigo_postal')
  .eq('ext_publicado', true)
  .is('latitud', null);

if (error) { console.error(error); process.exit(1); }

console.log(`\n=== Geocoding ${rows.length} desarrollos publicados sin coords ===`);
console.log(`Modo: ${APPLY ? 'APPLY (escribirá en Supabase)' : 'DRY-RUN (solo previsualiza)'}\n`);

const results = [];

for (const d of rows) {
  const parts = [d.calle, d.colonia, d.zona, d.ciudad, d.estado, d.codigo_postal, 'México'].filter(Boolean);
  const address = parts.join(', ');
  console.log(`#${d.id.slice(0, 8)} ${d.nombre_desarrollo}`);
  console.log(`  query: ${address}`);

  let r = await geocode(address);
  if (!r.ok) {
    console.log(`  ⚠ ${r.status} — fallback centroide ciudad`);
    const fallback = { 'Cancún': [21.1619, -86.8515], 'Playa del Carmen': [20.6296, -87.0739], 'Tulum': [20.2114, -87.4654] };
    const c = fallback[d.ciudad];
    if (c) {
      r = { ok: true, provider: 'fallback-centroid', lat: c[0], lng: c[1], formatted: `Centroide ${d.ciudad}` };
    } else {
      console.log(`  ❌ sin centroide para ${d.ciudad}\n`);
      results.push({ id: d.id, ok: false });
      continue;
    }
  }
  console.log(`  → lat ${r.lat}, lng ${r.lng} (${r.location_type})`);
  console.log(`  formatted: ${r.formatted}`);
  results.push({ id: d.id, lat: r.lat, lng: r.lng, ok: true });

  if (APPLY) {
    const { error: upErr } = await sb.schema('real_estate_hub').from('Propyte_desarrollos')
      .update({ latitud: r.lat, longitud: r.lng })
      .eq('id', d.id);
    if (upErr) console.log(`  ⚠ UPDATE error: ${upErr.message}`);
    else console.log(`  ✅ guardado`);
  }
  console.log();
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\n=== Resumen ===`);
console.log(`OK: ${results.filter(r => r.ok).length} / ${rows.length}`);
console.log(`Apply: ${APPLY ? 'sí' : 'no — corre con --apply para escribir'}`);
