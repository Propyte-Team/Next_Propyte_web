import { setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopers } from '@/lib/supabase/queries';
import type { DeveloperRow } from '@/lib/supabase/types';
import DeveloperProfilePage from '../_components/DeveloperProfilePage';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];
    const { data } = await getDevelopers(supabase);
    return (data || [])
      .filter((d: DeveloperRow) => d.slug)
      .map((d: DeveloperRow) => ({ slug: d.slug as string }));
  } catch (err) {
    console.error('generateStaticParams(developers) failed:', err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = createPublicSupabaseClient();
  let name = slug;
  try {
    if (supabase) {
      const { data } = await supabase
        .schema('real_estate_hub' as 'public')
        .from('v_developers')
        .select('name')
        .eq('slug', slug)
        .maybeSingle();
      if (data) name = (data as { name?: string }).name || slug;
    }
  } catch { /* use slug as fallback */ }

  const title = locale === 'es' ? `${name} — Desarrolladora` : `${name} — Developer`;
  const description = locale === 'es'
    ? `Conoce los proyectos inmobiliarios de ${name} en la Riviera Maya y Yucatán, comercializados por Propyte.`
    : `Explore ${name}'s real estate projects in Riviera Maya and Yucatán, commercialized by Propyte.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Propyte`,
      description,
      type: 'profile',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      canonical: `/${locale}/desarrolladores/${slug}`,
      languages: {
        es: `/es/desarrolladores/${slug}`,
        en: `/en/desarrolladores/${slug}`,
        'x-default': `/es/desarrolladores/${slug}`,
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <DeveloperProfilePage locale={locale} slug={slug} />;
}
