'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, ChevronDown, User } from 'lucide-react';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';
import MobileMenu from './MobileMenu';

export default function Header() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close "Más" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tMercado = useTranslations('mercado');

  const mainLinks = [
    { href: `/${locale}/propiedades`, label: t('properties') },
    { href: `/${locale}/propiedades?stage=preventa`, label: t('presale') },
    { href: `/${locale}/mercado`, label: tMercado('navLabel') },
    { href: `/${locale}/nosotros/quienes-somos`, label: locale === 'es' ? 'Nosotros' : 'About' },
    { href: `/${locale}/contacto`, label: t('contact') },
  ];

  const moreLinks = [
    { href: `/${locale}/como-comprar`, label: locale === 'es' ? 'Cómo Comprar' : 'How to Buy' },
    { href: `/${locale}/como-invertir`, label: locale === 'es' ? 'Cómo Invertir' : 'How to Invest' },
    { href: `/${locale}/financiamiento`, label: locale === 'es' ? 'Financiamiento' : 'Financing' },
    { href: `/${locale}/promociones`, label: locale === 'es' ? 'Promociones' : 'Promotions' },
    { href: `/${locale}/desarrolladores`, label: t('developers') },
    { href: `/${locale}/corredores`, label: t('brokers') },
    { href: `/${locale}/built`, label: t('built') },
    { href: `/${locale}/faq`, label: 'FAQ' },
    { href: `/${locale}/unete`, label: locale === 'es' ? 'Únete' : 'Join Us' },
  ];

  const linkClass = "px-3 py-2 text-sm font-semibold text-[#2C2C2C] hover:text-[#5CE0D2] rounded-lg hover:bg-gray-50 transition-colors";

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <header className={`sticky top-0 z-30 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-8">
              <Logo variant="compact" />

              <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
                {mainLinks.map(link => (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}

                {/* "Más" dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`${linkClass} flex items-center gap-1`}
                    aria-expanded={moreOpen}
                    aria-haspopup="true"
                  >
                    {t('more')} <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute top-full right-0 mt-1 w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
                      <div className="grid grid-cols-2 gap-1">
                        {moreLinks.map(link => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block px-3 py-2.5 text-sm font-medium text-[#2C2C2C] hover:text-[#5CE0D2] hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setMoreOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <LanguageToggle />

              <Link
                href={`/${locale}/desarrolladores`}
                className="hidden md:flex items-center h-9 px-4 text-sm font-semibold text-[#2C2C2C] hover:text-[#5CE0D2] hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t('advertise')}
              </Link>

              <Link
                href={`/${locale}/contacto`}
                className="hidden sm:flex items-center gap-1.5 h-10 px-5 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold text-sm rounded-lg transition-colors"
              >
                <User size={16} />
                {t('contact')}
              </Link>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-50"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        locale={locale}
        translations={{
          home: t('home'),
          properties: t('properties'),
          developers: t('developers'),
          contact: t('contact'),
        }}
      />
    </>
  );
}
