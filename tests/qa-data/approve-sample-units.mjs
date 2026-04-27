// Aprueba las 6 unidades del SAMPLE AZUL VIVO para que aparezcan en /propiedades
// Idempotente — re-correr no causa daño.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SAMPLE_DEV_ID = '5a4e4a4e-0000-0000-0000-000000000001'; // SAMPLE AZUL VIVO

const { data, error } = await sb.schema('real_estate_hub').from('Propyte_unidades')
  .update({
    approved_at: new Date().toISOString(),
    approved_by: 'sample-bootstrap',
    ext_publicado: true,
    zoho_pipeline_status: 'published',
    web_status: 'published',
  })
  .eq('id_desarrollo', SAMPLE_DEV_ID)
  .select('slug_unidad, zoho_pipeline_status');

if (error) { console.error('ERR:', error.message); process.exit(1); }

console.log(`✅ Aprobadas ${data?.length} unidades del SAMPLE AZUL VIVO`);
data?.forEach(u => console.log(`  ${u.slug_unidad} → ${u.zoho_pipeline_status}`));
