'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Crown,
  FileText,
  HelpCircle,
  Key,
  Mail,
  MapPin,
  Menu as MenuIcon,
  Search,
  Store,
  Target,
  Truck,
  Users,
  X,
  type LucideIcon,
} from '@/lib/icons';
import { isNavActive } from '@/lib/nav/isActive';
import { useIsVisible } from '@/context/SiteVisibilityContext';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import { useLocaleSwitcher } from '@/hooks/useLocaleSwitcher';
import { useCssHeightVar } from '@/hooks/useCssHeightVar';
import AreaToggle from '@/components/ui/AreaToggle';
import SearchBubble from './SearchBubble';

gsap.registerPlugin(useGSAP);

type NavItem = { id: string; key: string; href: string; icon: LucideIcon };
type NavGroup = { key: string; items: NavItem[] };

// Rutas con hero oscuro a sangre: ahí el nav arranca translúcido sobre la foto.
function isTransparentRoute(pathname: string) {
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  return bare === '/' || bare === '';
}

/**
 * Nav del rediseño v3: píldora fija con logo, botón "Menú" (desplegable con
 * todas las secciones agrupadas), accesos rápidos con ícono + palabra clave y
 * el CTA de contacto. En móvil, barra con logo + hamburguesa y hoja completa.
 * Sustituye la barra lateral de 72px, la burbuja de búsqueda flotante y la
 * píldora de acciones (Header.tsx los dejaba de montar a partir de v3).
 */
