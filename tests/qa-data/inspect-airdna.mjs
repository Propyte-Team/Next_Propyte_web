// Inspecciona airdna_metrics — qué markets/submarkets/metric_dates existen
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: sample } = await sb.schema('investment_analytics').from('airdna_metrics')
  .select('*').limit(3);
console.log('Sample row schema:');
console.log(JSON.stringify(sample?.[0], null, 2));
console.log();

// Markets distintos
const { data: markets } = await sb.schema('investment_analytics').from('airdna_metrics')
  .select('market').limit(10000);
const marketSet = new Set((markets || []).map(r => r.market));
console.log('Markets únicos:', [...marketSet].slice(0, 20));
console.log();

// Latest dates por market
const { data: latest } = await sb.schema('investment_analytics').from('airdna_metrics')
  .select('market, metric_date')
  .order('metric_date', { ascending: false })
  .limit(20);
console.log('Latest 20 metric_dates:');
latest?.forEach(r => console.log(`  ${r.market} — ${r.metric_date}`));
console.log();

// Submarkets para Playa del Carmen
const { data: submarkets } = await sb.schema('investment_analytics').from('airdna_metrics')
  .select('market, submarket')
  .eq('market', 'Playa del Carmen')
  .limit(1000);
const subSet = new Set((submarkets || []).map(r => r.submarket).filter(Boolean));
console.log(`Submarkets en Playa del Carmen (${subSet.size}):`, [...subSet]);
