// ============================================================
// Meta Conversions API (CAPI) — envío server-side desde propyte.com
// ============================================================
//
// Por qué existe (además del Pixel del navegador):
//   1. DEDUP — cada evento lleva `event_id`. El navegador dispara
//      fbq('track', name, params, { eventID }) con el MISMO id, y Meta
//      colapsa ambos en una sola conversión. Sin esto se cuenta doble.
//   2. MATCH QUALITY — aquí sí tenemos _fbp/_fbc/IP/user-agent, que son
//      las señales que más pesan en el EMQ. El webhook Zoho→CAPI no las
//      tiene (el lead ya perdió el contexto de navegador).
//   3. COBERTURA — recupera los eventos que el navegador nunca manda
//      (bloqueadores, ITP, consentimiento revocado a mitad de sesión).
//
// El evento `Lead` se dispara desde /api/leads (ahí está el PII).
// Los de mitad de embudo (ViewContent, Contact…) desde /api/track.

import crypto from "crypto";

const API_VERSION = process.env.META_API_VERSION || "v20.0";
const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;

// ─────────────────────────────────────────────────────────────────────
// Normalización — Meta descarta silenciosamente lo que no matchea el
// formato esperado. Un hash de "México" NUNCA coincide con el hash de
// "mx" que tiene Meta, así que el campo se vuelve peso muerto.
// Ref: developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
// ─────────────────────────────────────────────────────────────────────

/** Quita acentos y baja a minúsculas. "Quintana Roo" → "quintana roo". */
function deburr(value: string): string {
  return value
    .normalize("NFD")
    // \p{M} = marcas combinantes que NFD acaba de separar de su letra base.
    // Se usa la clase Unicode en vez de un rango literal para que el archivo
    // no dependa de caracteres invisibles.
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Meta exige ISO-3166-1 alpha-2 en minúscula. Cubre lo que manda Zoho hoy. */
const COUNTRY_ALIASES: Record<string, string> = {
  mexico: "mx",
  mex: "mx",
  mx: "mx",
  "estados unidos": "us",
  "estados unidos de america": "us",
  usa: "us",
  us: "us",
  "united states": "us",
  "united states of america": "us",
  canada: "ca",
  ca: "ca",
  argentina: "ar",
  ar: "ar",
  colombia: "co",
  co: "co",
  espana: "es",
  spain: "es",
  es: "es",
  chile: "cl",
  cl: "cl",
  peru: "pe",
  pe: "pe",
  brasil: "br",
  brazil: "br",
  br: "br",
};

export function normalizeCountry(raw: string): string | null {
  const key = deburr(raw);
  if (!key) return null;
  const iso = COUNTRY_ALIASES[key];
  if (iso) return iso;
  // Ya viene como ISO-2 desconocido para el mapa → aceptar si son 2 letras.
  return /^[a-z]{2}$/.test(key) ? key : null;
}

/** Estados de MX/US normalizados. Descarta basura ("9", "", "-"). */
export function normalizeState(raw: string): string | null {
  const clean = deburr(raw).replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
  if (!clean || clean.length < 2) return null;
  // Variantes comunes de CDMX que Zoho recibe sin normalizar.
  if (["cdmx", "distrito federal", "ciudad de mexico", "df"].includes(clean)) {
    return "ciudad de mexico";
  }
  return clean;
}

export function normalizeCity(raw: string): string | null {
  const clean = deburr(raw).replace(/[^a-z\s]/g, "").replace(/\s+/g, "").trim();
  return clean || null;
}

/** E.164 sin "+". Default país MX (52) cuando vienen 10 dígitos. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length === 10) return "52" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits; // US/CA con 1
  return digits;
}

export function normalizeEmail(raw: string): string | null {
  const clean = raw.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean) ? clean : null;
}

/** Nombres: minúsculas sin acentos ni puntuación. */
export function normalizeName(raw: string): string | null {
  const clean = deburr(raw).replace(/[^a-z\s]/g, "").trim();
  return clean || null;
}

// ─────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────

export interface CAPIUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  /** ID estable de la persona en nuestros sistemas (lead uuid / Zoho id). */
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
}

export type CAPIActionSource =
  | "email"
  | "website"
  | "app"
  | "phone_call"
  | "chat"
  | "physical_store"
  | "system_generated"
  | "business_messaging"
  | "other";

export interface CAPIEvent {
  eventName: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource: CAPIActionSource;
  /** Obligatorio para dedup con el Pixel. Mismo valor en ambos lados. */
  eventId?: string;
  userData: CAPIUserData;
  customData?: Record<string, unknown>;
}

