import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import {
  BookOpen, Monitor, GraduationCap, DollarSign, Users, TrendingUp,
  Check, X, ArrowRight, MessageCircle, MapPin, Sparkles,
} from 'lucide-react';
import NosotrosTabs from '../_components/NosotrosTabs';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: 'seo' });
  const tAbout = await getTranslations({ locale, namespace: 'about' });

  const title = tAbout('tab3') + ' — Propyte';
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
      canonical: `/${locale}/nosotros/equipo-comercial`,
      languages: {
        es: '/es/nosotros/equipo-comercial',
        en: '/en/nosotros/equipo-comercial',
        'x-default': '/es/nosotros/equipo-comercial',
      },
    },
  };
}

function Avatar({ initials, name, color = '#1A2F3F' }: { initials: string; name: string; color?: string }) {
  return (
    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: color }}>
      <span className="text-white text-2xl font-bold" aria-label={name}>{initials}</span>
    </div>
  );
}

export default async function EquipoComercialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const waPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354';
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(t('recruitWhatsappMessage'))}`;

  const leaders = [
    { initials: 'JBP', name: 'José Benjamín Paredes', role: 'CEO — Director General', color: '#1A2F3F' },
    { initials: 'FL', name: 'Felipe Luksic', role: 'CSO — Director Comercial', color: '#1A2F3F' },
    { initials: 'LF', name: 'Luis Flores', role: 'Coordinador de Marketing', color: '#5CE0D2' },
    { initials: '?', name: t('comingSoonPerson'), role: t('openRole'), color: '#9CA3AF', hiring: true },
  ];

  const levels = Array.from({ length: 5 }, (_, i) => ({
    title: t(`level${i + 1}Title`),
    desc: t(`level${i + 1}Desc`),
    req: i < 4 ? t(`level${i + 1}Req`) : undefined,
  }));
  const levelColors = ['#5CE0D2', '#5CE0D2', '#3AAFA9', '#1A2F3F', '#F5A623'];

  const benefits = [
    { icon: BookOpen, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: Monitor, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: GraduationCap, title: t('benefit3Title'), desc: t('benefit3Desc') },
    { icon: DollarSign, title: t('benefit4Title'), desc: t('benefit4Desc') },
    { icon: Users, title: t('benefit5Title'), desc: t('benefit5Desc') },
    { icon: TrendingUp, title: t('benefit6Title'), desc: t('benefit6Desc') },
  ];

  const yesItems = Array.from({ length: 5 }, (_, i) => t(`yes${i + 1}`));
  const noItems = Array.from({ length: 5 }, (_, i) => t(`no${i + 1}`));

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: tBC('about'), href: `/${locale}/nosotros/quienes-somos` },
          { label: tBC('aboutTeam') },
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
            {t('teamTitle')}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-3xl mx-auto leading-relaxed">
            {t('teamSubtitle')}
          </p>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="equipo-comercial" />

      {/* Section 1: Team */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">{t('teamIntro')}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {leaders.map(l => (
              <div key={l.name} className="bg-white p-6 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <Avatar initials={l.initials} name={l.name} color={l.color} />
                <h3 className="font-bold text-[#1A2F3F]">{l.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{l.role}</p>
                {l.hiring && (
                  <span className="inline-block mt-2 px-3 py-1 bg-[#F5A623]/10 text-[#F5A623] text-xs font-bold rounded-full">{t('hiring')}</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mb-4">{t('teamMore')}</p>
          <div className="text-center">
            <Link href={`/${locale}/contacto`} className="text-[#0D9488] font-semibold hover:underline">{t('teamCta')}</Link>
          </div>
        </div>
      </section>

      {/* Section 2: Career Path */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] text-center mb-3">{t('careerTitle')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('careerSubtitle')}</p>

          <div className="max-w-2xl mx-auto space-y-4">
            {levels.map((level, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ backgroundColor: levelColors[i] }}>
                    {i + 1}
                  </div>
                  {i < levels.length - 1 && <div className="w-px flex-1 bg-gray-300 mt-2" />}
                </div>
                <div className="pb-6">
                  <h3 className="text-lg font-bold text-[#1A2F3F]">{level.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{level.desc}</p>
                  {level.req && (
                    <p className="text-xs text-[#0D9488] font-medium mt-2 bg-[#5CE0D2]/10 px-3 py-1 rounded-full inline-block">
                      {t('requirement')}: {level.req}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dimensions callout */}
          <div className="mt-12 bg-white border-l-4 border-[#5CE0D2] rounded-r-xl p-6 max-w-3xl mx-auto">
            <h3 className="font-bold text-[#1A2F3F] mb-4">{t('dimensionsTitle')}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <h4 className="font-semibold text-sm text-[#1A2F3F]">{t(`dim${i}Title`)}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t(`dim${i}Desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Benefits */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] text-center mb-12">{t('benefitsTitle')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
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

      {/* Section 4: What we look for */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] text-center mb-12">{t('lookingForTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <h3 className="font-bold text-green-800 mb-4">{t('yesLabel')}</h3>
              <ul className="space-y-3">
                {yesItems.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-green-700">
                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h3 className="font-bold text-red-800 mb-4">{t('noLabel')}</h3>
              <ul className="space-y-3">
                {noItems.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-red-700">
                    <X size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Recruitment CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('recruitTitle')}</h2>
          <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">{t('recruitSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href={`/${locale}/unete`} className="h-14 px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              {t('recruitCta')} <ArrowRight size={18} />
            </Link>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="h-14 px-8 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <MessageCircle size={18} /> {t('recruitWhatsapp')}
            </a>
          </div>
          <p className="text-white/65 text-sm flex items-center justify-center gap-2">
            <MapPin size={14} /> {t('recruitLocation')}
          </p>
        </div>
      </section>
    </>
  );
}
