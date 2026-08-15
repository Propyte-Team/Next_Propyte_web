import { getTranslations } from 'next-intl/server';
import LegalPage from '@/components/legal/LegalPage';
import CookiesContent from '@/components/legal/CookiesContent';
import { ogLocaleImages } from '@/lib/og/images';

const LAST_UPDATED = '2026-04-29';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: `${t('cookiesTitle')} — Propyte`,
    description: t('cookiesDescription'),
    robots: { index: false, follow: true },
    openGraph: {
      siteName: 'Propyte',
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: ogLocaleImages(locale),
    },
    alternates: {
      canonical: `/${locale}/cookies`,
      languages: {
        es: '/es/cookies',
        en: '/en/cookies',
      },
    },
  };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <LegalPage
      locale={locale}
      titleKey="cookiesTitle"
      descriptionKey="cookiesDescription"
      lastUpdated={LAST_UPDATED}
    >
      <CookiesContent locale={locale} />
    </LegalPage>
  );
}