export default function SiteNav() {
  const t = useTranslations('siteNav');
  const locale = useLocale();
  const pathname = usePathname();
  const { switchLocale } = useLocaleSwitcher();
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const areasRef = useRef<HTMLUListElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const panelTl = useRef<gsap.core.Timeline | null>(null);
  const sheetTl = useRef<gsap.core.Timeline | null>(null);

  // MainPadding reserva este alto en las páginas interiores.
  useCssHeightVar(headerRef, '--desktop-header-height');
  useCssHeightVar(headerRef, '--mobile-header-height');

  const showBlog = useIsVisible(VISIBILITY_KEYS.NAV_BLOG);
  const showMercado = useIsVisible(VISIBILITY_KEYS.NAV_MERCADO);
  const showBrokers = useIsVisible(VISIBILITY_KEYS.NAV_BROKERS);
  const showProviders = useIsVisible(VISIBILITY_KEYS.NAV_PROVIDERS);

  const href = (path: string) => `/${locale}${path}`;
  const groups: NavGroup[] = [
    { key: 'groupBuy', items: [
      { id: 'developments', key: 'developments', href: href('/desarrollos'), icon: Building2 },
      { id: 'exclusivos', key: 'exclusivos', href: href('/exclusivos'), icon: Crown },
      { id: 'properties', key: 'properties', href: href('/propiedades'), icon: Key },
      { id: 'zones', key: 'zones', href: href('/zonas'), icon: MapPin },
    ] },
    { key: 'groupLearn', items: [
      ...(showBlog ? [{ id: 'blog', key: 'blog', href: href('/blog'), icon: BookOpen }] : []),
      { id: 'guides', key: 'landGuide', href: href('/guias/terrenos-residenciales'), icon: FileText },
      { id: 'faq', key: 'faq', href: href('/faq'), icon: HelpCircle },
      ...(showMercado ? [{ id: 'mercado', key: 'market', href: href('/mercado'), icon: Store }] : []),
      { id: 'methodology', key: 'methodology', href: href('/metodologia'), icon: Target },
    ] },
    { key: 'groupPropyte', items: [
      { id: 'nosotros', key: 'about', href: href('/nosotros/quienes-somos'), icon: Users },
      { id: 'developers', key: 'developers', href: href('/desarrolladores'), icon: Award },
      ...(showBrokers ? [{ id: 'brokers', key: 'brokers', href: href('/brokers'), icon: Briefcase }] : []),
      ...(showProviders ? [{ id: 'providers', key: 'providers', href: href('/proveedores'), icon: Truck }] : []),
      { id: 'recruitment', key: 'recruitment', href: href('/unete'), icon: Users },
      { id: 'contact', key: 'contact', href: href('/contacto'), icon: Mail },
    ] },
  ];
  const quick: NavItem[] = [
    groups[0].items[0],
    groups[0].items[2],
    groups[0].items[3],
    ...(showBlog ? [groups[1].items[0]] : []),
  ];
  const isActive = (item: NavItem) => isNavActive(pathname, item.id, item.href, locale);

  const transparentRoute = isTransparentRoute(pathname);
  const solid = !transparentRoute || scrolled || panelOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar menús al navegar (ajuste de estado durante el render, patrón
  // recomendado por React en vez de un efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setPanelOpen(false);
    setSheetOpen(false);
  }

  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = reduce ? 0 : 1;
    if (panelRef.current) {
      panelTl.current = gsap.timeline({ paused: true })
        .fromTo(panelRef.current, { autoAlpha: 0, y: -12, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4 * d, ease: 'power3.out' })
        .from(panelRef.current.querySelectorAll('[data-grp]'), { y: 14, autoAlpha: 0, duration: 0.4 * d, stagger: 0.06 * d, ease: 'power3.out' }, '-=0.25')
        .from(panelRef.current.querySelectorAll('[data-item]'), { x: -10, autoAlpha: 0, duration: 0.35 * d, stagger: 0.025 * d, ease: 'power2.out' }, '-=0.35');
    }
    if (sheetRef.current) {
      sheetTl.current = gsap.timeline({ paused: true })
        .to(sheetRef.current, { autoAlpha: 1, duration: 0.3 * d, ease: 'power2.out' })
        .from(sheetRef.current.querySelectorAll('[data-sheet-item]'), { y: 24, autoAlpha: 0, duration: 0.45 * d, stagger: 0.03 * d, ease: 'power3.out' }, '-=0.1');
    }
    if (navRef.current && !reduce) {
      gsap.from(navRef.current, { y: -24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 });
    }
  }, { dependencies: [locale, showBlog, showMercado, showBrokers, showProviders] });

  useEffect(() => {
    const tl = panelTl.current;
    if (!tl) return;
    if (panelOpen) {
      tl.timeScale(1).play();
      const first = panelRef.current?.querySelector<HTMLElement>('input, [data-item]');
      first?.focus({ preventScroll: true });
    } else {
      tl.timeScale(1.8).reverse();
    }
  }, [panelOpen]);

  useEffect(() => {
    const tl = sheetTl.current;
    if (!tl) return;
    if (sheetOpen) tl.timeScale(1).play();
    else tl.timeScale(1.8).reverse();
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  // Escape y clic fuera.
  useEffect(() => {
    if (!panelOpen && !sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (panelOpen) { setPanelOpen(false); menuBtnRef.current?.focus({ preventScroll: true }); }
      if (sheetOpen) setSheetOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelOpen && !panelRef.current?.contains(target) && !menuBtnRef.current?.contains(target)) setPanelOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [panelOpen, sheetOpen]);

  const moveHighlight = (el: HTMLElement | null) => {
    if (!hlRef.current) return;
    if (!el) { gsap.to(hlRef.current, { opacity: 0, duration: 0.25 }); return; }
    gsap.to(hlRef.current, { x: el.offsetLeft, width: el.offsetWidth, opacity: 1, duration: 0.35, ease: 'power3.out' });
  };

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 pt-3 lg:pt-5 px-4 lg:px-10 pb-3 pointer-events-none">
      <nav
        ref={navRef}
        aria-label={t('ariaMain')}
        className={`pointer-events-auto flex items-center gap-3 lg:gap-5 h-14 lg:h-16 pl-5 lg:pl-6 pr-1.5 lg:pr-2.5 rounded-full border text-white backdrop-blur-xl transition-colors duration-300 ${
          solid ? 'bg-[#0F1923]/95 border-white/10' : 'bg-[#0F1923]/40 border-white/20'
        }`}
      >
        <Link href={href('')} aria-label={t('home')} className="shrink-0">
          <Image src="/img/logos/logo-horizontal-white.png" alt="Propyte" width={2420} height={452} sizes="120px" priority className="h-[19px] lg:h-[22px] w-auto" />
        </Link>

        <button
          ref={menuBtnRef}
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-controls="site-nav-panel"
          className={`hidden lg:inline-flex items-center gap-2 h-10 pl-3 pr-4 rounded-full text-sm font-semibold transition-colors ${
            panelOpen ? 'bg-propyte-brand text-[#0F1923]' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <MenuIcon size={18} />
          {t('menu')}
        </button>

        <ul ref={areasRef} className="relative hidden lg:flex items-center gap-0.5 text-[15px] font-medium" onMouseLeave={() => moveHighlight(null)}>
          <span ref={hlRef} aria-hidden="true" className="absolute left-0 top-0 h-10 rounded-full bg-white/10 opacity-0 pointer-events-none" />
          {quick.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={t(item.key)}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={(e) => moveHighlight(e.currentTarget)}
                  onFocus={(e) => moveHighlight(e.currentTarget)}
                  className={`relative inline-flex items-center gap-2 h-10 px-3 rounded-full ${active ? 'text-propyte-brand' : 'text-white/90 hover:text-white'}`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="hidden xl:inline">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          <button
            type="button"
            onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')}
            className="hidden lg:inline-flex h-10 px-2 items-center text-sm text-white/80 hover:text-white"
            aria-label={t('switchLanguage')}
          >
            {locale === 'en' ? 'EN · ES' : 'ES · EN'}
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="hidden lg:inline-flex xl:hidden w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label={t('search')}
          >
            <Search size={18} />
          </button>
          <Link
            href={href('/contacto')}
            className="hidden lg:inline-flex items-center h-11 px-5 rounded-full bg-propyte-brand text-[#0F1923] text-[15px] font-semibold hover:bg-propyte-cyan-200 transition-colors"
          >
            {t('cta')}
          </Link>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
            aria-controls="site-nav-sheet"
            aria-label={t('openMenu')}
            className="lg:hidden inline-flex w-11 h-11 items-center justify-center rounded-full bg-white/15"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </nav>

      {/* Desplegable de escritorio: buscador + secciones agrupadas + ajustes. */}
      <div
        ref={panelRef}
        id="site-nav-panel"
        role="region"
        aria-label={t('menu')}
        className="pointer-events-auto invisible opacity-0 hidden lg:block absolute top-[92px] left-10 w-[min(880px,calc(100%-80px))] rounded-[20px] border border-white/15 bg-[#0F1923]/97 backdrop-blur-xl text-white p-7 shadow-2xl origin-top-left"
      >
        <div data-grp className="mb-6">
          <SearchBubble variant="desktop" dark />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {groups.map((g) => (
            <div key={g.key} data-grp>
              <p className="font-display text-[13px] font-medium text-white/50 mb-2">{t(g.key)}</p>
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.id}
                    data-item
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-start gap-3 -mx-2.5 px-2.5 py-2.5 rounded-xl hover:bg-white/[0.08] focus-visible:bg-white/[0.08] transition-colors"
                  >
                    <Icon size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-propyte-brand" />
                    <span>
                      <b className={`block text-base font-semibold ${active ? 'text-propyte-brand' : ''}`}>{t(item.key)}</b>
                      <span className="block text-[13px] text-white/60 mt-0.5">{t(`${item.key}Desc`)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div data-grp className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-white/60">{t('units')}</span>
            <div className="bg-white rounded-full px-2 py-1"><AreaToggle /></div>
          </div>
          <Link href={href('/desarrolladores')} className="text-propyte-brand font-semibold hover:underline underline-offset-4">
            {t('advertise')} →
          </Link>
        </div>
      </div>

      {/* Hoja móvil a pantalla completa. */}
      <div
        ref={sheetRef}
        id="site-nav-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
        className="lg:hidden pointer-events-auto invisible opacity-0 fixed inset-0 z-[60] bg-[#0F1923] text-white overflow-y-auto px-4 pt-20 pb-8 flex flex-col gap-6"
      >
        <button
          type="button"
          onClick={() => setSheetOpen(false)}
          aria-label={t('closeMenu')}
          className="absolute top-4 right-5 w-11 h-11 rounded-full bg-white/10 inline-flex items-center justify-center"
        >
          <X size={20} />
        </button>
        <div data-sheet-item><SearchBubble variant="mobile" /></div>
        {groups.map((g) => (
          <div key={g.key} data-sheet-item>
            <p className="font-display text-[13px] font-medium text-white/50 mb-1">{t(g.key)}</p>
            {g.items.map((item) => (
              <Link key={item.id} href={item.href} className="block font-display text-[28px] leading-tight font-semibold tracking-[-0.03em] py-1">
                {t(item.key)}
              </Link>
            ))}
          </div>
        ))}
        <div data-sheet-item className="mt-auto flex flex-col gap-3">
          <Link href={href('/contacto')} className="inline-flex items-center justify-center h-12 rounded-full bg-propyte-brand text-[#0F1923] font-semibold">
            {t('cta')}
          </Link>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')} className="text-white/80 h-11">
              {locale === 'en' ? 'Español' : 'English'}
            </button>
            <div className="bg-white rounded-full px-2 py-1"><AreaToggle /></div>
          </div>
        </div>
      </div>
    </header>
  );
}
