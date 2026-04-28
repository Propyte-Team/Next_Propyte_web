// Reproduce the EXACT default view query pattern
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const BLOG_SELECT = `id, slug, locale, status, title, excerpt, content, category, tags, featured_image, author_name, author_image, read_time_min, meta_title, meta_description, related_city, published_at, created_at, updated_at`.trim();

async function getBlogPosts(c, { locale = 'es', category, limit = 9, page = 1 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let q = c.from('blog_posts').select(BLOG_SELECT, { count: 'exact' })
    .eq('locale', locale)
    .order('published_at', { ascending: false })
    .range(from, to);
  q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  if (category) q = q.eq('category', category);
  const { data, count, error } = await q;
  if (error) { console.error('[getBlogPosts]', error.message); return { posts: [], total: 0 }; }
  return { posts: data ?? [], total: count ?? 0 };
}

console.log('=== Promise.all simulation ===');
const t0 = Date.now();
const [asesores, inv] = await Promise.all([
  getBlogPosts(sb, { locale: 'es', category: 'Para Asesores', limit: 4, page: 1 }),
  getBlogPosts(sb, { locale: 'es', category: 'Para Inversionistas', limit: 4, page: 1 }),
]);
console.log('  elapsed:', Date.now() - t0, 'ms');
console.log('  asesores:', asesores.posts.length, 'total:', asesores.total);
console.log('  inversionistas:', inv.posts.length, 'total:', inv.total);
if (inv.posts.length) for (const p of inv.posts) console.log('    ', p.slug, '|', p.title);
