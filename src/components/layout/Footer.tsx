'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, Mail, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-[#0F1923] text-white">
      {/* Top CTA strip */}
      <div className="bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{t('ctaTitle')}</h3>
            <p className="text-white/60 text-sm">{t('ctaSubtitle')}</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="h-11 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold text-sm rounded-lg transition-colors flex items-center"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="inline-flex items-center mb-4" aria-label="Propyte">
              <Image
                src="/img/logos/logo-horizontal-white.png"
                alt="Propyte"
                width={2420}
                height={452}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-4">{t('description')}</p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/propyte.mx/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/propyte"
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
              <li><Link href={`/${locale}/propiedades`} className="text-sm text-white/50 hover:text-white transition-colors">{t('allProperties')}</Link></li>
              <li><Link href={`/${locale}/propiedades?city=Playa+del+Carmen`} className="text-sm text-white/50 hover:text-white transition-colors">{t('playaDelCarmen')}</Link></li>
              <li><Link href={`/${locale}/propiedades?city=Tulum`} className="text-sm text-white/50 hover:text-white transition-colors">{t('tulum')}</Link></li>
              <li><Link href={`/${locale}/propiedades?stage=preventa`} className="text-sm text-white/50 hover:text-white transition-colors">{t('presale')}</Link></li>
              <li><Link href={`/${locale}/propiedades?type=terreno`} className="text-sm text-white/50 hover:text-white transition-colors">{t('land')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('company')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/nosotros/quienes-somos`} className="text-sm text-white/50 hover:text-white transition-colors">{t('aboutUs')}</Link></li>
              <li><Link href={`/${locale}/como-comprar`} className="text-sm text-white/50 hover:text-white transition-colors">{t('howToBuy')}</Link></li>
              <li><Link href={`/${locale}/como-invertir`} className="text-sm text-white/50 hover:text-white transition-colors">{t('howToInvest')}</Link></li>
              <li><Link href={`/${locale}/financiamiento`} className="text-sm text-white/50 hover:text-white transition-colors">{t('financing')}</Link></li>
              <li><Link href={`/${locale}/desarrolladores`} className="text-sm text-white/50 hover:text-white transition-colors">{t('developersLink')}</Link></li>
              <li><Link href={`/${locale}/corredores`} className="text-sm text-white/50 hover:text-white transition-colors">{t('brokersLink')}</Link></li>
              <li><Link href={`/${locale}/unete`} className="text-sm text-white/50 hover:text-white transition-colors">{t('careers')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('resources')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/faq`} className="text-sm text-white/50 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href={`/${locale}/glosario`} className="text-sm text-white/50 hover:text-white transition-colors">{t('glossary')}</Link></li>
              <li><Link href={`/${locale}/promociones`} className="text-sm text-white/50 hover:text-white transition-colors">{t('promotions')}</Link></li>
              <li><Link href={`/${locale}/mercado`} className="text-sm text-white/50 hover:text-white transition-colors">{t('market')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('legal')}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/privacidad`} className="text-sm text-white/50 hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/terminos`} className="text-sm text-white/50 hover:text-white transition-colors">{t('terms')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="text-sm text-white/50 hover:text-white transition-colors">{t('cookiesLink')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{t('contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/50">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>5ta Avenida, Playa del Carmen, Q.Roo</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/50">
                <Mail size={14} className="flex-shrink-0" />
                <span>info@propyte.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Propyte. {t('rights')}
            </p>
            <p className="text-sm text-white/40">
              {t('developedBy')}{' '}
              <a href="https://webkoistudio.com" target="_blank" rel="noopener noreferrer" className="text-[#5CE0D2] hover:text-white transition-colors">
                Web Koi Studio
              </a>
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/20 text-center">
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
