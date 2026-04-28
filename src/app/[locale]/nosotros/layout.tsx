import { getTranslations } from 'next-intl/server';
import SchemaMarkup from '@/components/shared/SchemaMarkup';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: { template: '%s | Propyte', default: t('aboutTitle') },
    description: t('aboutDescription'),
    alternates: {
      languages: { es: '/es/nosotros', en: '/en/nosotros', 'x-default': '/es/nosotros' },
    },
  };
}

export default async function NosotrosLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      <SchemaMarkup type="organization" />

      {children}

      {/* Sub-section tabs — sticky para navegación cruzada entre sub-secciones.
          Cada page renderiza su propio hero con H1 único (SEO, un H1/página). */}
    </>
  );
}
