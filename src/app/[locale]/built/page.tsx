import { getTranslations } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import BuiltPageContent from './BuiltPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('builtTitle'),
    description: t('builtDescription'),
    openGraph: {
      title: t('builtTitle'),
      description: t('builtDescription'),
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
    },
    alternates: {
      languages: {
        es: '/es/built',
        en: '/en/built',
        'x-default': '/es/built',
      },
    },
  };
}

export default async function BuiltPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: 'Propyte Built',
          description: 'Servicios de arquitectura, diseno interior, construccion y paisajismo para desarrollos inmobiliarios en la Riviera Maya y Yucatan.',
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
            { '@type': 'ListItem', position: 2, name: 'Propyte Built', item: `https://propyte.com/${locale}/built` },
          ],
        }}
      />
      <BuiltPageContent />
    </>
  );
}
