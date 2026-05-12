import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import NosotrosTabs from '../_components/NosotrosTabs';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import { getCompanyStats, localizedStatLabel } from '@/lib/hub-content';
import {
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  Landmark,
  Handshake,
  Home,
} from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: 'seo' });
  const tAbout = await getTranslations({ locale, namespace: 'about' });

  const title = tSeo('aboutTitle');
  const description = tSeo('aboutDescription');

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `/${locale}/nosotros/quienes-somos`,
      languages: {
        es: '/es/nosotros/quienes-somos',
        en: '/en/nosotros/quienes-somos',
        'x-default': '/es/nosotros/quienes-somos',
      },
    },
    other: { 'page:section': tAbout('label') },
  };
}

export default async function QuienesSomosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const visibility = await getVisibility();
  if (!isVisible(visibility, VISIBILITY_KEYS.NOSOTROS_QUIENES_SOMOS)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'about' });
  const [tBC, tA11y, hubStats] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
    getCompanyStats('quienes_somos'),
  ]);

  // Hub override: si trae stats, mapeamos al shape del hero {v, l};
  // si no, fallback a los i18n hardcoded.
  const heroStats = hubStats.length > 0
    ? hubStats.slice(0, 3).map((s) => ({ v: s.value, l: localizedStatLabel(s, locale) }))
    : [
        { v: '50+',  l: t('heroStatDevelopers') },
        { v: '300+', l: t('heroStatBrokers') },
        { v: '700+', l: t('heroStatDevelopments') },
      ];

  // Bento grid (mission section): 4 items, alternates large/small/small/large.
  const missionCards = [
    { icon: Building2, title: t('mission1Title'), desc: t('mission1Desc'), large: true },
    { icon: Users, title: t('mission2Title'), desc: t('mission2Desc'), large: false },
    { icon: BarChart3, title: t('mission3Title'), desc: t('mission3Desc'), large: false },
    { icon: ShieldCheck, title: t('mission4Title'), desc: t('mission4Desc'), large: true },
  ];

  // Ecosystem snap-scroll carousel: 4 audiences.
  const ecosystemCards = [
    { icon: UserCheck, title: t('value1Title'), desc: t('value1Desc') },
    { icon: TrendingUp, title: t('value2Title'), desc: t('value2Desc') },
    { icon: Landmark, title: t('value3Title'), desc: t('value3Desc') },
    { icon: Handshake, title: t('value4Title'), desc: t('value4Desc') },
  ];

  const cultureItems = Array.from({ length: 5 }, (_, i) => ({
    title: t(`culture${i + 1}Title`),
    desc: t(`culture${i + 1}Desc`),
  }));

  const visionPillars = [
    { num: t('vision1Num'), title: t('vision1Title'), desc: t('vision1Desc') },
    { num: t('vision2Num'), title: t('vision2Title'), desc: t('vision2Desc') },
    { num: t('vision3Num'), title: t('vision3Title'), desc: t('vision3Desc') },
  ];

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: tBC('about'), href: `/${locale}/nosotros/quienes-somos` },
          { label: tBC('aboutWhoWeAre') },
        ]}
      />

      {/* HERO — single dark canvas, editorial composition Propyte.
          Tipografía canónica Manual UX/UI: Inter (Neue Haas substitute) en
          titulares + DM Sans body + Space Grotesk eyebrows + JetBrains Mono
          en stats/coordinates tabulares. Detalles editoriales (coordenadas,
          watermark Home, axis dots) preservados como carácter visual; el
          acento de marca vive en color `--propyte-brand` (#A2F9FF), no en
          italic serif. */}
      <section className="propyte-hero-canvas relative min-h-[78vh] flex items-center">
        {/* Watermark home icon — extremely faint, decorativo, lower-right */}
        <Home
          size={520}
          strokeWidth={0.5}
          aria-hidden="true"
          className="absolute -right-32 -bottom-40 text-white/[0.025] pointer-events-none select-none hidden md:block"
        />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-24 md:py-32 w-full">
          <div className="grid lg:grid-cols-12 gap-x-12 gap-y-14">
            {/* Columna principal (8/12) — eyebrow + H1 + subtitle */}
            <div className="lg:col-span-8">
              <span
                className="propyte-hero-eyebrow propyte-hero-rise"
                style={{ animationDelay: '60ms' }}
              >
                <span className="propyte-hero-eyebrow__dot" aria-hidden="true" />
                {t('label')}
              </span>

              <h1
                className="mt-7 text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.025em] text-white propyte-hero-rise"
                style={{ animationDelay: '160ms' }}
              >
                {t('title').split(' ').map((word, i, arr) => {
                  const isLast = i === arr.length - 1;
                  // Acentúa la última palabra del título con el color de marca.
                  // Si t('title') es "Conoce Propyte" → "Conoce" Inter blanco +
                  // "Propyte" Inter cyan brand (mismo peso, distinto color).
                  return (
                    <span key={i}>
                      {isLast ? (
                        <span className="text-propyte-brand">{word}</span>
                      ) : (
                        word
                      )}
                      {!isLast && ' '}
                    </span>
                  );
                })}
              </h1>

              <p
                className="mt-7 max-w-xl text-lg md:text-xl text-white/65 leading-relaxed propyte-hero-rise"
                style={{ animationDelay: '260ms' }}
              >
                {t('subtitle')}
              </p>
            </div>

            {/* Columna secundaria (4/12) — tagline editorial + stats grid.
                Sobre lg el axis line crea separación sin línea dura. */}
            <div className="lg:col-span-4 lg:pl-8 lg:border-l lg:border-white/10 relative">
              {/* Vertical accent dots en la "axis line" del border-left */}
              <span
                aria-hidden="true"
                className="hidden lg:block absolute left-0 top-[18%] -translate-x-1/2 w-2 h-2 rounded-full bg-[#0F1923] border border-propyte-brand"
              />
              <span
                aria-hidden="true"
                className="hidden lg:block absolute left-0 bottom-[18%] -translate-x-1/2 w-2 h-2 rounded-full bg-[#0F1923] border border-propyte-brand"
              />

              <div
                className="propyte-hero-rise"
                style={{ animationDelay: '360ms' }}
              >
                <p className="font-heading text-2xl md:text-[1.75rem] leading-tight font-medium tracking-[-0.01em] text-white">
                  <span className="text-propyte-brand">{t('heroTagline').replace(/\.$/, '')}</span>
                  <span className="text-white/30">.</span>
                </p>
                <p className="mt-4 text-sm text-white/70 leading-relaxed">
                  {t('heroTaglineSub')}
                </p>
              </div>

              {/* Stats — formato monoespaciado tabular, label uppercase mono.
                  Layout horizontal con divider sutil, sin "tarjeta" — data como
                  parte integrada del hero, no como widget aparte. */}
              <dl
                className="mt-10 grid grid-cols-3 gap-px bg-white/5 rounded-lg overflow-hidden propyte-hero-rise"
                style={{ animationDelay: '460ms' }}
              >
                {heroStats.map((s) => (
                  <div key={s.l} className="bg-[#0F1923] px-2 py-4 text-center">
                    <dt className="accent-mono text-2xl md:text-3xl font-medium text-propyte-brand">
                      {s.v}
                    </dt>
                    <dd className="mt-1.5 accent-mono text-2xs text-white/70 uppercase tracking-[0.12em]">
                      {s.l}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Coordinate marker bottom-left — architectural detail (decorativo).
              opacity-70 sobre dark + white/65 da contraste AA en text-2xs. */}
          <div className="hidden md:flex absolute bottom-8 left-4 md:left-6 items-center gap-3 opacity-70">
            <span className="block w-6 h-px bg-propyte-brand" aria-hidden="true" />
            <span className="accent-mono text-2xs uppercase tracking-[0.18em] text-white/65">
              20.62°N · 87.07°W
            </span>
          </div>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="quienes-somos" visibility={visibility} />

      {/* Section 1: Intro — 5-col grid with Real Estate Lab callout */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-5 gap-16 items-center">
            <div className="lg:col-span-3">
              <span className="text-[#0D9488] text-xs font-bold tracking-[0.2em] uppercase">
                {t('label')}
              </span>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-6 leading-tight">
                {t('introTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">{t('introP1')}</p>
              <p className="text-gray-600 leading-relaxed">{t('introP2')}</p>
            </div>
            <div className="lg:col-span-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#1A2F3F] to-[#0F1923] rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-propyte-cyan-100/60" />
                <div className="relative text-center text-white/40 px-8">
                  <Home size={56} strokeWidth={1} className="mx-auto mb-3 opacity-30" aria-hidden="true" />
                  <p className="text-sm font-medium">Real Estate Lab</p>
                  <p className="text-xs mt-1 opacity-60">5ta Avenida, Playa del Carmen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Mission + Bento grid (2 large + 2 small) */}
      <section className="py-20 md:py-24 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl p-10 md:p-12 border-l-4 border-propyte-brand mb-12 shadow-sm">
            <span className="text-[#0D9488] text-xs font-bold tracking-[0.2em] uppercase">
              {t('missionLabel')}
            </span>
            <p className="mt-5 text-xl md:text-2xl font-medium text-[#1A2F3F] leading-relaxed">
              {t('missionText')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {missionCards.map(({ icon: Icon, title, desc, large }) => (
              <div
                key={title}
                className={`${large ? 'md:col-span-2 bg-[#1A2F3F] text-white' : 'bg-white border border-gray-100'} p-7 rounded-xl hover:shadow-lg transition-shadow`}
              >
                <div
                  className={`w-11 h-11 ${large ? 'bg-propyte-cyan-100' : 'bg-propyte-cyan-100'} rounded-xl flex items-center justify-center mb-5`}
                >
                  <Icon size={22} className="text-propyte-brand" />
                </div>
                <h3 className={`text-base font-bold ${large ? '' : 'text-[#1A2F3F]'} mb-2`}>
                  {title}
                </h3>
                <p
                  className={`${large ? 'text-white/70' : 'text-gray-600'} text-sm leading-relaxed`}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Vision (dark bg, 3-col stats) */}
      <section className="py-20 md:py-24 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <span className="text-propyte-brand text-xs font-bold tracking-[0.2em] uppercase">
            {t('visionLabel')}
          </span>
          <p className="mt-6 text-2xl md:text-3xl font-medium text-white leading-relaxed max-w-3xl mx-auto">
            {t('visionText')}
          </p>
          <div className="mt-16 grid md:grid-cols-3 gap-10 text-left">
            {visionPillars.map(({ num, title, desc }) => (
              <div key={num}>
                <span className="text-5xl font-bold text-propyte-brand/20" aria-hidden="true">
                  {num}
                </span>
                <h3 className="text-lg font-bold text-white mt-3">{title}</h3>
                <p className="text-white/60 text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Ecosystem snap-scroll horizontal carousel */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="text-[#0D9488] text-xs font-bold tracking-[0.2em] uppercase">
              {t('ecosystemLabel')}
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#1A2F3F]">
              {t('valueTitle')}
            </h2>
          </div>
          <div
            className="flex gap-4 snap-x snap-mandatory overflow-x-auto pb-4 -mx-4 md:-mx-6 px-4 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {ecosystemCards.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex-shrink-0 w-[75vw] sm:w-[45vw] lg:w-[calc(25%-0.75rem)] snap-center bg-white p-7 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 bg-propyte-cyan-100 rounded-xl flex items-center justify-center mb-5">
                  <Icon size={22} className="text-[#0F766E]" />
                </div>
                <h3 className="text-base font-bold text-[#1A2F3F] mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Culture — numbered principles (big light gray numbers) */}
      <section className="py-20 md:py-24 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="mb-14">
            <span className="text-[#0D9488] text-xs font-bold tracking-[0.2em] uppercase">
              {t('cultureLabel')}
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#1A2F3F]">
              {t('cultureTitle')}
            </h2>
          </div>
          <div className="space-y-10">
            {cultureItems.map(({ title, desc }, i) => (
              <div key={i} className="flex gap-6 md:gap-8 items-start">
                <span
                  className="text-5xl font-bold text-[#1A2F3F]/10 leading-none flex-shrink-0 w-14 text-right pt-1"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-[#1A2F3F]">{title}</h3>
                  <p className="text-gray-600 mt-2 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: CTA */}
      <section className="py-20 md:py-24 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">{t('ctaTitle')}</h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/unete`}
              className="h-14 px-10 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold rounded-xl transition-all flex items-center justify-center"
            >
              {t('ctaJoin')}
            </Link>
            <Link
              href={`/${locale}/nosotros/equipo-comercial`}
              className="h-14 px-10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center"
            >
              {t('ctaTeam')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
