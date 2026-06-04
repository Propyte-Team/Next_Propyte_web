import { getTranslations } from 'next-intl/server';
import { Sparkles } from '@/lib/icons';
import ProviderForm from './ProviderForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'providers' });
  return {
    title: `${t('title')} — Propyte`,
    description: t('description'),
    openGraph: {
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      canonical: `/${locale}/proveedores`,
      languages: {
        es: '/es/proveedores',
        en: '/en/proveedores',
      },
    },
  };
}

export default async function ProvidersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'providers' });

  const benefits = ['benefit1', 'benefit2', 'benefit3', 'benefit4'];

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 bg-propyte-brand/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-propyte-brand/10 rounded-full blur-3xl" />

      <div className="relative max-w-[1120px] mx-auto px-4 md:px-6">
        {/* Hero */}
        <div className="text-center max-w-[760px] mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-6">
            <Sparkles size={14} className="text-propyte-brand" />
            <span className="text-propyte-brand text-sm font-semibold tracking-wide uppercase">
              {t('comingSoon')}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-propyte-brand font-medium mb-4">{t('subtitle')}</p>
          <p className="text-base md:text-lg text-white/70 leading-relaxed">{t('description')}</p>
        </div>

        {/* Benefits */}
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">{t('benefitsTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-16">
          {benefits.map((key) => (
            <div
              key={key}
              className="propyte-card-glass-sm p-5 text-left"
            >
              <p className="text-white/80 text-sm leading-relaxed">{t(key)}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto">
          <ProviderForm locale={locale} />
        </div>
      </div>
    </section>
  );
}
