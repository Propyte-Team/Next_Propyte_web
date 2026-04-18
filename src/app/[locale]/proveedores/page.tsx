import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Truck, Mail, Clock, ArrowRight } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'providers' });
  return {
    title: `${t('title')} — Propyte`,
    description: t('description'),
    robots: { index: false, follow: true },
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
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const benefits = [
    { key: 'benefit1' },
    { key: 'benefit2' },
    { key: 'benefit3' },
    { key: 'benefit4' },
  ];

  return (
    <section className="min-h-[80vh] py-20 md:py-28 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />

      <div className="relative max-w-[960px] mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F5A623]/15 rounded-full mb-6">
          <Clock size={14} strokeWidth={2} className="text-[#F5A623]" />
          <span className="text-[#F5A623] text-sm font-semibold tracking-wide uppercase">
            {t('comingSoon')}
          </span>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#5CE0D2]/15 flex items-center justify-center mx-auto mb-6">
          <Truck size={28} strokeWidth={1.75} className="text-[#5CE0D2]" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
          {t('title')}
        </h1>

        {/* Description */}
        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-12">
          {t('description')}
        </p>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12 text-left">
          {benefits.map((b) => (
            <div
              key={b.key}
              className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
            >
              <p className="text-white/80 text-sm leading-relaxed">{t(b.key)}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}/contacto?interest=provider`}
            className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-[8px] transition-colors"
          >
            <Mail size={16} strokeWidth={2} />
            {t('ctaContact')}
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 h-12 px-7 border border-white/20 text-white hover:bg-white/5 font-semibold rounded-[8px] transition-colors"
          >
            {tNav('home')}
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
