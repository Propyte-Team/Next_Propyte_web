import { getTranslations, setRequestLocale } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import DevelopersPageContent from './DevelopersPageContent';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopers } from '@/lib/supabase/queries';
import type { DeveloperRow } from '@/lib/supabase/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const title = t('developersTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('developersDescription');

  return {
    title,
    description,
    openGraph: {
      title: brandedTitle,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/desarrolladores`,
      languages: {
        es: '/es/desarrolladores',
        en: '/en/desarrolladores',
        'x-default': '/es/desarrolladores',
      },
    },
  };
}

export default async function DevelopersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let developers: DeveloperRow[] = [];
  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const { data } = await getDevelopers(supabase);
      if (data) developers = data as DeveloperRow[];
    }
  } catch (error) {
    console.error('[DevelopersPage] getDevelopers failed:', error);
  }

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: 'Propyte MasterBroker',
          description: 'Comercializacion profesional para desarrollos inmobiliarios en la Riviera Maya y Yucatan.',
          areaServed: {
            '@type': 'GeoCircle',
            geoMidpoint: { '@type': 'GeoCoordinates', latitude: 20.63, longitude: -87.08 },
            geoRadius: '300',
          },
        }}
      />
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: locale === 'es' ? 'Desarrolladores' : 'Developers' }]}
      />
      <DevelopersPageContent developers={developers} />
    </>
  );
}
