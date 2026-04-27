import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log('\n=== zone_scores (debe tener filas) ===');
const { count: zsCount } = await sb.from('zone_scores').select('*', { count: 'exact', head: true });
console.log(`  total: ${zsCount}`);
const { data: top5 } = await sb.from('zone_scores')
  .select('city, zone, score, cluster_label, median_adr, median_occupancy')
  .order('score', { ascending: false })
  .limit(5);
console.log('  top 5 by score:');
top5?.forEach(z => console.log(`    ${z.city} / ${z.zone} → ${z.score} (${z.cluster_label}) | ADR ${z.median_adr ?? '—'} occ ${z.median_occupancy ?? '—'}`));

console.log('\n=== airdna_market_summary (vista) ===');
const { data: summ, error: sumErr } = await sb.schema('investment_analytics').from('airdna_market_summary').select('*');
if (sumErr) console.log(`  error: ${sumErr.message}`);
else summ?.forEach(s => console.log(`  ${s.market} | latest: ${s.latest_date} | submkts ${s.submarkets_count} | occ ${s.avg_occupancy} adr ${s.avg_adr} revpar ${s.avg_revpar}`));

console.log('\n=== development_financials (debe tener 4 filas) ===');
const { count: dfCount } = await sb.schema('investment_analytics').from('development_financials').select('*', { count: 'exact', head: true });
console.log(`  total: ${dfCount}`);
const { data: fin } = await sb.schema('investment_analytics').from('development_financials')
  .select('development_id, cap_rate, cap_rate_vac, roi_annual_pct, roi_annual_pct_vac, estimated_rent_residencial, estimated_rent_vacacional, model_version');
fin?.forEach(f => console.log(`  ${f.development_id.slice(0, 8)} → cap_res ${f.cap_rate}% cap_vac ${f.cap_rate_vac}% ROI_res ${f.roi_annual_pct}% ROI_vac ${f.roi_annual_pct_vac}% rent_res ${f.estimated_rent_residencial} rent_vac ${f.estimated_rent_vacacional}`));
