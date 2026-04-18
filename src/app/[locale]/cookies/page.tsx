import { getTranslations } from 'next-intl/server';
import LegalPlaceholder from '@/components/legal/LegalPlaceholder';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: `${t('cookiesTitle')} — Propyte`,
    description: t('cookiesDescription'),
    robots: { index: false, follow: true },
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
    <LegalPlaceholder
      locale={locale}
      titleKey="cookiesTitle"
      descriptionKey="cookiesDescription"
    />
  );
}
