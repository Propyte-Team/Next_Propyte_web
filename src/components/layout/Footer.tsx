'use client';

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
            <div className="flex items-baseline mb-4">
              <span className="text-2xl font-bold tracking-tight text-white">PROP</span>
              <span className="text-2xl font-bold tracking-tight text-[#5CE0D2]">YTE</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-4">{t('description')}</p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook size={16} />
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
              <li><Link href={`/${locale}/como-comprar`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Cómo Comprar' : 'How to Buy'}</Link></li>
              <li><Link href={`/${locale}/como-invertir`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Cómo Invertir' : 'How to Invest'}</Link></li>
              <li><Link href={`/${locale}/financiamiento`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Financiamiento' : 'Financing'}</Link></li>
              <li><Link href={`/${locale}/desarrolladores`} className="text-sm text-white/50 hover:text-white transition-colors">{t('developersLink')}</Link></li>
              <li><Link href={`/${locale}/corredores`} className="text-sm text-white/50 hover:text-white transition-colors">{t('brokersLink')}</Link></li>
              <li><Link href={`/${locale}/unete`} className="text-sm text-white/50 hover:text-white transition-colors">{t('careers')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{locale === 'es' ? 'Recursos' : 'Resources'}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/faq`} className="text-sm text-white/50 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href={`/${locale}/glosario`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Glosario' : 'Glossary'}</Link></li>
              <li><Link href={`/${locale}/promociones`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Promociones' : 'Promotions'}</Link></li>
              <li><Link href={`/${locale}/mercado`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Mercado' : 'Market'}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-white/80">{locale === 'es' ? 'Legal' : 'Legal'}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/privacidad`} className="text-sm text-white/50 hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/terminos`} className="text-sm text-white/50 hover:text-white transition-colors">{t('terms')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="text-sm text-white/50 hover:text-white transition-colors">{locale === 'es' ? 'Cookies' : 'Cookies'}</Link></li>
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
              {locale === 'es' ? 'Desarrollado por' : 'Developed by'}{' '}
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
