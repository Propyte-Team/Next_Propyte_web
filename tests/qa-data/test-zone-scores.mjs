// Test directo: ¿public.zone_scores existe?
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 1. Test as default public schema
const { data: d1, error: e1, count: c1 } = await sb.from('zone_scores').select('*', { count: 'exact' }).limit(1);
console.log('public.zone_scores via .from():');
console.log('  error:', e1?.message, e1?.code);
console.log('  count:', c1);
console.log('  data sample:', d1?.[0]);
console.log();

// 2. Try inserting empty row to see if table exists
const { error: e2 } = await sb.from('zone_scores')
  .insert({ city: '__test__', zone: '__test__', score: 0 })
  .select()
  .single();
console.log('public.zone_scores via insert test:');
console.log('  error:', e2?.message, e2?.code);
if (!e2) {
  // cleanup
  await sb.from('zone_scores').delete().eq('city', '__test__');
  console.log('  → tabla EXISTE y es escribible (test row borrado)');
}
console.log();

// 3. Test investment_analytics.airdna_market_summary
const { error: e3 } = await sb.schema('investment_analytics').from('airdna_market_summary')
  .select('*', { count: 'exact', head: true });
console.log('investment_analytics.airdna_market_summary:');
console.log('  error:', e3?.message, e3?.code);

// 4. Test airdna_metrics (de migration 006)
const { count: c4, error: e4 } = await sb.schema('investment_analytics').from('airdna_metrics')
  .select('*', { count: 'exact', head: true });
console.log('investment_analytics.airdna_metrics:');
console.log('  error:', e4?.message, e4?.code);
console.log('  count:', c4);

// 5. Probar todos los esquemas posibles para zone_scores
for (const schema of ['public', 'investment_analytics', 'real_estate_hub', 'analytics']) {
  const { error } = await sb.schema(schema).from('zone_scores')
    .select('*', { count: 'exact', head: true });
  console.log(`${schema}.zone_scores:`, error ? `${error.code} ${error.message}` : 'EXISTS');
}
