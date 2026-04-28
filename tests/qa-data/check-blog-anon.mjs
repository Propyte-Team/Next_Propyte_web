// Audit: ¿el rol anon puede leer published blog_posts?
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);

console.log('=== anon (NEXT_PUBLIC_SUPABASE_ANON_KEY) ===');
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const r = await anon.from('blog_posts')
  .select('id, slug, status, locale, category, published_at, title')
  .eq('locale', 'es')
  .eq('status', 'published')
  .lte('published_at', new Date().toISOString());
console.log('rows:', r.data?.length, 'err:', r.error?.message);
if (r.data) console.log(JSON.stringify(r.data, null, 2));

console.log('\n=== service_role (control) ===');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const r2 = await sb.from('blog_posts')
  .select('id, slug, status, locale, category, published_at')
  .eq('locale', 'es')
  .eq('status', 'published');
console.log('rows:', r2.data?.length, 'err:', r2.error?.message);

console.log('\n=== RLS check ===');
const r3 = await sb.rpc('exec_sql', { sql: `
  SELECT polname, polroles::regrole[], polcmd, polqual::text
  FROM pg_policy WHERE polrelid = 'public.blog_posts'::regclass;
` }).catch(e => ({ error: e.message }));
console.log(r3.data ?? r3.error);
