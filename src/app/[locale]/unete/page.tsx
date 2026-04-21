import { getTranslations, setRequestLocale } from 'next-intl/server';
import UnetePageContent from './UnetePageContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'unete' });
  const title = t('heroTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/unete`,
      languages: {
        es: '/es/unete',
        en: '/en/unete',
        'x-default': '/es/unete',
      },
    },
  };
}

export default async function UnetePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'unete' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('heroTitle'),
    description: t('metaDescription'),
    url: `${baseUrl}/${locale}/unete`,
    inLanguage: locale === 'en' ? 'en-US' : 'es-MX',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Propyte',
      url: baseUrl,
    },
    about: {
      '@type': 'Organization',
      name: 'Propyte',
      description: locale === 'en'
        ? 'Real estate marketplace in the Riviera Maya with data-driven tools for investors.'
        : 'Marketplace inmobiliario en la Riviera Maya con herramientas de análisis para inversionistas.',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('joinTeam') }]}
      />
      <UnetePageContent />
    </>
  );
}
