'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

type Locale = 'es' | 'en';

/**
 * Swaps the `/es|/en` prefix on the current path and navigates. Extracted so
 * every language switcher in the layout (ActionsPill, MobileHeader, MobileMenu)
 * shares one implementation of "what switching locale means" instead of each
 * reimplementing the same regex + router.push.
 */
export function useLocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    if (newLocale === locale) return;
    const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  }

  return { locale, switchLocale };
}
