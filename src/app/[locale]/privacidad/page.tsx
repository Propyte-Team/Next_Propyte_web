import { getTranslations } from 'next-intl/server';
import LegalPlaceholder from '@/components/legal/LegalPlaceholder';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: `${t('privacyTitle')} — Propyte`,
    description: t('privacyDescription'),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/${locale}/privacidad`,
      languages: {
        es: '/es/privacidad',
        en: '/en/privacidad',
      },
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <LegalPlaceholder
      locale={locale}
      titleKey="privacyTitle"
      descriptionKey="privacyDescription"
    />
  );
}
