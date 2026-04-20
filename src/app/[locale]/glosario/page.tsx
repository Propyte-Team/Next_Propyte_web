import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Sparkles } from 'lucide-react';

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

  const terms = Array.from({ length: TERM_COUNT }, (_, i) => {
    const n = i + 1;
    return {
      name: t(`term${n}Name` as 'term1Name'),
      def: t(`term${n}Def` as 'term1Def'),
      link: TERM_LINKS[n],
    };
  });

  // Group by first letter
  const grouped: Record<string, typeof terms> = {};
  for (const term of terms) {
    const letter = term.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  }
  const letters = Object.keys(grouped).sort();

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

      {/* Letter navigation */}
      <nav className="py-4 border-b bg-white sticky top-16 z-10" aria-label="Glossary letters">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-9 h-9 flex items-center justify-center text-sm font-bold text-[#1A2F3F] bg-gray-100 hover:bg-[#5CE0D2] hover:text-[#0F1923] rounded-lg transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Terms */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-10">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <h2 className="text-3xl font-bold text-[#0D9488] mb-4 border-b border-gray-100 pb-2">{letter}</h2>
                <dl className="space-y-4">
                  {grouped[letter].map((term) => (
                    <div key={term.name} className="bg-white p-4 rounded-xl border border-gray-100">
                      <dt className="font-bold text-[#1A2F3F] mb-1">{term.name}</dt>
                      <dd className="text-sm text-gray-600 leading-relaxed">
                        {term.def}
                        {term.link && (
                          <Link
                            href={`/${locale}${term.link}`}
                            className="ml-2 text-[#0D9488] hover:underline text-xs font-semibold"
                          >
                            {t('learnMore')}
                          </Link>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
