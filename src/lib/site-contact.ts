// Resolver único de datos de contacto del sitio desde Propyte Hub.
//
// Fuente de verdad = site-config del Hub (keys whatsapp.number, contact.phone,
// contact.email, whatsapp.preset_*). Si el Hub no responde, cae al fallback
// hardcoded. NO leemos NEXT_PUBLIC_WHATSAPP_PHONE: esa env var quedó stale en
// el deploy y secuestraba el número real (ver ContactPageContent/WhatsAppButton
// histórico). Ahora todo el sitio reacciona al panel del Hub.
//
// Usado por:
//   - SiteConfigContext.useSiteContact()  → componentes cliente
//   - server components que llaman getSiteConfig() directo (detail pages, etc.)

import type { HubSiteConfig } from '@/lib/hub-content';

// Número canónico de Propyte. Fallback de último recurso si el Hub está caído.
export const FALLBACK_WHATSAPP = '529844638032';
export const FALLBACK_PHONE_DISPLAY = '+52 984 463 8032';

export function pickString(
  config: HubSiteConfig | undefined,
  key: string,
  fallback: string,
): string {
  const v = config?.[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

// El Hub guarda "+52 984 463 8032"; wa.me / tel: requieren dígitos puros.
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export interface SiteContact {
  /** Dígitos puros para wa.me/${whatsapp} */
  whatsapp: string;
  /** Texto legible para mostrar, ej. "+52 984 463 8032" */
  phoneDisplay: string;
  /** Href listo para tel: */
  phoneHref: string;
  email: string;
  presetEs: string;
  presetEn: string;
}

export function resolveSiteContact(config: HubSiteConfig | undefined): SiteContact {
  const waRaw = pickString(config, 'whatsapp.number', '');
  const phoneRaw = pickString(config, 'contact.phone', waRaw);
  const whatsapp = normalizePhone(waRaw || phoneRaw) || FALLBACK_WHATSAPP;
  const phoneDisplay = phoneRaw || waRaw || FALLBACK_PHONE_DISPLAY;
  const phoneDigits = normalizePhone(phoneDisplay) || FALLBACK_WHATSAPP;

  return {
    whatsapp,
    phoneDisplay,
    phoneHref: `tel:+${phoneDigits}`,
    email: pickString(config, 'contact.email', 'contacto@propyte.com'),
    presetEs: pickString(
      config,
      'whatsapp.preset_es',
      'Hola, me interesa información sobre propiedades en la Riviera Maya',
    ),
    presetEn: pickString(
      config,
      'whatsapp.preset_en',
      'Hi, I want info about properties in Riviera Maya',
    ),
  };
}
