'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import SearchBubble from './SearchBubble';
import ActionsPill from './ActionsPill';
import MobileHeader from './MobileHeader';
import MobileMenu from './MobileMenu';

type HeaderMode = 'home' | 'dark' | 'default';

function deriveMode(pathname: string): HeaderMode {
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  if (bare === '/' || bare === '') return 'home';
  if (bare.startsWith('/destacados') || bare.startsWith('/built') || bare.startsWith('/mercado')) {
    return 'dark';
  }
  return 'default';
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mode = deriveMode(pathname);

  // Archives: hide floating header on desktop (archive has its own filter bar)
  const isArchive =
    pathname.match(/\/(es|en)\/propiedades(\/|$|\?)/) ||
    pathname.match(/\/(es|en)\/desarrollos(\/|$|\?)/);

  // Content-only pages: hide ActionsPill + SearchBubble on desktop. SearchBubble
  // y ActionsPill no aportan en hojas de texto (glosario, faq, legal, nosotros,
  // como-comprar, etc.) y compiten visualmente con el contenido.
  const isContentOnly = pathname.match(
    /\/(es|en)\/(glosario|faq|privacidad|terminos|cookies|nosotros|como-comprar|como-invertir|financiamiento|blog|promociones)(\/|$)/
  );

  const showPill = !isArchive && !isContentOnly;

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hideBubbleOnHome = mode === 'home' && !scrolled;
  const hideBubble = hideBubbleOnHome || !!isArchive || !!isContentOnly;
  const darkBubble = (mode === 'home' || mode === 'dark') && !scrolled;

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {/* Desktop sidebar (72px) */}
      <Sidebar />

      {/* Desktop floating header (search bubble + actions pill) */}
      <header
        className="hidden lg:block fixed top-0 left-0 right-0 z-40 lg:ml-[72px]"
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-start pt-4 pb-2 px-4 gap-4">
          {/* Left spacer to balance the pill on the right */}
          {showPill && <div className="w-0 xl:w-[280px] 2xl:w-[320px] shrink-0" />}

          {/* Search bubble (centered), hidden before scroll on home */}
          <div
            className={`flex-1 max-w-[600px] mx-auto transition-all duration-300 ${
              hideBubble ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
            }`}
            style={{ pointerEvents: hideBubble ? 'none' : 'auto' }}
          >
            <SearchBubble variant="desktop" dark={darkBubble} />
          </div>

          {/* Actions pill (right) */}
          {showPill && (
            <div className="shrink-0" style={{ pointerEvents: 'auto' }}>
              <ActionsPill />
            </div>
          )}
        </div>
      </header>

      {/* Mobile header (gradient, 2 rows) */}
      <MobileHeader
        mode={mode}
        onOpenMenu={() => setMobileOpen(true)}
        isScrolled={scrolled}
        isMenuOpen={mobileOpen}
      />

      {/* Mobile menu drawer */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
