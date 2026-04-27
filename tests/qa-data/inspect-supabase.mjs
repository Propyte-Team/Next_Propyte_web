// Inspecciona estado de tablas Supabase relevantes para #5/#7/#6
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false } });

async function inspect(label, builder, opts = {}) {
  const { count, error } = await builder.select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`  [${label}] ERROR: ${error.message} (code=${error.code})`);
    return null;
  }
  let cols = [];
  if (opts.sample && count > 0) {
    const { data } = await builder.select('*').limit(1);
    if (data?.[0]) cols = Object.keys(data[0]);
  }
  console.log(`  [${label}] ${count} rows${cols.length ? ` | ${cols.length} cols` : ''}`);
  if (opts.showCols && cols.length) console.log(`     cols: ${cols.slice(0, 30).join(', ')}${cols.length > 30 ? '...' : ''}`);
  return count;
}

console.log('\n=== #5 development_financials ===');
await inspect('investment_analytics.development_financials',
  sb.schema('investment_analytics').from('development_financials'), { sample: true, showCols: true });

console.log('\n=== #7 zone_scores (probando ubicaciones) ===');
await inspect('public.zone_scores (default schema)', sb.from('zone_scores'), { sample: true, showCols: true });
await inspect('investment_analytics.zone_scores',
  sb.schema('investment_analytics').from('zone_scores'), { sample: true });
await inspect('real_estate_hub.zone_scores',
  sb.schema('real_estate_hub').from('zone_scores'), { sample: true });

console.log('\n=== Tablas AirDNA (raw) ===');
await inspect('investment_analytics.airdna_market_summary',
  sb.schema('investment_analytics').from('airdna_market_summary'), { sample: true, showCols: true });
await inspect('investment_analytics.airdna_listings',
  sb.schema('investment_analytics').from('airdna_listings'), { sample: true });
await inspect('investment_analytics.airdna_zone_metrics',
  sb.schema('investment_analytics').from('airdna_zone_metrics'), { sample: true, showCols: true });

console.log('\n=== Tablas computadas/curated ===');
await inspect('investment_analytics.rental_estimates',
  sb.schema('investment_analytics').from('rental_estimates'), { sample: true, showCols: true });

console.log('\n=== Vistas frontend (default public) ===');
await inspect('v_developments', sb.from('v_developments'), { sample: true });
await inspect('v_units', sb.from('v_units'), { sample: true });
await inspect('v_developers', sb.from('v_developers'), { sample: true });

console.log('\n=== Inventario lat/lng en v_developments ===');
const { count: total } = await sb.from('v_developments')
  .select('*', { count: 'exact', head: true });
const { count: withCoords } = await sb.from('v_developments')
  .select('*', { count: 'exact', head: true })
  .not('latitude', 'is', null);
const { count: withLat } = await sb.from('v_developments')
  .select('*', { count: 'exact', head: true })
  .not('lat', 'is', null);
console.log(`  v_developments total: ${total}`);
console.log(`  con latitude: ${withCoords}`);
console.log(`  con lat (alt): ${withLat}`);

console.log('\n=== Sample v_developments columns ===');
const { data: samp } = await sb.from('v_developments').select('*').limit(1);
if (samp?.[0]) {
  const cols = Object.keys(samp[0]);
  console.log(`  ${cols.length} cols: ${cols.join(', ')}`);
}

console.log('\n=== Estado web_status / approved_at en raw ===');
const { count: pubRaw } = await sb.schema('real_estate_hub')
  .from('Propyte_desarrollos').select('*', { count: 'exact', head: true })
  .eq('ext_publicado', true);
const { count: approved } = await sb.schema('real_estate_hub')
  .from('Propyte_desarrollos').select('*', { count: 'exact', head: true })
  .not('approved_at', 'is', null);
const { count: webPub } = await sb.schema('real_estate_hub')
  .from('Propyte_desarrollos').select('*', { count: 'exact', head: true })
  .eq('web_status', 'published');
console.log(`  Propyte_desarrollos publicados (ext_publicado): ${pubRaw}`);
console.log(`  Propyte_desarrollos con approved_at: ${approved}`);
console.log(`  Propyte_desarrollos web_status='published': ${webPub}`);

console.log('\n=== zonas distintas con datos AirDNA ===');
const { data: zones } = await sb.schema('investment_analytics')
  .from('rental_estimates')
  .select('city, zone')
  .limit(50);
const uniq = [...new Set((zones || []).map(z => `${z.city} / ${z.zone}`))];
console.log(`  ${uniq.length} combinaciones únicas (top 20):`);
uniq.slice(0, 20).forEach(z => console.log(`    - ${z}`));
