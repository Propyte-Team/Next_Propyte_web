import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Sample 100 metrics from playa_del_carmen
const { data } = await sb.schema('investment_analytics').from('airdna_metrics')
  .select('metric_name, metric_value, metric_date, submarket')
  .eq('market', 'playa_del_carmen')
  .order('metric_date', { ascending: false })
  .limit(200);

const names = new Map();
data?.forEach(r => {
  if (!names.has(r.metric_name)) names.set(r.metric_name, []);
  names.get(r.metric_name).push(r.metric_value);
});

console.log('Metric names for playa_del_carmen (sample 200, last):');
[...names.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([name, values]) => {
    const avg = values.reduce((s, v) => s + Number(v), 0) / values.length;
    console.log(`  ${name} (${values.length}× ) avg=${avg.toFixed(2)}`);
  });
