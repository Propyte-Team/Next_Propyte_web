import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts } from '@/lib/supabase/queries';
import { CAT_ASESORES, CAT_INVERSIONISTAS } from '@/components/blog/BlogHero';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  const includeStaged = process.env.BLOG_INCLUDE_STAGED === 'true';

  // Same as default page mode
  const all = await getBlogPosts(supabase, { locale: 'es', limit: 16, page: 1 });

  // Same as filtered mode
  const filtered = await getBlogPosts(supabase, {
    locale: 'es',
    category: CAT_INVERSIONISTAS,
    limit: 6,
    page: 1,
  });

  // Raw call with both .in()s
  const { data: raw, error: rawErr, count: rawCount } = includeStaged
    ? await supabase
        .from('blog_posts')
        .select('slug, status, category, published_at', { count: 'exact' })
        .eq('locale', 'es')
        .in('status', ['published', 'staged'])
        .order('published_at', { ascending: false })
        .range(0, 15)
    : await supabase
        .from('blog_posts')
        .select('slug, status, category, published_at', { count: 'exact' })
        .eq('locale', 'es')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .range(0, 15);

  return NextResponse.json({
    env: { BLOG_INCLUDE_STAGED: process.env.BLOG_INCLUDE_STAGED ?? null, includeStaged },
    defaultMode: { count: all.posts.length, total: all.total, slugs: all.posts.map((p) => p.slug) },
    filteredMode: { count: filtered.posts.length, total: filtered.total, slugs: filtered.posts.map((p) => p.slug) },
    rawDirectQuery: { count: raw?.length ?? 0, total: rawCount ?? 0, error: rawErr?.message ?? null, sample: raw?.slice(0, 3) ?? [] },
  });
}
