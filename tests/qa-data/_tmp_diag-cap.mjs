// Diagnose BUG 1: cap_rate + rent missing from render despite ROI working
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l=>l && !l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/g,'')]}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

console.log('=== anon read development_financials full row ===');
const { data, error, count } = await sb.schema('investment_analytics').from('development_financials').select('*', { count: 'exact' });
console.log('count:', count, 'error:', error?.message || 'none');
if (data) console.log('rows sample:', JSON.stringify(data?.slice(0, 2), null, 2));

console.log('\n=== get AZUL VIVO id ===');
const { data: dev, error: devErr } = await sb.schema('real_estate_hub').from('v_developments').select('id, name, slug').eq('slug', 'sample-azul-vivo-5a4e4a4e').single();
console.log('dev:', JSON.stringify(dev), 'err:', devErr?.message || 'none');

if (dev?.id) {
  const { data: f, error: fe } = await sb.schema('investment_analytics').from('development_financials').select('*').eq('development_id', dev.id).single();
  console.log('\n=== eq(development_id, AZUL_id) ===');
  console.log('result:', JSON.stringify(f, null, 2), '\nerror:', fe?.message || 'none');
}
