'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import SearchBubble from './SearchBubble';
import ActionsPill from './ActionsPill';
import MobileHeader from './MobileHeader';
import MobileMenu from './MobileMenu';
import type { HubSiteConfig } from '@/lib/hub-content';

type HeaderMode = 'home' | 'dark' | 'default';

function deriveMode(pathname: string): HeaderMode {
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  if (bare === '/' || bare === '') return 'home';
  if (bare.startsWith('/destacados') || bare.startsWith('/built') || bare.startsWith('/mercado')) {
    return 'dark';
  }
  return 'default';
}

export default function Header({ siteConfig }: { siteConfig?: HubSiteConfig }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mode = deriveMode(pathname);

  // Listing archives = exactamente /desarrollos y /propiedades (sin /tipo,
  // /etapa, ciudades, ni detail). Aquí ocultamos burbuja porque la página
  // ya tiene FilterBar propio + barra de búsqueda interna.
  const isListingArchive = !!pathname.match(/^\/(es|en)\/(desarrollos|propiedades)\/?$/);

  // Home
  const isHome = mode === 'home';

  // Reglas:
  //   home pre-scroll        → ocultar burbuja
  //   /desarrollos /propiedades → ocultar burbuja siempre
  //   resto                  → mostrar burbuja siempre
  const hideBubble = (isHome && !scrolled) || isListingArchive;

  // Pill (Anuncia + currency + idioma + Contacto): SIEMPRE visible.
  // Antes lo escondíamos en archives + content-only, decisión revertida
  // para mantener acceso constante a CTA Contacto.
  const showPill = true;

  // Bubble dark variant: cuando el hero detrás es oscuro y aún no hubo scroll
  const darkBubble = (mode === 'home' || mode === 'dark') && !scrolled;

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {/* Desktop sidebar (72px) */}
      <Sidebar />

      {/* Desktop floating header (search bubble + actions pill).
          Padding vertical reducido en archives (no hay burbuja, así que
          el alto del header se reduce y deja más aire al contenido).
          Strip glass cristalino on-scroll: se monta detrás del contenido
          cuando hay scroll para anclar visualmente la SearchBubble + Pill
          sobre fondos blancos. Solo desktop (Q6 del speckit cristalino-sitio-wide). */}
      <header
        className={`hidden lg:block fixed top-0 left-0 right-0 z-40 lg:ml-[72px]`}
        style={{ pointerEvents: 'none' }}
      >
        {/* propyte-strip-glass removido 2026-05-15 — header desktop debe ser
            completamente transparente en todas las rutas. La SearchBubble +
            ActionsPill llevan su propio glass background internamente. */}
        <div
          className={`relative flex items-start px-4 gap-4 ${
            isListingArchive ? 'pt-2 pb-1' : 'pt-4 pb-2'
          }`}
        >
          {/* Left spacer to balance the pill on the right */}
          {showPill && <div className="w-0 xl:w-[280px] 2xl:w-[320px] shrink-0" />}

          {/* Search bubble (centered) */}
          <div
            className={`flex-1 max-w-[600px] mx-auto transition-all duration-300 ${
              hideBubble ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
            }`}
            style={{ pointerEvents: hideBubble ? 'none' : 'auto' }}
            aria-hidden={hideBubble}
          >
            <SearchBubble variant="desktop" dark={darkBubble} />
          </div>

          {/* Actions pill (right) — siempre visible */}
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
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} siteConfig={siteConfig} />
    </>
  );
}
