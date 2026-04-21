import { getTranslations } from 'next-intl/server';
import { Truck, Sparkles } from 'lucide-react';
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
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />

      <div className="relative max-w-[1120px] mx-auto px-4 md:px-6">
        {/* Hero */}
        <div className="text-center max-w-[760px] mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5CE0D2]/15 rounded-full mb-6">
            <Sparkles size={14} strokeWidth={2} className="text-[#5CE0D2]" />
            <span className="text-[#5CE0D2] text-sm font-semibold tracking-wide uppercase">
              {t('comingSoon')}
            </span>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-[#5CE0D2]/15 flex items-center justify-center mx-auto mb-6">
            <Truck size={28} strokeWidth={1.75} className="text-[#5CE0D2]" />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-[#5CE0D2] font-medium mb-4">{t('subtitle')}</p>
          <p className="text-base md:text-lg text-white/70 leading-relaxed">{t('description')}</p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-16">
          {benefits.map((key) => (
            <div
              key={key}
              className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-left"
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
