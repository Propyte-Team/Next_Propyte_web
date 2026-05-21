'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Home,
  Building2,
  Globe,
  Key,
  Store,
  Menu as MenuIcon,
  Award,
  Users,
  Truck,
  Zap,
  Layout as LayoutIcon,
} from '@/lib/icons';
import { isNavActive } from '@/lib/nav/isActive';
import { useIsVisible } from '@/context/SiteVisibilityContext';
import { VISIBILITY_KEYS } from '@/lib/visibility';

type NavItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: typeof Home;
};

export default function Sidebar() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const showMercado = useIsVisible(VISIBILITY_KEYS.NAV_MERCADO);
  const showBrokers = useIsVisible(VISIBILITY_KEYS.NAV_BROKERS);
  const showProviders = useIsVisible(VISIBILITY_KEYS.NAV_PROVIDERS);
  const showBlog = useIsVisible(VISIBILITY_KEYS.NAV_BLOG);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const mainItems: NavItem[] = [
    { id: 'home', labelKey: 'home', href: `/${locale}`, icon: Home },
    { id: 'developments', labelKey: 'developments', href: `/${locale}/desarrollos`, icon: Building2 },
    { id: 'properties', labelKey: 'properties', href: `/${locale}/propiedades`, icon: Key },
    { id: 'nosotros', labelKey: 'nosotros', href: `/${locale}/nosotros/quienes-somos`, icon: Globe },
    ...(showMercado ? [{ id: 'mercado', labelKey: 'mercado', href: `/${locale}/mercado`, icon: Store } as NavItem] : []),
  ];

  const moreItems: NavItem[] = [
    { id: 'developers', labelKey: 'developers', href: `/${locale}/desarrolladores`, icon: Award },
    ...(showBrokers ? [{ id: 'brokers', labelKey: 'brokers', href: `/${locale}/corredores`, icon: Users } as NavItem] : []),
    ...(showProviders ? [{ id: 'providers', labelKey: 'providers', href: `/${locale}/proveedores`, icon: Truck } as NavItem] : []),
    { id: 'recruitment', labelKey: 'recruitment', href: `/${locale}/unete`, icon: Zap },
    ...(showBlog ? [{ id: 'blog', labelKey: 'blog', href: `/${locale}/blog`, icon: LayoutIcon } as NavItem] : []),
  ];

  function isActive(id: string, href: string): boolean {
    return isNavActive(pathname, id, href, locale);
  }

  const hasActiveChild = moreItems.some((item) => isNavActive(pathname, item.id, item.href, locale));

  return (
    <aside
      aria-label={t('openMenu')}
      className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[72px] bg-[#0F1923] flex-col items-center z-40"
    >
      {/* Logo top */}
      <div className="pt-4 pb-2 flex justify-center">
        <Link
          href={`/${locale}`}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:opacity-80 transition-opacity"
          aria-label="Propyte Home"
        >
          <Image
            src="/img/logos/logo-icon-white.png"
            alt="Propyte"
            width={650}
            height={650}
            sizes="32px"
            priority
            className="w-7 h-7 object-contain"
          />
        </Link>
      </div>

      {/* Main nav (vertically centered) */}
      <nav
        className="flex-1 flex flex-col items-stretch justify-center gap-0.5 w-full px-2"
        aria-label="Main navigation"
      >
        {mainItems.map((item) => {
          const active = isActive(item.id, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={t(item.labelKey)}
              aria-current={active ? 'page' : undefined}
              className={`group flex flex-col items-center gap-1 w-full py-2.5 rounded-xl transition-colors ${
                active ? 'bg-white/10 text-propyte-brand' : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={20} />
              <span className="text-2xs font-medium leading-tight text-center px-1">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* "Más" popup */}
      <div ref={moreRef} className="relative flex flex-col items-center pb-4">
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-controls="sidebar-more-panel"
          aria-current={hasActiveChild ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 w-14 py-2 rounded-xl transition-colors ${
            hasActiveChild ? 'bg-white/10 text-propyte-brand' : 'text-white/65 hover:text-white hover:bg-white/5'
          }`}
        >
          <MenuIcon size={18} />
          <span className="text-2xs font-medium">{t('more')}</span>
        </button>

        {moreOpen && (
          <div
            id="sidebar-more-panel"
            role="menu"
            className="absolute left-[72px] bottom-0 w-56 bg-[#0F1923] border border-white/10 rounded-xl shadow-2xl py-2 z-50"
          >
            {moreItems.map((item) => {
              const active = isActive(item.id, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active ? 'text-propyte-brand bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
