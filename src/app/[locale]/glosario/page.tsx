import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import GlosarioClient from './GlosarioClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'glosario' });
  const title = t('heroTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/glosario`,
      languages: {
        es: '/es/glosario',
        en: '/en/glosario',
        'x-default': '/es/glosario',
      },
    },
  };
}

const TERM_COUNT = 22;
const TERM_LINKS: Record<number, string> = {
  4: '/como-invertir',
  6: '/financiamiento',
  8: '/financiamiento',
  10: '/como-comprar',
  19: '/como-invertir',
};

export default async function GlosarioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'glosario' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const terms = Array.from({ length: TERM_COUNT }, (_, i) => {
    const n = i + 1;
    return {
      name: t(`term${n}Name` as 'term1Name'),
      def: t(`term${n}Def` as 'term1Def'),
      link: TERM_LINKS[n],
    };
  });

  // DefinedTermSet JSON-LD
  const termSetSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: t('heroTitle'),
    description: t('metaDescription'),
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.name,
      description: term.def,
      inDefinedTermSet: t('heroTitle'),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termSetSchema) }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('glossary') }]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-propyte-brand/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-propyte-brand/10 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-6">
            <Sparkles size={14} strokeWidth={2} className="text-propyte-brand" />
            <span className="text-propyte-brand text-sm font-semibold tracking-wide uppercase">
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

      <GlosarioClient
        terms={terms}
        locale={locale}
        labels={{
          learnMore: t('learnMore'),
          searchPlaceholder: t('searchPlaceholder'),
          searchAriaLabel: t('searchAriaLabel'),
          noResults: t('noResults'),
          downloadPdf: t('downloadPdf'),
          downloadPdfShort: t('downloadPdfShort'),
        }}
      />
    </>
  );
}
