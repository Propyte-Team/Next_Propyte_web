'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  X,
  Home,
  Building2,
  Key,
  Globe,
  Store,
  Award,
  Users,
  Truck,
  Zap,
  Layout as LayoutIcon,
  Mail,
  MessageCircle,
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  function isActive(id: string, href: string): boolean {
    const bare = pathname.replace(/^\/(es|en)/, '') || '/';
    if (id === 'home') return bare === '/' || bare === '';
    if (id === 'developments') return bare.startsWith('/desarrollos');
    if (id === 'properties') return bare.startsWith('/propiedades');
    if (id === 'nosotros') return bare.startsWith('/nosotros');
    if (id === 'mercado') return bare.startsWith('/mercado') || bare.startsWith('/zonas');
    return bare.startsWith(href.replace(`/${locale}`, ''));
  }
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function switchLocale(newLocale: 'es' | 'en') {
    if (newLocale === locale) return;
    const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
    onClose();
  }

  const allItems = [
    { id: 'home', labelKey: 'home', href: `/${locale}`, icon: Home },
    { id: 'developments', labelKey: 'developments', href: `/${locale}/desarrollos`, icon: Building2 },
    { id: 'properties', labelKey: 'properties', href: `/${locale}/propiedades`, icon: Key },
    { id: 'nosotros', labelKey: 'nosotros', href: `/${locale}/nosotros/quienes-somos`, icon: Globe },
    { id: 'mercado', labelKey: 'mercado', href: `/${locale}/mercado`, icon: Store },
    { id: 'developers', labelKey: 'developers', href: `/${locale}/desarrolladores`, icon: Award },
    { id: 'brokers', labelKey: 'brokers', href: `/${locale}/corredores`, icon: Users },
    { id: 'providers', labelKey: 'providers', href: `/${locale}/proveedores`, icon: Truck },
    { id: 'recruitment', labelKey: 'recruitment', href: `/${locale}/unete`, icon: Zap },
    { id: 'blog', labelKey: 'blog', href: `/${locale}/blog`, icon: LayoutIcon },
    { id: 'contact', labelKey: 'contact', href: `/${locale}/contacto`, icon: Mail },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label={t('closeMenu')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Drawer (left, dark) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            id="mobile-menu-drawer"
            className="absolute left-0 top-0 h-full w-[280px] bg-[#0F1923] shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-baseline">
                <span className="text-xl font-bold tracking-tight text-white">PROP</span>
                <span className="text-xl font-bold tracking-tight text-[#5CE0D2]">YTE</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('closeMenu')}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Nav */}
            <nav
              aria-label="Mobile navigation"
              className="flex-1 overflow-y-auto py-4 px-3"
            >
              {allItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id, item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 py-3 px-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-[#5CE0D2] bg-white/10 font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}

              {/* Language */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="px-3 text-xs text-white/30 uppercase tracking-wider mb-2">
                  {t('language')}
                </p>
                <button
                  type="button"
                  onClick={() => switchLocale('es')}
                  className={`flex items-center gap-3 w-full py-2.5 px-3 text-sm text-left rounded-lg transition-colors ${
                    locale === 'es'
                      ? 'text-[#5CE0D2] bg-white/10 font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🇲🇽 Español
                </button>
                <button
                  type="button"
                  onClick={() => switchLocale('en')}
                  className={`flex items-center gap-3 w-full py-2.5 px-3 text-sm text-left rounded-lg transition-colors ${
                    locale === 'en'
                      ? 'text-[#5CE0D2] bg-white/10 font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </nav>

            {/* WhatsApp CTA */}
            {phone && (
              <div className="p-4 border-t border-white/10">
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(
                    locale === 'es'
                      ? 'Hola, me interesa información sobre propiedades en la Riviera Maya'
                      : 'Hi, I want info about properties in Riviera Maya'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-semibold rounded-lg transition-colors"
                >
                  <MessageCircle size={18} strokeWidth={2} />
                  WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
