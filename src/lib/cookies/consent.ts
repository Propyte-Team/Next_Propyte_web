/**
 * Cookie consent helpers — vanilla, localStorage-backed.
 * GA4 Consent Mode v2 compatible: necessary always granted; analytics +
 * marketing default to denied, user opts in via banner.
 */

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
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: full }));
  } catch {
    // localStorage may be unavailable
  }
}

interface GtagWindow extends Window {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
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

export function reopenBanner() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}
