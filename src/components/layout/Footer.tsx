'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Mail, Instagram, Facebook, MapPin } from '@/lib/icons';
import { reopenBanner } from '@/lib/cookies/consent';
import type { HubSiteConfig } from '@/lib/hub-content';

// Pre-footer CTA copy varies per route to avoid generic repetition
const ROUTE_CTA_KEY: Record<string, { title: string; subtitle?: string }> = {
  built: { title: 'ctaTitleBuilt', subtitle: 'ctaSubtitleBuilt' },
  unete: { title: 'ctaTitleUnete', subtitle: 'ctaSubtitleUnete' },
  desarrolladores: { title: 'ctaTitleDesarrolladores', subtitle: 'ctaSubtitleDesarrolladores' },
  brokers: { title: 'ctaTitleCorredores', subtitle: 'ctaSubtitleCorredores' },
  financiamiento: { title: 'ctaTitleFinanciamiento', subtitle: 'ctaSubtitleFinanciamiento' },
};

const FALLBACK_ADDRESS_ES = '5ta Avenida, Playa del Carmen, Q.Roo';
const FALLBACK_ADDRESS_EN = '5th Avenue, Playa del Carmen, Q.Roo';
const FALLBACK_EMAIL = 'info@propyte.com';
const FALLBACK_INSTAGRAM = 'https://www.instagram.com/propyte.mx/';
const FALLBACK_FACEBOOK = 'https://www.facebook.com/propyte';

function pickString(config: HubSiteConfig | undefined, key: string, fallback: string): string {
  const v = config?.[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}
function pickNullableString(config: HubSiteConfig | undefined, key: string, fallback: string): string {
  const v = config?.[key];
  if (v === null) return fallback;
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

export default function Footer({ siteConfig }: { siteConfig?: HubSiteConfig }) {
  const t = useTranslations('footer');
  const locale = useLocale();
  const pathname = usePathname();

  const address = pickString(
    siteConfig,
    locale === 'en' ? 'contact.address_en' : 'contact.address_es',
    locale === 'en' ? FALLBACK_ADDRESS_EN : FALLBACK_ADDRESS_ES,
  );
  const email = pickString(siteConfig, 'contact.email', FALLBACK_EMAIL);
  const instagram = pickNullableString(siteConfig, 'social.instagram', FALLBACK_INSTAGRAM);
  const facebook = pickNullableString(siteConfig, 'social.facebook', FALLBACK_FACEBOOK);

  const route = pathname?.replace(/^\/(es|en)/, '').split('/').filter(Boolean)[0] || 'home';
  const override = ROUTE_CTA_KEY[route];
  const titleKey = override?.title ?? 'ctaTitle';
  const subtitleKey = override?.subtitle ?? 'ctaSubtitle';

  return (
    <footer className="bg-[var(--propyte-dark-900)] text-white">
      {/* Top CTA strip — audit 2026-05-15: navy genérico (#1A2F3F) reemplazado
          por dark-800 brand para alinear con paleta corporativa. */}
      <div className="bg-[var(--propyte-dark-800)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{t(titleKey)}</h3>
            <p className="text-white/75 text-sm">{t(subtitleKey)}</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="h-11 px-6 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold text-sm rounded-lg transition-colors flex items-center"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href={`/${locale}`} className="inline-flex items-center min-h-[44px] mb-4" aria-label="Propyte">
              <Image
                src="/img/logos/logo-horizontal-white.png"
                alt="Propyte"
                width={2420}
                height={452}
                sizes="180px"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/70 leading-relaxed mb-4">{t('description')}</p>
            <div className="flex gap-3">
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('properties')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/propiedades`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('allProperties')}</Link></li>
              <li><Link href={`/${locale}/propiedades?city=Playa+del+Carmen`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('playaDelCarmen')}</Link></li>
              <li><Link href={`/${locale}/propiedades?city=Tulum`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('tulum')}</Link></li>
              <li><Link href={`/${locale}/propiedades?stage=preventa`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('presale')}</Link></li>
              <li><Link href={`/${locale}/propiedades?type=terreno`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('land')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('company')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/nosotros/quienes-somos`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('aboutUs')}</Link></li>
              <li><Link href={`/${locale}/como-comprar`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('howToBuy')}</Link></li>
              <li><Link href={`/${locale}/como-invertir`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('howToInvest')}</Link></li>
              <li><Link href={`/${locale}/financiamiento`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('financing')}</Link></li>
              <li><Link href={`/${locale}/desarrolladores`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('developersLink')}</Link></li>
              <li><Link href={`/${locale}/brokers`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('brokersLink')}</Link></li>
              <li><Link href={`/${locale}/unete`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('careers')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('resources')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/faq`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href={`/${locale}/glosario`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('glossary')}</Link></li>
              <li><Link href={`/${locale}/promociones`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('promotions')}</Link></li>
              <li><Link href={`/${locale}/mercado`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('market')}</Link></li>
            </ul>
          </div>

          {/* Legal & Transparencia */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('legal')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/metodologia`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('methodology')}</Link></li>
              <li><Link href={`/${locale}/nosotros/equipo-comercial`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('team')}</Link></li>
              <li><Link href={`/${locale}/aviso-legal-inversion`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('investmentNotice')}</Link></li>
              <li><Link href={`/${locale}/privacidad`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/terminos`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('terms')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('cookiesLink')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail size={14} className="flex-shrink-0" />
                <a href={`mailto:${email}`} className="inline-flex items-center min-h-[44px] md:min-h-0 hover:text-white transition-colors">{email}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Propyte. {t('rights')}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={reopenBanner}
                className="inline-flex items-center min-h-[44px] md:min-h-0 text-white/60 hover:text-propyte-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand rounded"
              >
                {t('cookieSettings')}
              </button>
              <a
                href="https://webkoistudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center min-h-[44px] px-3 -mx-3 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand"
              >
                <span>
                  {t('developedBy')}{' '}
                  <span className="text-propyte-brand underline underline-offset-4 decoration-propyte-brand/40 group-hover:decoration-white">
                    Web Koi Studio
                  </span>
                </span>
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/70 text-center">
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
