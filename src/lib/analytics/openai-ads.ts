/**
 * OpenAI Ads — Measurement Pixel (`oaiq`).
 *
 * Cubre las campañas que corren dentro de ChatGPT. Es un tercer destino junto
 * a GA4/Google Ads (gtag) y Meta (fbq); los eventos se disparan desde
 * `src/lib/analytics/track.ts` para que un solo helper alimente a los tres.
 *
 * Reglas del SDK que NO son obvias y explican el diseño de este archivo:
 *
 *  - `page_viewed` NO se dispara solo al hacer `init`. Hay que emitirlo a
 *    mano, y en una SPA además en cada navegación de cliente.
 *  - `init` se llama UNA vez. Re-inicializar en cada ruta duplica sesiones.
 *  - El consentimiento arranca en `true` por defecto. Si no se llama
 *    `oaiq("consent", false)` ANTES del `init`, el píxel mide sin permiso.
 *  - Los eventos estándar llevan un `type` fijo según su familia:
 *      contents          → page_viewed, contents_viewed, items_added,
 *                          checkout_started, order_created
 *      customer_action   → lead_created, registration_completed,
 *                          appointment_scheduled
 *      plan_enrollment   → subscription_created, trial_started
 *    Un `type` que no corresponda al nombre invalida el evento.
 *  - Los eventos a medida van con el nombre literal "custom" y el nombre real
 *    viaja en `options.custom_event_name`.
 *
 * Ref: https://developers.openai.com/ads/measurement-pixel
 */

/**
 * ID del píxel de la fuente de datos "Propyte.com" en OpenAI Ads Manager.
 *
 * Va como default en el código a propósito, no solo en env: el ID es PÚBLICO
 * (viaja en el HTML de todas formas) y el build de propyte.com se compila EN
 * EL SERVIDOR de Hostinger, donde las `NEXT_PUBLIC_*` se dan de alta a mano en
 * su panel. Si esto dependiera solo de una env var, un deploy sin ese paso
 * dejaría el píxel apagado en silencio y las campañas sin conversiones.
 * La env var sigue mandando: sirve para apuntar a otro dataset en staging.
 */
const configuredPixelId = process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID?.trim();

export const OPENAI_PIXEL_ID =
  // 'off' es la unica forma de apagarlo: con un default en codigo, dejar la
  // env var vacia cae de vuelta en el ID real.
  configuredPixelId === 'off' ? '' : configuredPixelId || 'GGwkPvXutsXVZwtbnju2u4';

type OaiqFn = (...args: unknown[]) => void;

interface OaiqWindow extends Window {
  oaiq?: OaiqFn;
}

/**
 * El snippet de arranque define `window.oaiq` como una cola sincrónica antes
 * de que el SDK termine de bajar, así que basta con que el script inline ya
 * haya corrido. Si no existe (SSR, script bloqueado por un adblocker), todo
 * este módulo degrada a no-op silencioso: el tracking nunca rompe la UI.
 */
export function getOaiq(): OaiqFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as OaiqWindow;
  return typeof w.oaiq === 'function' ? w.oaiq : null;
}

/**
 * Emisor genérico. `options` se omite del todo cuando no hay nada que mandar
 * para no pasarle un objeto vacío al SDK.
 */
export function oaiqMeasure(
  eventName: string,
  data: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  const oaiq = getOaiq();
  if (!oaiq) return;
  if (options && Object.keys(options).length > 0) {
    oaiq('measure', eventName, data, options);
  } else {
    oaiq('measure', eventName, data);
  }
}

/**
 * `page_viewed` de la ruta actual. Se usa en tres momentos: el arranque
 * (script inline de <Analytics />), cada navegación de cliente
 * (<OpenAiPageView />) y al conceder el consentimiento, donde repone la vista
 * que se descartó mientras estaba denegado.
 */
export function oaiqPageViewed(path?: string) {
  if (typeof window === 'undefined') return;
  const id = path ?? window.location.pathname;
  oaiqMeasure('page_viewed', {
    type: 'contents',
    contents: [{ id, name: document.title || id, content_type: 'page' }],
  });
}
