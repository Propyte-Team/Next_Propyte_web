// Audit blog_posts: location, schema, status, locale mapping
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log('--- public.blog_posts ---');
const r1 = await sb.from('blog_posts').select('id', { count: 'exact', head: true });
console.log('count:', r1.count, 'err:', r1.error?.message);

if (r1.count) {
  const r2 = await sb.from('blog_posts')
    .select('id, locale, slug, status, category, published_at, title')
    .order('id', { ascending: false })
    .limit(20);
  console.log('rows:', JSON.stringify(r2.data, null, 2));

  const all = await sb.from('blog_posts').select('status, locale, category');
  const byKey = {};
  for (const row of all.data || []) {
    const k = `${row.status}|${row.locale}|${row.category}`;
    byKey[k] = (byKey[k] || 0) + 1;
  }
  console.log('by status|locale|category:', byKey);
}

console.log('--- real_estate_hub.blog_posts ---');
const r3 = await sb.schema('real_estate_hub').from('blog_posts').select('id', { count: 'exact', head: true }).catch(e => ({ error: e.message }));
console.log('count:', r3.count, 'err:', r3.error?.message ?? r3.error);

console.log('--- public.wk_blog_posts ---');
const r4 = await sb.from('wk_blog_posts').select('id', { count: 'exact', head: true });
console.log('count:', r4.count, 'err:', r4.error?.message);

for (const schema of ['blog', 'cms', 'content', 'wk_blog', 'reports']) {
  const t = await sb.schema(schema).from('posts').select('id', { count: 'exact', head: true }).catch(e => ({ error: e.message }));
  console.log(`  ${schema}.posts:`, t.count ?? t.error?.message ?? t.error);
}
