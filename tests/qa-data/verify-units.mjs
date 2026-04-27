// Verifica que /propiedades pueda mostrar samples — qué unidades publicadas hay
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));

const sbAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const sbSvc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log('=== Propyte_unidades (raw service_role) ===');
const { count: rawTotal } = await sbSvc.schema('real_estate_hub').from('Propyte_unidades').select('*', { count: 'exact', head: true });
const { count: rawApproved } = await sbSvc.schema('real_estate_hub').from('Propyte_unidades').select('*', { count: 'exact', head: true })
  .not('approved_at', 'is', null);
const { count: rawPublished } = await sbSvc.schema('real_estate_hub').from('Propyte_unidades').select('*', { count: 'exact', head: true })
  .eq('ext_publicado', true);
console.log(`  total: ${rawTotal}`);
console.log(`  approved_at NOT NULL: ${rawApproved}`);
console.log(`  ext_publicado = true: ${rawPublished}`);

console.log('\n=== v_units (anon key, lo que /propiedades usa) ===');
const { count: viewCount, error: viewErr } = await sbAnon.schema('real_estate_hub').from('v_units').select('*', { count: 'exact', head: true });
console.log(`  count: ${viewCount} ${viewErr ? '❌ ' + viewErr.message : '✅'}`);

const { data: viewSample } = await sbAnon.schema('real_estate_hub').from('v_units').select('id, slug, name, price_mxn, city, zone, status, approved_at, zoho_pipeline_status').limit(5);
console.log(`  sample rows: ${viewSample?.length || 0}`);
viewSample?.forEach(u => console.log(`    ${u.slug || u.id?.slice(0,8)} → ${u.name?.slice(0,40)} | ${u.city}/${u.zone} | ${u.price_mxn} | status:${u.status} | approved:${u.approved_at?.slice(0,10)} | pipeline:${u.zoho_pipeline_status}`));

console.log('\n=== Replicating getUnits() filter (approved + APPROVED_STATUSES) ===');
const APPROVED_STATUSES = ['Approved', 'Aprobado', 'En sitio web', 'Sincronizado'];
const { data: filtered, count } = await sbAnon.schema('real_estate_hub').from('v_units').select('id, slug, name, status, zoho_pipeline_status', { count: 'exact' })
  .not('approved_at', 'is', null)
  .in('zoho_pipeline_status', APPROVED_STATUSES);
console.log(`  unidades aprobadas+pipeline OK: ${count}`);
filtered?.slice(0, 6).forEach(u => console.log(`    ${u.slug || u.id?.slice(0,8)} → ${u.name?.slice(0,50)} | pipeline:${u.zoho_pipeline_status}`));

console.log('\n=== getDevelopments() — desarrollos visibles ===');
const { count: devCount } = await sbAnon.schema('real_estate_hub').from('v_developments').select('*', { count: 'exact', head: true })
  .not('approved_at', 'is', null)
  .in('zoho_pipeline_status', APPROVED_STATUSES);
console.log(`  desarrollos visibles (anon + filtros): ${devCount}`);
