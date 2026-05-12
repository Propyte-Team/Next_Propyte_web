import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Users, MapPin, MessageCircle } from 'lucide-react';
import NosotrosTabs from '../_components/NosotrosTabs';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getTeamMembers, type TeamMemberRow } from '@/lib/supabase/queries';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';

export const revalidate = 600; // 10 min ISR; on-demand revalidate desde Hub al editar miembros

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'equipoPage' });
  const tBC = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/nosotros/equipo-comercial/opengraph-image`],
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
    other: { 'breadcrumb-about': tBC('about') },
  };
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const FALLBACK_COLORS = ['#1A2F3F', '#0F1923', '#0D9488', '#0F766E', '#134E4A'];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function Avatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className="w-24 h-24 rounded-full object-cover mx-auto mb-3"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3"
      style={{ backgroundColor: pickColor(name) }}
    >
      <span className="text-white text-2xl font-bold" aria-label={name}>
        {getInitials(name)}
      </span>
    </div>
  );
}

function buildWhatsappLink(member: TeamMemberRow): string | null {
  const phone = member.whatsapp || member.phone;
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) return null;
  return `https://wa.me/${clean}`;
}

export default async function EquipoComercialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const visibility = await getVisibility();
  if (!isVisible(visibility, VISIBILITY_KEYS.NOSOTROS_EQUIPO_COMERCIAL)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'equipoPage' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const supabase = createPublicSupabaseClient();
  const teamMembers = supabase ? await getTeamMembers(supabase) : [];

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: tBC('about'), href: `/${locale}/nosotros/quienes-somos` },
          { label: t('breadcrumbCurrent') },
        ]}
      />

      {/* Hero */}
      <section className="bg-white pt-6 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <span className="inline-block text-[#0F766E] text-xs font-bold tracking-widest uppercase mb-4">
            {t('heroEyebrow')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A2F3F] leading-tight mb-5">
            {t('heroTitle')}
          </h1>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('heroLead')}
          </p>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="equipo-comercial" visibility={visibility} />

      {/* Section 1: cómo trabajamos */}
      <section className="bg-[#F4F6F8] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
            {t('section1Title')}
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            {t('section1Body')}
          </p>
        </div>
      </section>

      {/* Section 2: bios — grid Hub-driven con fallback honesto */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {t('section2Title')}
          </h2>

          {teamMembers.length === 0 ? (
            <div className="max-w-2xl mx-auto propyte-card-glass-light p-8 md:p-12 text-center border-2 border-dashed border-[#A2F9FF]/40 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-5 bg-[#A2F9FF]/20 rounded-2xl flex items-center justify-center">
                <Users size={28} strokeWidth={1.5} className="text-[#0D9488]" />
              </div>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
                {t('section2Placeholder')}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {teamMembers.map((m) => {
                const waLink = buildWhatsappLink(m);
                return (
                  <div
                    key={m.id}
                    className="bg-white p-6 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow"
                  >
                    <Avatar photoUrl={m.photo_url} name={m.name} />
                    <h3 className="font-bold text-[#1A2F3F]">{m.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{m.role}</p>
                    {m.city && (
                      <p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                        <MapPin size={11} /> {m.city}
                      </p>
                    )}
                    {m.bio_short && (
                      <p className="text-xs text-gray-600 mt-3 leading-relaxed">{m.bio_short}</p>
                    )}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#25D366]/10 text-[#075E54] text-xs font-semibold rounded-full hover:bg-[#25D366]/20 transition-colors"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B1C1E] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-96 h-96 bg-[#A2F9FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-base text-white/80 leading-relaxed mb-8">
            {t('ctaBody')}
          </p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 min-h-[44px] px-7 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors text-sm"
          >
            {t('ctaButton')}
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}
