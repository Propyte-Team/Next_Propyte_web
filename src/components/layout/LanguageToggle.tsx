'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const newLocale = locale === 'es' ? 'en' : 'es';
    // Remove current locale prefix and add new one
    const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium text-navy hover:bg-gray-100 transition-colors min-w-[48px] min-h-[48px]"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-lg">{locale === 'es' ? '🇺🇸' : '🇲🇽'}</span>
      <span>{locale === 'es' ? 'EN' : 'ES'}</span>
    </button>
  );
}
