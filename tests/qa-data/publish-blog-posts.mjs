// Publica 3 posts canónicos + archiva 2 duplicados con timestamp en slug
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const CANONICAL = [
  'invertir-en-tulum-2026',
  'invertir-preventa-tulum-guia-principiantes',
  'invertir-tulum-2026-guia-principiantes',
];

const DUPLICATES = [
  'invertir-tulum-2026-guia-principiantes-1776897286134',
  'invertir-tulum-2026-guia-principiantes-1776897139345',
];

const now = new Date().toISOString();

console.log('1. Publishing 3 canonical posts...');
for (const slug of CANONICAL) {
  const r = await sb.from('blog_posts')
    .update({ status: 'published', published_at: now })
    .eq('slug', slug)
    .is('published_at', null)
    .select();
  if (r.data?.length) console.log(`  ✓ ${slug} (set published_at=now)`);
  else {
    const r2 = await sb.from('blog_posts')
      .update({ status: 'published' })
      .eq('slug', slug)
      .select();
    console.log(`  ✓ ${slug} (kept published_at, status=published)`, r2.data?.length, r2.error?.message);
  }
}

console.log('\n2. Archiving 2 duplicates with timestamp in slug...');
for (const slug of DUPLICATES) {
  const r = await sb.from('blog_posts')
    .update({ status: 'archived' })
    .eq('slug', slug)
    .select();
  console.log(`  ✓ ${slug}`, r.data?.length, r.error?.message);
}

console.log('\n3. Final state:');
const { data } = await sb.from('blog_posts')
  .select('slug, status, locale, category, published_at')
  .order('id');
console.table(data);
