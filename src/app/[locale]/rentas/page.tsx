import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RentalAnalysisDashboard from '@/components/rentas/RentalAnalysisDashboard';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';

  const title = isEn
    ? 'Rental Market Analysis — AI-Powered Estimates | Propyte'
    : 'Análisis del Mercado de Rentas — Estimaciones con IA | Propyte';
  const description = isEn
    ? 'Explore rental market data for Cancun, Playa del Carmen, Tulum and Merida. AI-powered rental estimates, ROI projections, and investment analysis for real estate in Mexico.'
    : 'Explora datos del mercado de rentas en Cancún, Playa del Carmen, Tulum y Mérida. Estimaciones de renta con IA, proyecciones de ROI y análisis de inversión inmobiliaria en México.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isEn ? 'en_US' : 'es_MX',
    },
    alternates: {
      languages: {
        es: '/es/rentas',
        en: '/en/rentas',
        'x-default': '/es/rentas',
      },
    },
  };
}

export default async function RentasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'rentas' });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('pageTitle'),
    description: t('pageDescription'),
    url: `https://propyte.com/${locale}/rentas`,
    publisher: {
      '@type': 'Organization',
      name: 'Propyte',
      url: 'https://propyte.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RentalAnalysisDashboard locale={locale} />
    </>
  );
}
