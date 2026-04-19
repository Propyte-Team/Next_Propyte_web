import { setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import UnitDetailPage from '../_components/UnitDetailPage';
import { buildPropertyMetadata } from '../_components/buildPropertyMetadata';
import { MOCK_UNIT_SLUGS } from '@/lib/mocks/unit-fixtures';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return MOCK_UNIT_SLUGS.map((slug) => ({ slug }));

    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_units')
      .select('slug')
      .not('approved_at', 'is', null)
      .limit(1000);

    const realSlugs: string[] = ((data || []) as Array<{ slug: string | null }>)
      .map((p) => p.slug)
      .filter((s: string | null): s is string => typeof s === 'string' && s.length > 0);

    const all = Array.from(new Set([...realSlugs, ...MOCK_UNIT_SLUGS]));
    return all.map((slug) => ({ slug }));
  } catch (err) {
    console.error('generateStaticParams (propiedades) failed:', err);
    return MOCK_UNIT_SLUGS.map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  return buildPropertyMetadata(slug, locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <UnitDetailPage locale={locale} slug={slug} />;
}
