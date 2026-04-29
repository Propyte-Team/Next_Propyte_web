import { getTranslations } from 'next-intl/server';
import LegalPage from '@/components/legal/LegalPage';
import PrivacidadContent from '@/components/legal/PrivacidadContent';

const LAST_UPDATED = '2026-04-29';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: `${t('privacyTitle')} — Propyte`,
    description: t('privacyDescription'),
    // noindex hasta que el documento sea revisado por abogado especialista
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
    <LegalPage
      locale={locale}
      titleKey="privacyTitle"
      descriptionKey="privacyDescription"
      lastUpdated={LAST_UPDATED}
    >
      <PrivacidadContent locale={locale} />
    </LegalPage>
  );
}
