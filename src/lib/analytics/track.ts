/**
 * Client-side event tracking — fires both GA4 (gtag) and Meta Pixel (fbq)
 * with consistent payloads. Each helper covers one of the 7 events the
 * speckit defines as canonical for propyte.com:
 *
 *   1. whatsapp_click      → CTA on every WhatsApp surface
 *   2. view_item           → property detail page mount
 *   3. search              → marketplace filter/search executed
 *   4. generate_lead       → form submitted successfully
 *   5. select_content      → marketplace card / featured CTA click
 *   6. file_download       → PDF / brochure / glossary download
 *   7. add_to_wishlist     → favorite toggled on
 *
 * Both gtag and fbq queue calls before scripts load, so it's safe to fire
 * these synchronously during click handlers / mount effects.
 */

type GtagFn = (...args: unknown[]) => void;
type FbqFn = (...args: unknown[]) => void;

interface TrackerWindow extends Window {
  gtag?: GtagFn;
  fbq?: FbqFn;
}

function getGtag(): GtagFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as TrackerWindow;
  return typeof w.gtag === 'function' ? w.gtag : null;
}

function getFbq(): FbqFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as TrackerWindow;
  return typeof w.fbq === 'function' ? w.fbq : null;
}

/**
 * Genera un id único por evento. Es la clave de la deduplicación: el mismo
 * valor viaja al Pixel del navegador (4º argumento de fbq) y a la Conversions
 * API server-side. Meta colapsa ambos en UNA conversión.
 *
 * Sin esto, cada lead del sitio se cuenta dos veces y el CPL reportado sale
 * a la mitad del real.
 */
export function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Espeja el evento a /api/track para que salga también por Conversions API.
 * El servidor añade _fbp/_fbc/IP/user-agent, que es lo que sube el EMQ.
 *
 * Fire-and-forget con `keepalive`: el POST sobrevive a la navegación (crítico
 * para whatsapp_click, que suele ir seguido de salir del sitio).
 */
function mirrorToCAPI(eventName: string, eventId: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ eventName, eventId, params, page: window.location.href }),
    }).catch(() => {
      // El tracking nunca debe romper la UI.
    });
  } catch {
    // idem
  }
}

/**
 * Generic emitter — used internally; each helper below has a typed payload.
 *
 * `fbqEvent.capi !== false` → además del Pixel, el evento se manda por
 * Conversions API con el mismo event_id (dedup). Se desactiva sólo para
 * `Lead`, que lo dispara /api/leads porque ahí sí hay email/teléfono.
 */
function emit(
  name: string,
  gaParams: Record<string, unknown>,
  fbqEvent?: { name: string; params?: Record<string, unknown>; capi?: boolean; eventId?: string },
) {
  const gtag = getGtag();
  if (gtag) gtag('event', name, gaParams);
  if (fbqEvent) {
    const eventId = fbqEvent.eventId ?? newEventId();
    const params = fbqEvent.params ?? {};
    const fbq = getFbq();
    if (fbq) fbq('track', fbqEvent.name, params, { eventID: eventId });
    if (fbqEvent.capi !== false) mirrorToCAPI(fbqEvent.name, eventId, params);
  }
}

/**
 * Dispara una conversión de Google Ads. Ads sólo registra eventos etiquetados
 * con `send_to`; GA4 los ignora. Si la env var no está puesta no hace nada,
 * así el sitio nunca manda una conversión a una etiqueta vacía.
 */
function sendAdsConversion(sendTo: string | undefined, valueMxn = 0) {
  if (!sendTo) return;
  const gtag = getGtag();
  if (!gtag) return;
  gtag('event', 'conversion', { send_to: sendTo, value: valueMxn, currency: 'MXN' });
}

// ─────────────────────────────────────────────────────────────────────
// 1. whatsapp_click
// ─────────────────────────────────────────────────────────────────────
export function trackWhatsAppClick(payload: {
  /** Where the click happened (e.g. 'floating', 'header', 'detail-sidebar', 'developer-card'). */
  surface: string;
  /** Optional property/development context. */
  propertyId?: string;
  propertySlug?: string;
}) {
  emit('whatsapp_click', payload, { name: 'Contact', params: { method: 'whatsapp', surface: payload.surface } });

  // Google Ads — acción "WhatsApp click (propyte.com)". En las landings de
  // pago el WhatsApp es la vía de contacto de menor fricción; sin esto el
  // tráfico que se va por ahí no existe para Ads.
  sendAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_WHATSAPP);
}

