// Verify .in('category', [...]) returns posts
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const r = await sb.from('blog_posts')
  .select('slug, status, category, locale, published_at')
  .eq('locale', 'es')
  .eq('status', 'published')
  .lte('published_at', new Date().toISOString())
  .in('category', ['Para Asesores', 'Para Inversionistas'])
  .order('published_at', { ascending: false })
  .range(0, 7);

console.log('rows:', r.data?.length, 'err:', r.error?.message);
if (r.data) for (const p of r.data) console.log(' ', p.category, '|', p.slug);
