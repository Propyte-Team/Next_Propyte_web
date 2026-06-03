import { getTranslations } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ContactPageContent from './ContactPageContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getSiteConfig, getSiteMedia } from '@/lib/hub-content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });

  const title = t('contactTitle');
  const description = t('contactDescription');

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/${locale}/contacto`,
      languages: {
        es: '/es/contacto',
        en: '/en/contacto',
        'x-default': '/es/contacto',
      },
    },
    other: {
      'contact:heading': tContact('title'),
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { setRequestLocale, getTranslations } = await import('next-intl/server');
  setRequestLocale(locale);
  const [tBC, tA11y, siteConfig, siteMedia] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
    getSiteConfig(),
    getSiteMedia(),
  ]);

  return (
    <>
      <SchemaMarkup type="localBusiness" />
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('contact') }]}
      />
      <ContactPageContent siteConfig={siteConfig} siteMedia={siteMedia} />
    </>
  );
}
