import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Search, FileText, CreditCard, Home, Key, ClipboardCheck,
  CheckCircle, ArrowRight, Sparkles,
} from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'comoComprar' });

  const title = t('heroTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('heroSubtitle');

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/como-comprar`,
      languages: {
        es: '/es/como-comprar',
        en: '/en/como-comprar',
        'x-default': '/es/como-comprar',
      },
    },
  };
}

const STEP_ICONS = [Search, CreditCard, Home, FileText, ClipboardCheck, Key];
const DOC_KEYS = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6'] as const;

export default async function ComoComprarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'comoComprar' });

  const steps = STEP_ICONS.map((Icon, i) => ({
    icon: Icon,
    title: t(`step${i + 1}Title` as 'step1Title'),
    desc: t(`step${i + 1}Desc` as 'step1Desc'),
  }));

  const documents = DOC_KEYS.map((k) => t(k));

  // HowTo JSON-LD schema
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t('heroTitle'),
    description: t('heroSubtitle'),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.desc,
    })),
    totalTime: 'P90D',
    supply: documents.map((d) => ({ '@type': 'HowToSupply', name: d })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5CE0D2]/15 rounded-full mb-6">
            <Sparkles size={14} strokeWidth={2} className="text-[#5CE0D2]" />
            <span className="text-[#5CE0D2] text-sm font-semibold tracking-wide uppercase">
              {t('heroEyebrow')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* 6-Step Process */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-10 text-center">
            {t('stepsTitle')}
          </h2>
          <ol className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={i} className="relative bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#5CE0D2] text-[#0F1923] rounded-full flex items-center justify-center font-bold text-lg">
                      {i + 1}
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-3">
                        <Icon size={20} className="text-[#0D9488]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Documents Needed */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8">
            {t('documentsTitle')}
          </h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <li key={doc} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                <CheckCircle size={20} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Financing Preview */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
            {t('financingTitle')}
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">{t('financingDesc')}</p>
          <Link
            href={`/${locale}/financiamiento`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
          >
            {t('financingCta')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">{t('ctaDesc')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/propiedades`}
              className="px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
            >
              {t('ctaBrowse')}
            </Link>
            <Link
              href={`/${locale}/contacto`}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors"
            >
              {t('ctaAdvisor')}
            </Link>
          </div>
        </div>
      </section>

      {/* Legal disclaimer */}
      <div className="py-6 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <p className="text-xs text-gray-400 text-center">{t('disclaimer')}</p>
        </div>
      </div>
    </>
  );
}
