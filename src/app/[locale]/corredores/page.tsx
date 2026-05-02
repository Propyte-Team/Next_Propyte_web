import { getTranslations, setRequestLocale } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import BrokersPageContent from './BrokersPageContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import PartnersLogos from '@/components/shared/PartnersLogos';
import CaseStudies from '@/components/shared/CaseStudies';
import BrokerCommissionsTable from '@/components/shared/BrokerCommissionsTable';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getPartners,
  getCaseStudies,
  getBrokerCommissions,
  type PartnerRow,
  type CaseStudyRow,
  type BrokerCommissionRow,
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
      canonical: `/${locale}/corredores`,
      languages: {
        es: '/es/corredores',
        en: '/en/corredores',
        'x-default': '/es/corredores',
      },
    },
  };
}

export default async function BrokersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tBC, tA11y, tBrokers] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
    getTranslations({ locale, namespace: 'brokers' }),
  ]);

  const faqEntities = Array.from({ length: 8 }, (_, i) => ({
    '@type': 'Question',
    name: tBrokers(`faq${i + 1}Q`),
    acceptedAnswer: {
      '@type': 'Answer',
      text: tBrokers(`faq${i + 1}A`),
    },
  }));

  let partners: PartnerRow[] = [];
  let caseStudies: CaseStudyRow[] = [];
  let commissions: BrokerCommissionRow[] = [];
  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const [partnerRows, caseRows, commissionRows] = await Promise.all([
        getPartners(supabase),
        getCaseStudies(supabase, 'broker'),
        getBrokerCommissions(supabase),
      ]);
      partners = partnerRows;
      caseStudies = caseRows;
      commissions = commissionRows;
    }
  } catch (error) {
    console.error('[BrokersPage] queries failed:', error);
  }

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: 'Propyte Broker Network',
          description: 'Red de corredores inmobiliarios con acceso a +700 desarrollos en preventa en la Riviera Maya y Yucatán.',
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
      <BrokersPageContent />
      <BrokerCommissionsTable
        commissions={commissions}
        locale={locale}
        title={locale === 'es' ? 'Tabla de comisiones' : 'Commission schedule'}
        subtitle={locale === 'es' ? 'Transparencia comercial: lo que ganas por cada operación cerrada con Propyte' : 'Commercial transparency: what you earn per closed deal with Propyte'}
      />
      <CaseStudies
        studies={caseStudies}
        locale={locale}
        title={locale === 'es' ? 'Corredores con resultados reales' : 'Brokers with real results'}
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
