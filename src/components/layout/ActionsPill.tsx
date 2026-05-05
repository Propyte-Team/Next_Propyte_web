'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Building2, ChevronDown, Mail } from 'lucide-react';
import CurrencyToggle from '@/components/ui/CurrencyToggle';

export default function ActionsPill() {
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

  return (
    <div className="propyte-actions-pill-inner flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100/80">
      <Link
        href={`/${locale}/desarrolladores`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2C2C2C] hover:text-[#0F766E] whitespace-nowrap transition-colors"
      >
        <Building2 size={13} strokeWidth={1.75} />
        {t('advertise')}
      </Link>

      <span aria-hidden="true" className="w-px h-4 bg-gray-200" />

      {/* MXN/USD toggle — segmented */}
      <CurrencyToggle />

      <span aria-hidden="true" className="w-px h-4 bg-gray-200" />

      <div ref={langRef} className="relative">
        <button
          type="button"
          onClick={() => setLangOpen((v) => !v)}
          aria-expanded={langOpen}
          aria-haspopup="menu"
          aria-controls="ap-lang-panel"
          aria-label={t('language')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#2C2C2C] hover:text-[#0F766E] rounded-lg transition-colors"
        >
          <span>{locale === 'en' ? '🇺🇸 EN' : '🇲🇽 ES'}</span>
          <ChevronDown size={11} strokeWidth={2} />
        </button>
        {langOpen && (
          <div id="ap-lang-panel" role="menu" className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <button
              type="button"
              role="menuitem"
              onClick={() => switchLocale('es')}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                locale === 'es' ? 'text-[#0F766E] font-semibold' : 'text-[#2C2C2C]'
              }`}
            >
              🇲🇽 Español
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => switchLocale('en')}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                locale === 'en' ? 'text-[#0F766E] font-semibold' : 'text-[#2C2C2C]'
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        )}
      </div>

      <Link
        href={`/${locale}/contacto`}
        className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] text-xs font-semibold rounded-full transition-colors"
      >
        <Mail size={13} strokeWidth={2} />
        {t('contact')}
      </Link>
    </div>
  );
}
