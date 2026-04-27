// Verifica que el frontend (anon key) puede leer las tablas/vistas creadas
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

console.log('=== anon read tests ===\n');

const { count: zsCount, error: zsErr } = await sb.from('zone_scores').select('*', { count: 'exact', head: true });
console.log(`zone_scores: count=${zsCount} ${zsErr ? '❌ ' + zsErr.message : '✅'}`);

const { count: dfCount, error: dfErr } = await sb.schema('investment_analytics').from('development_financials').select('*', { count: 'exact', head: true });
console.log(`development_financials (inv schema): count=${dfCount} ${dfErr ? '❌ ' + dfErr.message : '✅'}`);

const { data: amData, error: amErr } = await sb.schema('investment_analytics').from('airdna_market_summary').select('market, latest_date').limit(3);
console.log(`airdna_market_summary (inv schema): ${amErr ? '❌ ' + amErr.message : `✅ ${amData?.length} samples`}`);

// Test exactamente el query que getZoneScores usa
const { data: zsData, error: zsDataErr } = await sb.from('zone_scores').select('*').order('computed_at', { ascending: false }).limit(10);
console.log(`zone_scores via getZoneScores pattern: ${zsDataErr ? '❌ ' + zsDataErr.message : `✅ ${zsData?.length} rows returned`}`);
if (zsData?.[0]) {
  console.log('  sample:', { city: zsData[0].city, zone: zsData[0].zone, score: zsData[0].score, cluster: zsData[0].cluster_label });
}