export interface CAPIResult {
  events_received?: number;
  fbtrace_id?: string;
  messages?: unknown[];
  error?: unknown;
}

/** Construye el `user_data` hasheado. Exportado para poder testearlo. */
export function buildUserData(u: CAPIUserData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (key: string, value: string | null) => {
    if (value) out[key] = [sha256(value)];
  };

  if (u.email) put("em", normalizeEmail(u.email));
  if (u.phone) put("ph", normalizePhone(u.phone));
  if (u.firstName) put("fn", normalizeName(u.firstName));
  if (u.lastName) put("ln", normalizeName(u.lastName));
  if (u.city) put("ct", normalizeCity(u.city));
  if (u.state) put("st", normalizeState(u.state));
  if (u.country) put("country", normalizeCountry(u.country));
  if (u.externalId) put("external_id", u.externalId.trim().toLowerCase());

  // Estos NO se hashean — Meta los quiere en claro.
  if (u.clientIpAddress) out.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) out.client_user_agent = u.clientUserAgent;
  if (u.fbc) out.fbc = u.fbc;
  if (u.fbp) out.fbp = u.fbp;

  return out;
}

/**
 * Envía uno o más eventos a la Conversions API.
 * NO lanza: un fallo de tracking jamás debe tumbar el flujo de un lead.
 * Devuelve null si falta configuración o si Meta rechazó.
 */
export async function sendCAPIEvents(events: CAPIEvent[]): Promise<CAPIResult | null> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token || !PIXEL_ID || events.length === 0) {
    if (!token || !PIXEL_ID) {
      console.warn("[CAPI] META_ACCESS_TOKEN o META_PIXEL_ID no configurados — evento omitido");
    }
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const data = events.map((e) => {
    const payload: Record<string, unknown> = {
      event_name: e.eventName,
      event_time: e.eventTime || now,
      event_source_url: e.eventSourceUrl || "https://propyte.com",
      action_source: e.actionSource,
      user_data: buildUserData(e.userData),
      custom_data: e.customData || {},
    };
    if (e.eventId) payload.event_id = e.eventId;
    return payload;
  });

  const body: Record<string, unknown> = { access_token: token, data: JSON.stringify(data) };
  // Con TEST_EVENT_CODE los eventos aparecen en "Probar eventos" de Events
  // Manager sin contaminar los datos de producción. Dejar vacío en prod.
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result: CAPIResult = await res.json().catch(() => ({}));

    if (!res.ok || result.error) {
      console.error(
        JSON.stringify({
          event: "capi.rejected",
          status: res.status,
          names: events.map((e) => e.eventName),
          error: result.error ?? `HTTP ${res.status}`,
        }),
      );
      return null;
    }

    console.log(
      JSON.stringify({
        event: "capi.sent",
        names: events.map((e) => e.eventName),
        received: result.events_received,
        fbtrace_id: result.fbtrace_id,
      }),
    );
    return result;
  } catch (err) {
    console.error(JSON.stringify({ event: "capi.network-error", error: String(err) }));
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Contexto de navegador desde el Request
// ─────────────────────────────────────────────────────────────────────

export interface BrowserContext {
  fbp: string | null;
  fbc: string | null;
  ip: string | null;
  userAgent: string | null;
}

function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("=")) || null;
  }
  return null;
}

/**
 * Extrae _fbp/_fbc, IP y user-agent del request entrante.
 *
 * Si no hay cookie _fbc pero la URL de la página trae `fbclid`, se sintetiza
 * en el formato que Meta espera (`fb.1.<timestamp_ms>.<fbclid>`). Esto es lo
 * que rescata la atribución de los clics donde el navegador nunca llegó a
 * escribir la cookie.
 */
export function getBrowserContext(req: Request, pageUrl?: string | null): BrowserContext {
  const cookieHeader = req.headers.get("cookie") ?? "";
  let fbc = readCookie(cookieHeader, "_fbc");

  if (!fbc && pageUrl) {
    try {
      const fbclid = new URL(pageUrl).searchParams.get("fbclid");
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {
      // pageUrl inválida — sin fbc, seguimos igual
    }
  }

  // x-forwarded-for puede traer varias IPs; la primera es el cliente real.
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

  return {
    fbp: readCookie(cookieHeader, "_fbp"),
    fbc,
    ip,
    userAgent: req.headers.get("user-agent"),
  };
}
