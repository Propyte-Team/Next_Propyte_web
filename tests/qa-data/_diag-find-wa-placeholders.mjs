import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PLACE = ['529840000000', '529841234567', '9840000000', '9841234567'];

console.log('=== Buscando placeholders WA ===\n');

const { data: devs, error: e1 } = await sb.schema('real_estate_hub').from('Propyte_desarrollos')
  .select('id, slug, name, ext_whatsapp_telefono, whatsapp_telefono, contact_whatsapp')
  .or(PLACE.map(p => `ext_whatsapp_telefono.like.%${p}%`).join(','));
console.log('Propyte_desarrollos:', e1 ? '❌ '+e1.message : `${devs?.length||0} hits`);
if (devs?.length) console.log(JSON.stringify(devs, null, 2));

const { data: developers, error: e2 } = await sb.schema('real_estate_hub').from('Propyte_desarrolladores')
  .select('id, slug, name, whatsapp_phone, ext_whatsapp_telefono, whatsapp_telefono, contact_whatsapp');
console.log('\nPropyte_desarrolladores (all):', e2 ? '❌ '+e2.message : `${developers?.length||0} rows`);
if (developers?.length) {
  developers.forEach(d => {
    const phones = ['whatsapp_phone', 'ext_whatsapp_telefono', 'whatsapp_telefono', 'contact_whatsapp']
      .map(k => `${k}=${d[k] ?? '∅'}`).join(' | ');
    console.log(`  ${d.slug || d.id}: ${phones}`);
  });
}
