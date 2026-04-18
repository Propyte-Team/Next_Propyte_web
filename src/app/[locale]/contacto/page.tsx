import { getTranslations } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ContactPageContent from './ContactPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('contactTitle'),
    description: t('contactDescription'),
    alternates: {
      languages: {
        es: '/es/contacto',
        en: '/en/contact',
        'x-default': '/es/contacto',
      },
    },
  };
}

export default function ContactPage() {
  return (
    <>
      <SchemaMarkup type="localBusiness" />
      <ContactPageContent />
    </>
  );
}
