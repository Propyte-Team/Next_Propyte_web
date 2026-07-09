import { getTranslations, setRequestLocale } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import BrokersPageContent from './BrokersPageContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import PartnersLogos from '@/components/shared/PartnersLogos';
import CaseStudies from '@/components/shared/CaseStudies';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getFaqs, getSiteMedia } from '@/lib/hub-content';
import {
  getPartners,
  getCaseStudies,
  type PartnerRow,
  type CaseStudyRow,
} from '@/lib/supabase/queries';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const title = t('brokersTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('brokersDescription');

  return {
    title,
    description,
    openGraph: {
      title: brandedTitle,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/brokers`,
      languages: {
        es: '/es/brokers',
        en: '/en/brokers',
        'x-default': '/es/brokers',
      },
    },
  };
}

export default async function BrokersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_BROKERS);
  const [tBC, tA11y, tBrokers] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
    getTranslations({ locale, namespace: 'brokers' }),
  ]);

  // Hub-driven FAQs (con fallback a i18n) + partners/case studies — 4 fetches
  // independientes entre sí, se lanzan todos en paralelo en un solo
  // Promise.all en vez de dos etapas secuenciales. Partners/case studies
  // conservan su aislamiento de error (.catch → []) para no tumbar la página
  // completa si Supabase falla.
  const supabase = createPublicSupabaseClient();
  const [hubFaqs, siteMedia, partners, caseStudies] = await Promise.all([
    getFaqs('broker'),
    getSiteMedia(),
    supabase
      ? getPartners(supabase).catch((error) => {
          console.error('[BrokersPage] getPartners failed:', error);
          return [] as PartnerRow[];
        })
      : Promise.resolve([] as PartnerRow[]),
    supabase
      ? getCaseStudies(supabase, 'broker').catch((error) => {
          console.error('[BrokersPage] getCaseStudies failed:', error);
          return [] as CaseStudyRow[];
        })
      : Promise.resolve([] as CaseStudyRow[]),
  ]);
  const brokerFaqs = hubFaqs.length > 0
    ? hubFaqs.map((f) => ({
        q: locale === 'en' ? f.question_en : f.question_es,
        a: locale === 'en' ? f.answer_en : f.answer_es,
      }))
    : Array.from({ length: 7 }, (_, i) => ({
        q: tBrokers(`faq${i + 1}Q`),
        a: tBrokers(`faq${i + 1}A`),
      }));
  const faqEntities = brokerFaqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  }));

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: 'Propyte Broker Network',
          description: 'Cartera de brokers aliados con acceso a desarrollos validados en preventa y entrega en la Riviera Maya y Yucatán.',
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
        items={[{ label: tBC('brokers') }]}
      />
      <BrokersPageContent hubData={{ faqs: brokerFaqs }} siteMedia={siteMedia} />
      <CaseStudies
        studies={caseStudies}
        locale={locale}
        title={locale === 'es' ? 'Brokers con resultados reales' : 'Brokers with real results'}
        subtitle={locale === 'es' ? 'Casos de éxito de aliados de nuestra red' : 'Success stories from our broker network'}
      />
      <PartnersLogos
        partners={partners}
        title={locale === 'es' ? 'Inventario de aliados estratégicos' : 'Strategic partner inventory'}
        subtitle={locale === 'es' ? 'Desarrolladoras, bancos y servicios trans­accionales con los que trabajamos' : 'Developers, banks and transactional services we work with'}
      />
    </>
  );
}