// ─────────────────────────────────────────────────────────────────────
// 2. view_item
// ─────────────────────────────────────────────────────────────────────
export function trackViewItem(payload: {
  itemId: string;
  itemName: string;
  itemKind: 'development' | 'unit';
  city?: string;
  zone?: string;
  priceMxn?: number;
}) {
  emit(
    'view_item',
    {
      currency: 'MXN',
      value: payload.priceMxn,
      items: [
        {
          item_id: payload.itemId,
          item_name: payload.itemName,
          item_category: payload.itemKind,
          item_brand: payload.zone,
          item_variant: payload.city,
          price: payload.priceMxn,
        },
      ],
    },
    { name: 'ViewContent', params: { content_ids: [payload.itemId], content_type: payload.itemKind, value: payload.priceMxn, currency: 'MXN' } },
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. search
// ─────────────────────────────────────────────────────────────────────
export function trackSearch(payload: {
  /** Free-text search term (may be empty if only filters applied). */
  searchTerm?: string;
  /** Active filter values for context. */
  filters?: Record<string, string | number | undefined>;
  resultCount: number;
}) {
  emit(
    'search',
    {
      search_term: payload.searchTerm ?? '',
      result_count: payload.resultCount,
      ...(payload.filters ?? {}),
    },
    { name: 'Search', params: { search_string: payload.searchTerm ?? '', num_results: payload.resultCount } },
  );
}

// ─────────────────────────────────────────────────────────────────────
// 4. generate_lead
// ─────────────────────────────────────────────────────────────────────
export function trackGenerateLead(payload: {
  formType: string;
  propertyId?: string;
  /** Estimated value of the lead in MXN (optional). */
  valueMxn?: number;
  /**
   * event_id compartido con el CAPI server-side. submitLead() lo genera ANTES
   * de postear a /api/leads y lo pasa aquí, para que el Lead del navegador y
   * el del servidor sean el mismo evento a ojos de Meta.
   */
  eventId?: string;
}) {
  emit(
    'generate_lead',
    {
      currency: 'MXN',
      value: payload.valueMxn,
      form_type: payload.formType,
      property_id: payload.propertyId,
    },
    {
      name: 'Lead',
      params: { content_name: payload.formType, value: payload.valueMxn, currency: 'MXN' },
      eventId: payload.eventId,
      // /api/leads ya manda este Lead por CAPI con email/teléfono hasheados;
      // espejarlo aquí lo mandaría dos veces con peor match quality.
      capi: false,
    },
  );

  // Google Ads conversion — acción "Lead formulario web" (send_to AW-XXX/label
  // vía env). Evento separado de generate_lead: Ads solo registra conversiones
  // etiquetadas con send_to, GA4 ignora este evento.
  sendAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LEAD, payload.valueMxn ?? 0);
}

// ─────────────────────────────────────────────────────────────────────
// 5. select_content
// ─────────────────────────────────────────────────────────────────────
export function trackSelectContent(payload: {
  contentType: 'property_card' | 'featured_cta' | 'home_card' | 'related_property' | 'developer_card' | 'zone_card';
  contentId: string;
  contentName?: string;
}) {
  emit('select_content', {
    content_type: payload.contentType,
    item_id: payload.contentId,
    item_name: payload.contentName,
  });
}

// ─────────────────────────────────────────────────────────────────────
// 6. file_download
// ─────────────────────────────────────────────────────────────────────
export function trackFileDownload(payload: {
  /** PDF | brochure | masterplan | price-list | glossary. */
  fileType: string;
  fileUrl?: string;
  /** Property/development context if the asset belongs to a listing. */
  propertyId?: string;
  propertySlug?: string;
}) {
  emit('file_download', {
    file_type: payload.fileType,
    file_name: payload.fileUrl,
    property_id: payload.propertyId,
    property_slug: payload.propertySlug,
  });
}

// ─────────────────────────────────────────────────────────────────────
// 7. add_to_wishlist
// ─────────────────────────────────────────────────────────────────────
export function trackAddToWishlist(payload: {
  itemId: string;
  itemName: string;
  itemKind: 'development' | 'unit';
  priceMxn?: number;
}) {
  emit(
    'add_to_wishlist',
    {
      currency: 'MXN',
      value: payload.priceMxn,
      items: [
        {
          item_id: payload.itemId,
          item_name: payload.itemName,
          item_category: payload.itemKind,
          price: payload.priceMxn,
        },
      ],
    },
    { name: 'AddToWishlist', params: { content_ids: [payload.itemId], content_type: payload.itemKind, value: payload.priceMxn, currency: 'MXN' } },
  );
}
