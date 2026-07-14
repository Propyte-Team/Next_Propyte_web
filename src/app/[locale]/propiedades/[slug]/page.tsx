import { setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import UnitDetailPage from '../_components/UnitDetailPage';
import { buildPropertyMetadata } from '../_components/buildPropertyMetadata';

// Force dynamic rendering — el árbol de render del detalle de unidad accede
// a datos en request-time (misma clase que desarrollos/[slug] y zonas/[slug]);
// bajo ISR (revalidate) eso lanza DYNAMIC_SERVER_USAGE → 500 en prod.
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_units')
      .select('slug')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .limit(1000);

    const realSlugs: string[] = ((data || []) as Array<{ slug: string | null }>)
      .map((p) => p.slug)
      .filter((s: string | null): s is string => typeof s === 'string' && s.length > 0);

    return realSlugs.map((slug) => ({ slug }));
  } catch (err) {
    console.error('generateStaticParams (propiedades) failed:', err);
    return [];
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
