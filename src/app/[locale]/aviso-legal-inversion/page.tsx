import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FileText } from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'avisoLegalPage' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary', title, description },
    alternates: {
      canonical: `/${locale}/aviso-legal-inversion`,
      languages: {
        es: '/es/aviso-legal-inversion',
        en: '/en/aviso-legal-inversion',
        'x-default': '/es/aviso-legal-inversion',
      },
    },
  };
}

export default async function AvisoLegalInversionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'avisoLegalPage' });

  const sections = [
    { title: t('section1Title'), body: t('section1Body') },
    { title: t('section2Title'), body: t('section2Body') },
    { title: t('section3Title'), body: t('section3Body') },
    { title: t('section4Title'), body: t('section4Body') },
    { title: t('section5Title'), body: t('section5Body') },
    { title: t('section6Title'), body: t('section6Body') },
    { title: t('section7Title'), body: t('section7Body') },
  ];

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={t('breadcrumbHome')}
        ariaLabel="Breadcrumb"
        items={[{ label: t('breadcrumbCurrent') }]}
      />

      {/* Hero */}
      <section className="bg-white pt-6 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="w-12 h-12 mb-5 bg-[#A2F9FF]/20 rounded-xl flex items-center justify-center">
            <FileText size={24} strokeWidth={1.75} className="text-[#0D9488]" />
          </div>
          <span className="inline-block text-[#0F766E] text-xs font-bold tracking-widest uppercase mb-4">
            {t('heroEyebrow')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A2F3F] leading-tight mb-5">
            {t('heroTitle')}
          </h1>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('heroLead')}
          </p>
        </div>
      </section>

      {/* Secciones del disclaimer */}
      <section className="bg-[#F4F6F8] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <article key={i}>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2F3F] mb-3">
                  {s.title}
                </h2>
                <p className="text-base text-gray-700 leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
