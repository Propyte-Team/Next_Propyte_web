import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8').split('\n').map(l => l.split('=').map(s => s?.trim())).filter(([k]) => k)
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Replicar la query de getDevelopmentBySlug
console.log('=== Query v_developments WHERE slug = sample-azul-vivo-... ===');
const { data: dev, error: devErr } = await client
  .schema('real_estate_hub')
  .from('v_developments')
  .select('*')
  .eq('slug', 'sample-azul-vivo-5a4e4a4e')
  .maybeSingle();

if (devErr) { console.error('DEV ERROR:', devErr); process.exit(1); }
console.log('developer_id:', dev?.developer_id);
console.log('developer_name:', dev?.developer_name);
console.log('developer_slug:', dev?.developer_slug);

console.log('\n=== Query v_developers WHERE slug = avica-inmobiliaria ===');
const { data: avica, error: avicaErr } = await client
  .schema('real_estate_hub')
  .from('v_developers')
  .select('id, name, slug, city, state, verified, years_experience, delivered_projects, delivered_units, active_projects, rating, approved_at, zoho_pipeline_status, website, description_es')
  .eq('slug', 'avica-inmobiliaria')
  .maybeSingle();

if (avicaErr) { console.error('AVICA ERROR:', avicaErr); process.exit(1); }
console.log(JSON.stringify(avica, null, 2));

console.log('\n=== Count projects of Avica ===');
const { count, error: cErr } = await client
  .schema('real_estate_hub')
  .from('v_developments')
  .select('id', { count: 'exact', head: true })
  .eq('developer_id', 'a6ca0000-0000-0000-0000-000000000001')
  .not('approved_at', 'is', null);

if (cErr) console.error('COUNT ERR:', cErr);
console.log('Avica project count:', count);
