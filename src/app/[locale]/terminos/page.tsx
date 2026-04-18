import { getTranslations } from 'next-intl/server';
import LegalPlaceholder from '@/components/legal/LegalPlaceholder';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: `${t('termsTitle')} — Propyte`,
    description: t('termsDescription'),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/${locale}/terminos`,
      languages: {
        es: '/es/terminos',
        en: '/en/terminos',
      },
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <LegalPlaceholder
      locale={locale}
      titleKey="termsTitle"
      descriptionKey="termsDescription"
    />
  );
}
