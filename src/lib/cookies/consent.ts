/**
 * Cookie consent helpers — vanilla, localStorage-backed.
 * GA4 Consent Mode v2 compatible: necessary always granted; analytics +
 * marketing default to denied, user opts in via banner.
 */

import { getOaiq, oaiqPageViewed } from '@/lib/analytics/openai-ads';

export const STORAGE_KEY = 'propyte:cookies';
export const REOPEN_EVENT = 'propyte:cookies-reopen';
export const CHANGED_EVENT = 'propyte:cookies-changed';
export const CONSENT_VERSION = 1;

export interface CookieConsent {
  v: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: string;
}

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      v: CONSENT_VERSION,
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      ts: typeof parsed.ts === 'string' ? parsed.ts : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(consent: Omit<CookieConsent, 'v' | 'necessary' | 'ts'>) {
  if (typeof window === 'undefined') return;
  // Se lee ANTES de escribir: applyConsentToOpenAiPixel necesita saber si
  // marketing pasa de denegado a concedido, y readConsent() ya devolveria
  // el valor nuevo una vez hecho el setItem.
  const previousMarketing = readConsent()?.marketing === true;
  const full: CookieConsent = {
    v: CONSENT_VERSION,
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    ts: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    applyConsentToGtag(full);
    applyConsentToMetaPixel(full);
    applyConsentToOpenAiPixel(full, previousMarketing);
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: full }));
  } catch {
    // localStorage may be unavailable
  }
}

interface GtagWindow extends Window {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  fbq?: (...args: unknown[]) => void;
}

export function applyConsentToGtag(consent: CookieConsent) {
  if (typeof window === 'undefined') return;
  const w = window as GtagWindow;
  const fn: (...args: unknown[]) => void =
    typeof w.gtag === 'function'
      ? w.gtag
      : (...args: unknown[]) => {
          (w.dataLayer = w.dataLayer || []).push(args);
        };
  fn('consent', 'update', {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.marketing ? 'granted' : 'denied',
    ad_user_data: consent.marketing ? 'granted' : 'denied',
    ad_personalization: consent.marketing ? 'granted' : 'denied',
  });
}

/**
 * Flip Meta Pixel consent in lockstep with the marketing toggle. The Pixel
 * snippet boots with `fbq('consent','revoke')` so events stay queued until
 * the user grants consent.
 */
export function applyConsentToMetaPixel(consent: CookieConsent) {
  if (typeof window === 'undefined') return;
  const w = window as GtagWindow;
  if (typeof w.fbq !== 'function') return;
  w.fbq('consent', consent.marketing ? 'grant' : 'revoke');
}

/**
 * Espeja el toggle de marketing en el pixel de OpenAI Ads (oaiq).
 *
 * A diferencia de fbq, el SDK de oaiq NO encola lo que llega con el
 * consentimiento denegado: lo descarta. Por eso, en el salto denegado →
 * concedido hay que reponer el page_viewed del arranque; si no, la visita en
 * la que el usuario acepta las cookies no existe para OpenAI y el pixel se ve
 * muerto justo con los visitantes que si dieron permiso.
 *
 * Las conversiones (lead_created) no necesitan reposicion: ocurren siempre
 * despues del banner.
 */
export function applyConsentToOpenAiPixel(
  consent: CookieConsent,
  previouslyGranted = false,
) {
  if (typeof window === 'undefined') return;
  const oaiq = getOaiq();
  if (!oaiq) return;
  oaiq('consent', consent.marketing);
  if (consent.marketing && !previouslyGranted) oaiqPageViewed();
}

export function reopenBanner() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}
