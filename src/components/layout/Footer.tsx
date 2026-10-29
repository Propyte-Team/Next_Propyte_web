'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Instagram, Facebook } from '@/lib/icons';
import { reopenBanner } from '@/lib/cookies/consent';
import CopyEmailButton from '@/components/shared/CopyEmailButton';
import type { HubSiteConfig } from '@/lib/hub-content';
import { resolveSiteContact } from '@/lib/site-contact';
import { NAP_ADDRESS_LINE_ES, NAP_ADDRESS_LINE_EN } from '@/lib/seo/nap';

// Pre-footer CTA copy varies per route to avoid generic repetition
const ROUTE_CTA_KEY: Record<string, { title: string; subtitle?: string }> = {
  built: { title: 'ctaTitleBuilt', subtitle: 'ctaSubtitleBuilt' },
  unete: { title: 'ctaTitleUnete', subtitle: 'ctaSubtitleUnete' },
  desarrolladores: { title: 'ctaTitleDesarrolladores', subtitle: 'ctaSubtitleDesarrolladores' },
  brokers: { title: 'ctaTitleCorredores', subtitle: 'ctaSubtitleCorredores' },
  financiamiento: { title: 'ctaTitleFinanciamiento', subtitle: 'ctaSubtitleFinanciamiento' },
};

// NAP: fuente única en `@/lib/seo/nap`. Si el Hub no responde, estos fallbacks
// deben seguir coincidiendo con la ficha de Maps — `nap.test.ts` lo vigila.
const FALLBACK_ADDRESS_ES = NAP_ADDRESS_LINE_ES;
const FALLBACK_ADDRESS_EN = NAP_ADDRESS_LINE_EN;
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

const linkCls = 'inline-flex items-center min-h-[44px] md:min-h-0 text-[15px] text-white/70 hover:text-white transition-colors';
const headCls = 'font-display text-sm font-medium text-white/50 mb-4';

/**
 * Footer del rediseño v3: bloque de contacto grande (titular por ruta, WhatsApp
 * y contacto, datos de oficina) y columnas de enlaces con filetes finos. Mismos
 * enlaces, NAP y legales que la versión anterior.
 */
