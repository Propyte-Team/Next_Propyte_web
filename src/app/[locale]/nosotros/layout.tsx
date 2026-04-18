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
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <>
      <SchemaMarkup type="organization" />
      {/* Mini-hero */}
      <section className="bg-[#0F1923] py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <span className="text-[#5CE0D2] text-sm font-bold tracking-[0.2em] uppercase">{t('label')}</span>
          <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{t('title')}</h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Tabs nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {[
              { label: t('tab1'), href: `/${locale}/nosotros/quienes-somos` },
              { label: t('tab2'), href: `/${locale}/nosotros/estructura` },
              { label: t('tab3'), href: `/${locale}/nosotros/equipo-comercial` },
            ].map(tab => (
              <a
                key={tab.href}
                href={tab.href}
                className="py-4 text-sm font-semibold text-gray-500 hover:text-[#5CE0D2] border-b-2 border-transparent hover:border-[#5CE0D2] transition-colors whitespace-nowrap"
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {children}
    </>
  );
}
