'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  translations: {
    home: string;
    properties: string;
    developers: string;
    contact: string;
  };
}

export default function MobileMenu({ isOpen, onClose, locale, translations }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isEn = locale === 'en';
  const links = [
    { href: `/${locale}`, label: translations.home },
    { href: `/${locale}/propiedades`, label: translations.properties },
    { href: `/${locale}/como-comprar`, label: isEn ? 'How to Buy' : 'Cómo Comprar' },
    { href: `/${locale}/como-invertir`, label: isEn ? 'How to Invest' : 'Cómo Invertir' },
    { href: `/${locale}/financiamiento`, label: isEn ? 'Financing' : 'Financiamiento' },
    { href: `/${locale}/promociones`, label: isEn ? 'Promotions' : 'Promociones' },
    { href: `/${locale}/desarrolladores`, label: translations.developers },
    { href: `/${locale}/faq`, label: 'FAQ' },
    { href: `/${locale}/contacto`, label: translations.contact },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <Logo variant="compact" />
              <button onClick={onClose} className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center" aria-label="Close menu">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-1">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block px-4 py-3 text-lg font-medium text-graphite hover:bg-gray-light rounded-btn transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t space-y-3">
              <LanguageToggle />
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-semibold rounded-btn transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
