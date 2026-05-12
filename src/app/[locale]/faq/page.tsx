import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import FAQContent from './FAQContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getFaqs } from '@/lib/hub-content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  const title = t('heroTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('heroSubtitle');
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
      canonical: `/${locale}/faq`,
      languages: { es: '/es/faq', en: '/en/faq', 'x-default': '/es/faq' },
    },
  };
}

// Mapeo de category interna del Hub (buying/investing/...) a key de traducción.
function mapHubCategoryToKey(
  cat: string | null,
): 'catBuying' | 'catInvestment' | 'catFinancing' | 'catRental' | 'catPlatform' {
  switch (cat) {
    case 'buying': return 'catBuying';
    case 'investing': return 'catInvestment';
    case 'financing': return 'catFinancing';
    case 'rental': return 'catRental';
    case 'platform': return 'catPlatform';
    default: return 'catPlatform';
  }
}

const FAQ_META: ReadonlyArray<{ q: string; a: string; cat: 'catBuying' | 'catInvestment' | 'catFinancing' | 'catRental' | 'catPlatform' }> = [
  { q: 'q1', a: 'a1', cat: 'catBuying' },
  { q: 'q2', a: 'a2', cat: 'catBuying' },
  { q: 'q3', a: 'a3', cat: 'catBuying' },
  { q: 'q4', a: 'a4', cat: 'catBuying' },
  { q: 'q5', a: 'a5', cat: 'catInvestment' },
  { q: 'q6', a: 'a6', cat: 'catInvestment' },
  { q: 'q7', a: 'a7', cat: 'catInvestment' },
  { q: 'q8', a: 'a8', cat: 'catFinancing' },
  { q: 'q9', a: 'a9', cat: 'catFinancing' },
  { q: 'q10', a: 'a10', cat: 'catRental' },
  { q: 'q11', a: 'a11', cat: 'catRental' },
  { q: 'q12', a: 'a12', cat: 'catPlatform' },
  { q: 'q13', a: 'a13', cat: 'catPlatform' },
  { q: 'q14', a: 'a14', cat: 'catPlatform' },
];

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'faq' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  // Si Hub tiene FAQs configuradas para context='general', usarlas.
  // Fallback al listado hardcoded en i18n si Hub está vacío o falla la red.
  const hubFaqs = await getFaqs('general');
  const faqs = hubFaqs.length > 0
    ? hubFaqs.map((f) => ({
        cat: t(mapHubCategoryToKey(f.category)),
        q: locale === 'en' ? f.question_en : f.question_es,
        a: locale === 'en' ? f.answer_en : f.answer_es,
      }))
    : FAQ_META.map((meta) => ({
        cat: t(meta.cat),
        q: t(meta.q as 'q1'),
        a: t(meta.a as 'a1'),
      }));

  const categories = [
    t('catAll'),
    t('catBuying'),
    t('catInvestment'),
    t('catFinancing'),
    t('catRental'),
    t('catPlatform'),
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('faq') }]}
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

      <FAQContent faqs={faqs} categories={categories} locale={locale} />
    </>
  );
}
