import { getTranslations } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import BrokersPageContent from './BrokersPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('brokersTitle'),
    description: t('brokersDescription'),
    openGraph: {
      title: t('brokersTitle'),
      description: t('brokersDescription'),
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
    },
    alternates: {
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

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: 'Propyte Broker Network',
          description: 'Red de corredores inmobiliarios con acceso a +700 desarrollos en preventa en la Riviera Maya y Yucatan.',
          areaServed: {
            '@type': 'GeoCircle',
            geoMidpoint: { '@type': 'GeoCoordinates', latitude: 20.63, longitude: -87.08 },
            geoRadius: '300',
          },
        }}
      />
      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `https://propyte.com/${locale}` },
            { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Corredores' : 'Brokers', item: `https://propyte.com/${locale}/corredores` },
          ],
        }}
      />
      <BrokersPageContent />
    </>
  );
}
