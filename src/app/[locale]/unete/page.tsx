import { getTranslations, setRequestLocale } from 'next-intl/server';
import UnetePageContent from './UnetePageContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getTestimonials, getFaqs, getCta } from '@/lib/hub-content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'unete' });
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
      canonical: `/${locale}/unete`,
      languages: {
        es: '/es/unete',
        en: '/en/unete',
        'x-default': '/es/unete',
      },
    },
  };
}

export default async function UnetePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'unete' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('heroTitle'),
    description: t('metaDescription'),
    url: `${baseUrl}/${locale}/unete`,
    inLanguage: locale === 'en' ? 'en-US' : 'es-MX',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Propyte',
      url: baseUrl,
    },
    about: {
      '@type': 'Organization',
      name: 'Propyte',
      description: locale === 'en'
        ? 'Real estate marketplace in the Riviera Maya with data-driven tools for investors.'
        : 'Marketplace inmobiliario en la Riviera Maya con herramientas de análisis para inversionistas.',
    },
  };

  // Hub-driven editorial overrides (con fallback a i18n)
  const [hubTestimonials, hubFaqs, recruitVideoCta] = await Promise.all([
    getTestimonials('recruitment'),
    getFaqs('recruitment'),
    getCta('unete_hero_video'),
  ]);
  const testimonials = hubTestimonials.map((t) => ({
    name: t.name,
    role: (locale === 'en' ? t.role_en : t.role_es) ?? '',
    quote: locale === 'en' ? t.quote_en : t.quote_es,
    stats: (locale === 'en' ? t.stat1_label_en : t.stat1_label_es)
      ? `${t.stat1_value ?? ''} ${(locale === 'en' ? t.stat1_label_en : t.stat1_label_es) ?? ''}`.trim()
      : '',
  }));
  const faqs = hubFaqs.map((f) => ({
    q: locale === 'en' ? f.question_en : f.question_es,
    a: locale === 'en' ? f.answer_en : f.answer_es,
  }));
  const videoUrl = recruitVideoCta?.button_href ?? null;
  const hubData = { videoUrl, testimonials, faqs };

  // FAQ schema usa Hub si tiene, si no fallback a i18n
  const faqSchemaSource = faqs.length > 0
    ? faqs
    : Array.from({ length: 8 }, (_, i) => ({
        q: t(`faq${i + 1}Q`),
        a: t(`faq${i + 1}A`),
      }));
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqSchemaSource.map((f) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('joinTeam') }]}
      />
      <UnetePageContent hubData={hubData} />
    </>
  );
}
