import { setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import DevelopmentDetailPage from '../_components/DevelopmentDetailPage';
import { buildDetailMetadata } from '../_components/buildDetailMetadata';
import { CITY_SLUGS } from '../_components/cityConfig';

// ISR — seguro desde que el root layout no usa getLocale() (headers) y
// [locale]/layout enumera locales (fix 366e163). El árbol usa el cliente
// público (sin cookies).
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];
    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('slug')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .limit(1000);
    // Exclude city slugs — those have their own literal pages
    return (data || [])
      .filter((p: { slug: string }) => p.slug && !CITY_SLUGS.includes(p.slug))
      .map((p: { slug: string }) => ({ slug: p.slug }));
  } catch (err) {
    console.error('generateStaticParams failed:', err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  return buildDetailMetadata(slug, locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <DevelopmentDetailPage locale={locale} slug={slug} />;
}
