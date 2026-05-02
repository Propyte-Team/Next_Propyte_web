import { getTranslations, setRequestLocale } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import DevelopersPageContent from './DevelopersPageContent';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getDevelopers,
  getPartners,
  getCaseStudies,
  type PartnerRow,
  type CaseStudyRow,
} from '@/lib/supabase/queries';
import type { DeveloperRow } from '@/lib/supabase/types';
import PartnersLogos from '@/components/shared/PartnersLogos';
import CaseStudies from '@/components/shared/CaseStudies';

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

  const [tBC, tA11y, tDevs] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
    getTranslations({ locale, namespace: 'developers' }),
  ]);

  const faqEntities = Array.from({ length: 8 }, (_, i) => ({
    '@type': 'Question',
    name: tDevs(`faq${i + 1}Q`),
    acceptedAnswer: {
      '@type': 'Answer',
      text: tDevs(`faq${i + 1}A`),
    },
  }));

  let developers: DeveloperRow[] = [];
  let partners: PartnerRow[] = [];
  let caseStudies: CaseStudyRow[] = [];
  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const [{ data }, partnerRows, caseRows] = await Promise.all([
        getDevelopers(supabase),
        getPartners(supabase),
        getCaseStudies(supabase, 'developer'),
      ]);
      if (data) developers = data as DeveloperRow[];
      partners = partnerRows;
      caseStudies = caseRows;
    }
  } catch (error) {
    console.error('[DevelopersPage] queries failed:', error);
  }

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: 'Propyte MasterBroker',
          description: 'Comercialización profesional para desarrollos inmobiliarios en la Riviera Maya y Yucatán.',
          areaServed: {
            '@type': 'GeoCircle',
            geoMidpoint: { '@type': 'GeoCoordinates', latitude: 20.63, longitude: -87.08 },
            geoRadius: '300',
          },
        }}
      />
      <SchemaMarkup type="faq" data={{ mainEntity: faqEntities }} />
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: locale === 'es' ? 'Desarrolladores' : 'Developers' }]}
      />
      <DevelopersPageContent developers={developers} />
      <CaseStudies
        studies={caseStudies}
        locale={locale}
        title={locale === 'es' ? 'Casos de éxito' : 'Success stories'}
        subtitle={locale === 'es' ? 'Resultados reales con desarrolladoras de la Riviera Maya' : 'Real results with Riviera Maya developers'}
      />
      <PartnersLogos
        partners={partners}
        title={locale === 'es' ? 'Trabajamos con desarrolladoras líderes' : 'We work with leading developers'}
        subtitle={locale === 'es' ? 'Aliados estratégicos en Riviera Maya y Yucatán' : 'Strategic partners across Riviera Maya and Yucatán'}
      />
    </>
  );
}
