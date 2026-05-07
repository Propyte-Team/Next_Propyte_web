import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import NosotrosTabs from '../_components/NosotrosTabs';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
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
  const t = await getTranslations({ locale, namespace: 'about' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

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

      {/* HERO — Split: light left + dark right (calca WP page-nosotros.php) */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 grid lg:grid-cols-2">
          <div className="bg-[#F4F6F8]" />
          <div className="hidden lg:block bg-gradient-to-br from-[#0F1923] to-[#1A2F3F]" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-20 md:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Light side */}
            <div>
              <span className="inline-block text-[#0D9488] text-xs font-bold tracking-[0.2em] uppercase mb-4">
                {t('label')}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A2F3F] leading-tight">
                {t('title')}
              </h1>
              <p className="mt-5 text-lg text-gray-600 max-w-md leading-relaxed">
                {t('subtitle')}
              </p>
            </div>
            {/* Right: Dark side panel */}
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl lg:rounded-none lg:bg-transparent p-10 md:p-12 text-center lg:text-left">
              <div className="text-white/30 mb-4">
                <Home size={48} strokeWidth={1} className="mx-auto lg:mx-0" aria-hidden="true" />
              </div>
              <p className="text-white text-2xl md:text-3xl font-bold leading-tight">
                {t('heroTagline')}
              </p>
              <p className="text-white/40 text-sm mt-4">{t('heroTaglineSub')}</p>
              <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5CE0D2]">50+</div>
                  <div className="text-xs text-white/40">{t('heroStatDevelopers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5CE0D2]">300+</div>
                  <div className="text-xs text-white/40">{t('heroStatBrokers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5CE0D2]">700+</div>
                  <div className="text-xs text-white/40">{t('heroStatDevelopments')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="quienes-somos" />

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
                <div className="absolute inset-0 bg-[#5CE0D2]/5" />
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
          <div className="bg-white rounded-2xl p-10 md:p-12 border-l-4 border-[#5CE0D2] mb-12 shadow-sm">
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
                  className={`w-11 h-11 ${large ? 'bg-[#5CE0D2]/20' : 'bg-[#5CE0D2]/10'} rounded-xl flex items-center justify-center mb-5`}
                >
                  <Icon size={22} className="text-[#5CE0D2]" />
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
          <span className="text-[#5CE0D2] text-xs font-bold tracking-[0.2em] uppercase">
            {t('visionLabel')}
          </span>
          <p className="mt-6 text-2xl md:text-3xl font-medium text-white leading-relaxed max-w-3xl mx-auto">
            {t('visionText')}
          </p>
          <div className="mt-16 grid md:grid-cols-3 gap-10 text-left">
            {visionPillars.map(({ num, title, desc }) => (
              <div key={num}>
                <span className="text-5xl font-bold text-[#5CE0D2]/20" aria-hidden="true">
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
                <div className="w-11 h-11 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-5">
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
              className="h-14 px-10 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-all flex items-center justify-center"
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
