// Reproducir el query exacto del frontend en ambos modos
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const BLOG_SELECT = `id, slug, locale, status, title, excerpt, content, category, tags, featured_image, author_name, author_image, read_time_min, meta_title, meta_description, related_city, published_at, created_at, updated_at`.trim();

console.log('=== MODE A: includeStaged=true (BLOG_INCLUDE_STAGED in env) ===');
const r1 = await anon.from('blog_posts')
  .select(BLOG_SELECT, { count: 'exact' })
  .eq('locale', 'es')
  .order('published_at', { ascending: false })
  .range(0, 3)
  .in('status', ['published', 'staged'])
  .eq('category', 'Para Inversionistas');
console.log('  count:', r1.count, 'rows:', r1.data?.length, 'err:', r1.error?.message);
if (r1.data) for (const p of r1.data) console.log('   ', p.slug, p.status, p.published_at);

console.log('\n=== MODE A but category=Para Asesores ===');
const r2 = await anon.from('blog_posts')
  .select(BLOG_SELECT, { count: 'exact' })
  .eq('locale', 'es')
  .order('published_at', { ascending: false })
  .range(0, 3)
  .in('status', ['published', 'staged'])
  .eq('category', 'Para Asesores');
console.log('  count:', r2.count, 'rows:', r2.data?.length, 'err:', r2.error?.message);

console.log('\n=== MODE B: includeStaged=false (frontend default) ===');
const r3 = await anon.from('blog_posts')
  .select(BLOG_SELECT, { count: 'exact' })
  .eq('locale', 'es')
  .order('published_at', { ascending: false })
  .range(0, 3)
  .eq('status', 'published')
  .lte('published_at', new Date().toISOString())
  .eq('category', 'Para Inversionistas');
console.log('  count:', r3.count, 'rows:', r3.data?.length, 'err:', r3.error?.message);

console.log('\n=== ALL posts visible to anon ===');
const r4 = await anon.from('blog_posts').select('slug, status, locale, category, published_at');
console.log('  rows:', r4.data?.length);
if (r4.data) for (const p of r4.data) console.log('   ', p.status, '|', p.category, '|', p.slug);
