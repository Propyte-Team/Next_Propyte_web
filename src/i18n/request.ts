import { getRequestConfig } from 'next-intl/server';
import { IntlErrorCode } from 'next-intl';
import type { IntlError } from 'next-intl';
import { routing } from './routing';

/**
 * Humaniza un path/key faltante para que el usuario nunca vea
 * "availability.entrega_inmediata" o "types.Departamento". Defensa de
 * último recurso: un missing message NUNCA debe tirar 500 en SSR/RSC.
 *
 * Ver feedback_next_intl_path_fallback (incidente prod 2026-05-25,
 * /es/desarrollos/turena-... → 500 por MISSING_MESSAGE durante streaming).
 */
function humanizeI18nKey(raw: string): string {
  const last = raw.split('.').pop() ?? raw;
  return last
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as 'es' | 'en')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Nunca tirar el render por una key faltante: loguea solo en dev y sigue.
    onError(error: IntlError) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n] missing message: ${error.message}`);
        }
        return;
      }
      console.error('[i18n]', error);
    },
    // Cuando una key falta, devolvemos una versión humanizada
    // ("Departamento") en lugar del path crudo ("types.Departamento").
    getMessageFallback({ key, namespace }) {
      const full = namespace ? `${namespace}.${key}` : key;
      return humanizeI18nKey(full);
    },
  };
});
