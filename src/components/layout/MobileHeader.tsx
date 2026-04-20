'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, ChevronDown } from 'lucide-react';
import SearchBubble from './SearchBubble';

interface MobileHeaderProps {
  mode: 'home' | 'dark' | 'default';
  onOpenMenu: () => void;
  isScrolled: boolean;
  showBubble?: boolean;
}

export default function MobileHeader({ mode, onOpenMenu, isScrolled, showBubble = true }: MobileHeaderProps) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function switchLocale(newLocale: 'es' | 'en') {
    if (newLocale === locale) {
      setLangOpen(false);
      return;
    }
    const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setLangOpen(false);
  }

  // In home/dark mode, show bubble only after scroll (hero has its own search)
  const hideBubbleInHero = mode === 'home' && !isScrolled;
  const displayBubble = showBubble && !hideBubbleInHero;

  // Invert top row text/logo on dark/home before scroll
  const darkTopRow = (mode === 'home' || mode === 'dark') && !isScrolled;

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 propyte-mobile-header-bg" role="banner" aria-label={t('openMenu')}>
      {/* Row 1: Logo | Lang | Hamburger */}
      <div className="flex items-center justify-between h-11 px-3">
        <Link
          href={`/${locale}`}
          className="flex items-center shrink-0"
          aria-label="Propyte"
        >
          <Image
            src={darkTopRow ? '/img/logos/logo-horizontal-white.png' : '/img/logos/logo-horizontal-dark.png'}
            alt="Propyte"
            width={2420}
            height={452}
            priority
            className="h-6 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-1.5">
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-expanded={langOpen}
              aria-label={t('language')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/60 text-[#2C2C2C] transition-colors"
            >
              <span>{locale === 'en' ? '🇺🇸 EN' : '🇲🇽 ES'}</span>
              <ChevronDown size={10} strokeWidth={2} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                <button
                  type="button"
                  onClick={() => switchLocale('es')}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    locale === 'es' ? 'text-[#0D9488] font-semibold' : 'text-[#2C2C2C]'
                  }`}
                >
                  🇲🇽 Español
                </button>
                <button
                  type="button"
                  onClick={() => switchLocale('en')}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    locale === 'en' ? 'text-[#0D9488] font-semibold' : 'text-[#2C2C2C]'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t('openMenu')}
            className={`p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100/50 transition-colors ${darkTopRow ? 'text-white/90' : 'text-[#2C2C2C]'}`}
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Row 2: Search bubble */}
      {displayBubble && (
        <div className="flex justify-center px-3 pb-1.5">
          <SearchBubble variant="mobile" dark={darkTopRow} className="w-full" />
        </div>
      )}
    </header>
  );
}
