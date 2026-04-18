import { getTranslations } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import DevelopersPageContent from './DevelopersPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('developersTitle'),
    description: t('developersDescription'),
    openGraph: {
      title: t('developersTitle'),
      description: t('developersDescription'),
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
    },
    alternates: {
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
      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `https://propyte.com/${locale}` },
            { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Desarrolladores' : 'Developers', item: `https://propyte.com/${locale}/desarrolladores` },
          ],
        }}
      />
      <DevelopersPageContent />
    </>
  );
}
