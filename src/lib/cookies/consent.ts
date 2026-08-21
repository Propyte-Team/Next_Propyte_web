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

/**
 * Código JS que se INLINEA en los snippets de arranque de `Analytics.tsx`.
 *
 * Deja `__propyteConsent = { decided, analytics, marketing }` en el ámbito del
 * IIFE que lo contiene. No usa `readConsent()` a propósito: estos snippets se
 * ejecutan antes de que exista bundle de React, y tienen que leer el
 * consentimiento de forma SINCRÓNICA, antes del `init` de cada pixel.
 *
 * Por qué existe: el banner solo aplicaba el consentimiento al GUARDAR, así que
 * el visitante que aceptó ayer volvía hoy, no veía el banner —ya hay decisión
 * guardada— y nadie se lo comunicaba a los scripts. Medido en producción el
 * 2026-08-20: segunda visita con `{analytics:true,marketing:true}` en
 * localStorage y GA4 seguía mandando `gcs=G100` (denegado), con CERO entradas
 * `consent` en el dataLayer. Es medición perdida justo con el recurrente, que ya
 * dijo que sí.
 *
 * Se arregla en el arranque y no en un efecto de React por dos razones: cubre
 * las páginas donde el banner no se monta, y evita la carrera con `fbq`/`oaiq`
 * —un `useEffect` puede correr antes de que el snippet del pixel exista, y
 * `applyConsentToMetaPixel` sale sin hacer nada si `fbq` todavía no es función.
 */
export const CONSENT_BOOT_JS = `var __propyteConsent={decided:false,analytics:false,marketing:false};try{var __raw=window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(__raw){var __c=JSON.parse(__raw);if(__c&&typeof __c==='object'&&__c.v===${CONSENT_VERSION}){__propyteConsent={decided:true,analytics:__c.analytics===true,marketing:__c.marketing===true};}}}catch(e){}`;

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