export default function Footer({ siteConfig }: { siteConfig?: HubSiteConfig }) {
  const t = useTranslations('footer');
  const locale = useLocale();
  const pathname = usePathname();

  const address = pickString(
    siteConfig,
    locale === 'en' ? 'contact.address_en' : 'contact.address_es',
    locale === 'en' ? FALLBACK_ADDRESS_EN : FALLBACK_ADDRESS_ES,
  );
  const contact = resolveSiteContact(siteConfig);
  const instagram = pickNullableString(siteConfig, 'social.instagram', FALLBACK_INSTAGRAM);
  const facebook = pickNullableString(siteConfig, 'social.facebook', FALLBACK_FACEBOOK);

  const route = pathname?.replace(/^\/(es|en)/, '').split('/').filter(Boolean)[0] || 'home';
  const override = ROUTE_CTA_KEY[route];
  const titleKey = override?.title ?? 'ctaTitle';
  const subtitleKey = override?.subtitle ?? 'ctaSubtitle';
  // El CTA enlaza a /contacto — en la propia página de Contacto sería
  // redundante y el link no navegaría a ningún lado (misma URL).
  const isContactPage = route === 'contacto';

  return (
    <footer className="bg-[#0F1923] text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-20 md:pt-32 pb-10 md:pb-12">
        {!isContactPage && (
          <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 pb-16 md:pb-24 border-b border-white/10">
            <div>
              <h2 className="font-display text-[44px] md:text-[clamp(48px,6.2vw,88px)] leading-[0.95] font-semibold tracking-[-0.045em] text-balance">
                {t(titleKey)}
              </h2>
              <p className="mt-6 text-base md:text-lg text-white/70 max-w-[520px]">{t(subtitleKey)}</p>
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-propyte-brand text-[#0F1923] font-semibold hover:bg-propyte-cyan-200 transition-colors"
                >
                  {t('whatsappCta')}
                </a>
                <Link
                  href={`/${locale}/contacto`}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  {t('ctaButton')}
                </Link>
              </div>
            </div>
            <dl className="border-t border-white/15 lg:self-end">
              <div className="py-5 border-b border-white/15">
                <dt className="text-[13px] text-white/50">{t('office')}</dt>
                <dd className="mt-1 text-base">{address}</dd>
              </div>
              <div className="py-5 border-b border-white/15">
                <dt className="text-[13px] text-white/50">{t('whatsappPhone')}</dt>
                <dd className="mt-1 text-base"><a href={contact.phoneHref} className="hover:text-propyte-brand transition-colors">{contact.phoneDisplay}</a></dd>
              </div>
              <div className="py-5 border-b border-white/15">
                <dt className="text-[13px] text-white/50">{t('emailLabel')}</dt>
                <dd className="mt-1 text-base flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a href={`mailto:${contact.email}`} className="hover:text-propyte-brand transition-colors">{contact.email}</a>
                  <CopyEmailButton email={contact.email} className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white underline underline-offset-2 transition-colors" />
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="pt-12 md:pt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-x-6 gap-y-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href={`/${locale}`} className="inline-flex items-center min-h-[44px] mb-4" aria-label="Propyte">
              <Image
                src="/img/logos/logo-horizontal-white.png"
                alt="Propyte"
                width={2420}
                height={452}
                sizes="150px"
                /* w-[150px] reserva el box antes de que cargue el logo lazy (CLS). */
                className="h-7 w-[150px] object-contain"
              />
            </Link>
            <p className="text-[15px] text-white/60 leading-relaxed max-w-[320px]">{t('description')}</p>
            <div className="flex gap-3 mt-5">
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <Instagram size={18} />
              </a>
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <nav aria-label={t('properties')}>
            <h3 className={headCls}>{t('properties')}</h3>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/propiedades`} className={linkCls}>{t('allProperties')}</Link></li>
              <li><Link href={`/${locale}/propiedades?city=Playa+del+Carmen`} className={linkCls}>{t('playaDelCarmen')}</Link></li>
              <li><Link href={`/${locale}/propiedades?city=Tulum`} className={linkCls}>{t('tulum')}</Link></li>
              <li><Link href={`/${locale}/propiedades?stage=preventa`} className={linkCls}>{t('presale')}</Link></li>
              <li><Link href={`/${locale}/propiedades?type=terreno`} className={linkCls}>{t('land')}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t('company')}>
            <h3 className={headCls}>{t('company')}</h3>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/nosotros/quienes-somos`} className={linkCls}>{t('aboutUs')}</Link></li>
              <li><Link href={`/${locale}/como-comprar`} className={linkCls}>{t('howToBuy')}</Link></li>
              <li><Link href={`/${locale}/como-invertir`} className={linkCls}>{t('howToInvest')}</Link></li>
              <li><Link href={`/${locale}/financiamiento`} className={linkCls}>{t('financing')}</Link></li>
              <li><Link href={`/${locale}/desarrolladores`} className={linkCls}>{t('developersLink')}</Link></li>
              <li><Link href={`/${locale}/brokers`} className={linkCls}>{t('brokersLink')}</Link></li>
              <li><Link href={`/${locale}/unete`} className={linkCls}>{t('recruitment')}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t('resources')}>
            <h3 className={headCls}>{t('resources')}</h3>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/guias/terrenos-residenciales`} className={linkCls}>{t('landGuide')}</Link></li>
              <li><Link href={`/${locale}/faq`} className={linkCls}>FAQ</Link></li>
              <li><Link href={`/${locale}/glosario`} className={linkCls}>{t('glossary')}</Link></li>
              <li><Link href={`/${locale}/promociones`} className={linkCls}>{t('promotions')}</Link></li>
              <li><Link href={`/${locale}/mercado`} className={linkCls}>{t('market')}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t('legal')}>
            <h3 className={headCls}>{t('legal')}</h3>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/metodologia`} className={linkCls}>{t('methodology')}</Link></li>
              <li><Link href={`/${locale}/nosotros/equipo-comercial`} className={linkCls}>{t('team')}</Link></li>
              <li><Link href={`/${locale}/aviso-legal-inversion`} className={linkCls}>{t('investmentNotice')}</Link></li>
              <li><Link href={`/${locale}/privacidad`} className={linkCls}>{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/terminos`} className={linkCls}>{t('terms')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className={linkCls}>{t('cookiesLink')}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-white/55">© {new Date().getFullYear()} Propyte. {t('rights')}</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={reopenBanner}
              className="inline-flex items-center min-h-[44px] md:min-h-0 text-white/55 hover:text-propyte-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand rounded"
            >
              {t('cookieSettings')}
            </button>
            <a
              href="https://webkoistudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] px-3 -mx-3 rounded text-white/55 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand"
            >
              <span>
                {t('developedBy')}{' '}
                <span className="text-propyte-brand underline underline-offset-4 decoration-propyte-brand/40">Web Koi Studio</span>
              </span>
            </a>
          </div>
        </div>
        <p className="mt-4 text-xs text-white/55 text-center">{t('disclaimer')}</p>
      </div>
    </footer>
  );
}
