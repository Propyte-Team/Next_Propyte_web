import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
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
  Sparkles,
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

  const missionCards = [
    { icon: Building2, title: t('mission1Title'), desc: t('mission1Desc') },
    { icon: Users, title: t('mission2Title'), desc: t('mission2Desc') },
    { icon: BarChart3, title: t('mission3Title'), desc: t('mission3Desc') },
    { icon: ShieldCheck, title: t('mission4Title'), desc: t('mission4Desc') },
  ];

  const valueCards = [
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

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5CE0D2]/15 rounded-full mb-6">
            <Sparkles size={14} strokeWidth={2} className="text-[#5CE0D2]" />
            <span className="text-[#5CE0D2] text-sm font-semibold tracking-wide uppercase">
              {t('label')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="quienes-somos" />

      {/* Section 1: Intro */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-6">{t('introTitle')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('introP1')}</p>
              <p className="text-gray-600 leading-relaxed">{t('introP2')}</p>
            </div>
            <div className="lg:col-span-2">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F4F6F8]">
                <Image
                  src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80"
                  alt={t('introTitle')}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2F3F]/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Mission */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl p-8 md:p-10 border-l-4 border-[#5CE0D2] mb-10">
            <span className="text-[#5CE0D2] text-sm font-bold tracking-[0.15em] uppercase">{t('missionLabel')}</span>
            <p className="mt-4 text-xl md:text-2xl font-medium text-[#1A2F3F] leading-relaxed">{t('missionText')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {missionCards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-[#5CE0D2]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Vision */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <span className="text-[#5CE0D2] text-sm font-bold tracking-[0.15em] uppercase">{t('visionLabel')}</span>
          <p className="mt-4 text-2xl md:text-3xl font-medium text-white leading-relaxed max-w-3xl mx-auto">{t('visionText')}</p>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {visionPillars.map(({ num, title, desc }) => (
              <div key={num} className="text-left">
                <span className="text-4xl font-bold text-[#5CE0D2]/30">{num}</span>
                <h3 className="text-lg font-bold text-white mt-2">{title}</h3>
                <p className="text-white/60 text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Value Proposition */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] text-center mb-12">{t('valueTitle')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueCards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-[#5CE0D2]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Culture */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-12">{t('cultureTitle')}</h2>
          <div className="space-y-8">
            {cultureItems.map(({ title, desc }, i) => (
              <div key={i} className="flex gap-6 items-start">
                <span className="text-5xl font-bold text-[#1A2F3F]/10 leading-none flex-shrink-0 w-16 text-right">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-bold text-[#1A2F3F]">{title}</h3>
                  <p className="text-gray-500 mt-2 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('ctaTitle')}</h2>
          <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/unete`} className="h-14 px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-all flex items-center justify-center">
              {t('ctaJoin')}
            </Link>
            <Link href={`/${locale}/nosotros/equipo-comercial`} className="h-14 px-8 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center">
              {t('ctaTeam')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
