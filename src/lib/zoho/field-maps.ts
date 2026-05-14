// ============================================================
// Field Mappings: source (web form) → Zoho payload
// Spec: web-forms-zoho-integration.md (v1.5) §6.3
// ============================================================

import type { ZohoAccount, ZohoLead } from "./types";

// --- Tipos ---

export type LeadSource =
  | "contact"
  | "property_inquiry"
  | "b2b_request"
  | "developer_request"
  | "broker_registration"
  | "provider_form"
  | "built_consultation"
  | "affiliate_request"
  | "newsletter"
  | "lead_magnet"
  | "glossary_pdf";

export interface FormData {
  // Identidad
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;

  // Por form
  subject?: string | null;
  propertyId?: string | null;
  propertyName?: string | null;
  investmentType?: string | null;
  company?: string | null;
  location?: string | null;
  city?: string | null;
  projectType?: string | null;
  unitCount?: string | null;
  brokerType?: string | null;
  experience?: string | null;
  focusArea?: string | null;
  category?: string | null;
  companyWebsite?: string | null; // Form 6: URL del proveedor (Account.Website). NO confundir con `website` honeypot.
  budget?: string | null;
  whatsapp?: string | null;
  interest?: string | null;
}

export interface UtmData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
}

export type Locale = "es" | "en";

export interface ZohoPayloadResult {
  /** Payload para POST /crm/v2/Leads */
  lead: ZohoLead;
  /** Si presente, también POST /crm/v2/Accounts (solo provider_form) */
  account?: ZohoAccount;
}

// --- Constantes ---

/** Mapping canónico: categorySlug del form 6 → Industry picklist en Zoho.
 *  Verificado contra ProviderForm.tsx:10-21 (10 entradas). Si el form agrega
 *  categorías, el test de Z1.5 falla hasta que se agregue aquí. */
export const CATEGORY_TO_INDUSTRY: Record<string, string> = {
  Notary: "Notaría / Legal",
  Legal: "Notaría / Legal",
  Finance: "Finanzas",
  Architecture: "Arquitectura",
  Construction: "Construcción",
  Moving: "Mudanzas",
  Furniture: "Mobiliario",
  Insurance: "Seguros",
  Marketing: "Marketing",
  Other: "Otro",
};

/** Buzones genéricos a omitir en parseFirstNameFromEmail (REQ-F-15). */
const GENERIC_MAILBOXES = new Set([
  "info", "contact", "contacto", "sales", "ventas", "hello", "hola", "hi",
  "admin", "support", "soporte", "mkt", "marketing", "noreply", "no-reply",
  "team", "equipo", "office", "oficina",
]);

// --- Helpers de normalización ---

/**
 * parseName(raw, fallback = 'Anónimo')
 * Splittea un nombre de un solo campo en First_Name + Last_Name.
 * Zoho exige Last_Name no vacío — usa fallback si no hay nombre real.
 * Newsletter llama con override: parseName(name, 'Suscriptor').
 */
export function parseName(
  raw: string | null | undefined,
  fallback = "Anónimo",
): { firstName?: string; lastName: string } {
  const trimmed = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return { lastName: fallback };

  const tokens = trimmed.split(" ");
  if (tokens.length === 1) {
    return { lastName: tokens[0]! };
  }
  return {
    firstName: tokens[0]!,
    lastName: tokens.slice(1).join(" "),
  };
}

/**
 * parseFirstNameFromEmail(email)
 * Extrae un First_Name probable del local-part del email para Newsletter
 * cuando el form solo capturó `email`. Omite buzones genéricos y números.
 */
export function parseFirstNameFromEmail(
  email: string | null | undefined,
): string | undefined {
  if (!email) return undefined;
  const localPart = email.split("@")[0]?.toLowerCase().trim();
  if (!localPart) return undefined;

  const tokens = localPart.split(/[._-]/);
  let candidate = tokens[0];
  if (!candidate) return undefined;

  // Strip trailing digits (juan42 → juan)
  candidate = candidate.replace(/\d+$/, "");

  if (candidate.length < 2) return undefined;
  if (GENERIC_MAILBOXES.has(candidate)) return undefined;
  if (/^\d+$/.test(candidate)) return undefined;

  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

/** Description ≤ 32KB (cap real de Zoho v2 sobre el campo). REQ-F-18. */
export function truncateDescription(
  text: string | null | undefined,
  max = 32_000,
): string | undefined {
  if (!text) return undefined;
  if (text.length <= max) return text;
  return text.slice(0, max - 20) + "… [truncado]";
}

/** zoho_sync_error ≤ 1KB para no inflar la columna text con retries. REQ-F-21. */
export function truncateError(
  msg: string | null | undefined,
  max = 1000,
): string | undefined {
  if (!msg) return undefined;
  if (msg.length <= max) return msg;
  return msg.slice(0, max - 14) + "… [truncado]";
}

// --- Mappers por form ---

/** Slug de ruta usado en Nombre_de_Campa_a — "Propyte web - <slug>". */
function campaignSlug(source: LeadSource): string {
  switch (source) {
    case "contact":               return "contacto";
    case "property_inquiry":      return "propiedades/ficha";
    case "b2b_request":           return "desarrolladores/hero";
    case "developer_request":     return "desarrolladores/registro";
    case "broker_registration":   return "corredores/registro";
    case "provider_form":         return "proveedores";
    case "built_consultation":    return "built/contacto";
    case "affiliate_request":     return "unete/aplicar";
    case "newsletter":            return "blog/newsletter";
    case "lead_magnet":           return "home/lead-magnet";
    case "glossary_pdf":          return "glosario/pdf-gate";
  }
}

/**
 * Tag indicativo de Tipo_de_Contacto embebido en Nombre_de_Campa_a.
 * Permite que las reglas Zoho asignen Tipo_de_Contacto por `Nombre_de_Campa_a CONTIENE [XXX]`,
 * mismo patrón que campañas Meta Ads (ej. "74 CAMPAÑA DE FINANCIAMIENTO - [LEADS] - MEXICO").
 */
function campaignTag(source: LeadSource): string {
  switch (source) {
    case "broker_registration": return "[BROKERS]";
    case "provider_form":       return "[PROVEEDORES]";
    case "b2b_request":
    case "developer_request":
    case "built_consultation":  return "[DESARROLLADORES]";
    case "affiliate_request":   return "[EMPLEO]";
    default:                    return "[LEADS]";
  }
}

/**
 * Sub-tag opcional con paréntesis para segmentar dentro de un Tipo_de_Contacto.
 * Ejemplos: F8 → "(ASESOR)" dentro de [EMPLEO]; F3 → "(HERO)" y F4 → "(REGISTRO)" dentro de [DESARROLLADORES].
 * Patrón paralelo al de Meta Ads cuando una campaña necesita doble clasificación.
 */
function campaignSubtag(source: LeadSource): string | undefined {
  switch (source) {
    case "b2b_request":       return "(HERO)";
    case "developer_request": return "(REGISTRO)";
    case "affiliate_request": return "(ASESOR)";
    default:                  return undefined;
  }
}

/** Descripción humana del form para Nombre_del_formulario. */
function formDescription(source: LeadSource, locale: Locale): string {
  const langTag = locale === "en" ? "EN" : "ES";
  const desc = ((): string => {
    switch (source) {
      case "contact":             return "Contacto general";
      case "property_inquiry":    return "Ficha de propiedad";
      case "b2b_request":         return "Desarrolladores B2B (hero)";
      case "developer_request":   return "Desarrolladores B2B (registro)";
      case "broker_registration": return "Registro de Broker";
      case "provider_form":       return "Registro de Proveedor";
      case "built_consultation":  return "Built construcción";
      case "affiliate_request":   return "Únete (afiliados)";
      case "newsletter":          return "Newsletter Blog";
      case "lead_magnet":         return "Lead Magnet Home";
      case "glossary_pdf":        return "Glosario PDF";
    }
  })();
  return `Formulario Propyte web ${langTag} - ${desc}`;
}

/** Base aplicada a TODOS los leads desde web (§6.3 reglas globales). */
function baseLeadFields(
  source: LeadSource,
  locale: Locale,
  utms: UtmData,
): Partial<ZohoLead> {
  return {
    Lead_Source: "Sitio web",
    Lead_Status: "Nuevo",
    Etapa_interna_de_contacto: ["Sin Contactar"],
    Idioma: locale === "es" ? "Español" : "Ingles",
    Plataforma_de_llegada: "Sitio web",
    Nombre_de_Campa_a: (() => {
      const subtag = campaignSubtag(source);
      const base = `Propyte web - ${campaignSlug(source)} - ${campaignTag(source)}`;
      return subtag ? `${base} ${subtag}` : base;
    })(),
    Nombre_del_formulario: formDescription(source, locale),
    // UTM tracking — solo si vienen poblados (Zoho no acepta string vacío en algunos picklists)
    ...(utms.gclid ? { GCLID: utms.gclid } : {}),
    ...(utms.utm_campaign ? { Ad_Campaign_Name: utms.utm_campaign } : {}),
    ...(utms.utm_content ? { AdGroup_Name: utms.utm_content } : {}),
    // Owner OMITIDO — Zoho Assignment Rule rota
  };
}

/** Tipo_de_Contacto por source. */
function tipoDeContacto(source: LeadSource): string {
  switch (source) {
    case "broker_registration": return "Broker";
    case "provider_form":       return "Proveedor";
    case "b2b_request":
    case "developer_request":
    case "built_consultation":  return "Desarrollador";
    case "affiliate_request":   return "Empleo";
    default:                    return "Lead";
  }
}

/**
 * Description = contexto del form (asunto, tipo proyecto, presupuesto, etc.)
 *   — info estructurada del prospecto que NO es texto libre.
 * NO incluye `data.message` ni `data.interest` libres — esos van a `Mensaje` (composeMensaje).
 */
function composeDescription(source: LeadSource, data: FormData): string | undefined {
  const parts: string[] = [];

  switch (source) {
    case "contact":
      if (data.subject) parts.push(`Asunto: ${data.subject}`);
      break;
    case "property_inquiry":
      if (data.investmentType) parts.push(`Tipo inversión: ${data.investmentType}`);
      if (data.propertyName) parts.push(`Propiedad: ${data.propertyName}`);
      break;
    case "developer_request":
      if (data.projectType) parts.push(`Tipo proyecto: ${data.projectType}`);
      if (data.unitCount) parts.push(`Unidades: ${data.unitCount}`);
      break;
    case "b2b_request":
      // sin contexto adicional — el mensaje libre va a Mensaje
      break;
    case "broker_registration":
      if (data.brokerType) parts.push(`Tipo broker: ${data.brokerType}`);
      if (data.experience) parts.push(`Experiencia: ${data.experience}`);
      if (data.focusArea) parts.push(`Zona enfoque: ${data.focusArea}`);
      break;
    case "provider_form": {
      const industry = data.category ? CATEGORY_TO_INDUSTRY[data.category] ?? data.category : undefined;
      if (industry) parts.push(`Categoría: ${industry}`);
      if (data.companyWebsite) parts.push(`Sitio web: ${data.companyWebsite}`);
      break;
    }
    case "built_consultation":
      if (data.projectType) parts.push(`Tipo proyecto: ${data.projectType}`);
      if (data.budget) parts.push(`Presupuesto: ${data.budget}`);
      break;
    case "affiliate_request":
      if (data.experience) parts.push(`Experiencia: ${data.experience}`);
      break;
    case "lead_magnet":
      parts.push("Descargó reporte gratuito.");
      break;
    case "glossary_pdf":
      parts.push("Descargó glosario inmobiliario.");
      break;
    case "newsletter":
      // sin Description — el form solo captura email
      break;
  }

  return parts.length > 0 ? truncateDescription(parts.join("\n")) : undefined;
}

/**
 * Mensaje = texto libre del prospecto.
 * Para `affiliate_request` el campo libre es `interest` (no hay `message`).
 * Para newsletter / lead_magnet / glossary_pdf no hay mensaje.
 */
function composeMensaje(source: LeadSource, data: FormData): string | undefined {
  if (source === "affiliate_request") {
    return data.interest ? truncateDescription(data.interest) : undefined;
  }
  if (source === "newsletter" || source === "lead_magnet" || source === "glossary_pdf") {
    return undefined;
  }
  return data.message ? truncateDescription(data.message) : undefined;
}

/**
 * Compone título + contenido de la Nota que se anexa al Lead duplicado
 * cuando Zoho rechaza el create por DUPLICATE_DATA (Opción C del spec).
 */
export function composeDuplicateNote(
  source: LeadSource,
  data: FormData,
  locale: Locale,
  utms: UtmData,
): { title: string; content: string } {
  const langTag = locale === "en" ? "EN" : "ES";
  const formName = formDescription(source, locale);
  const campaign = `Propyte web - ${campaignSlug(source)}`;

  const title = `Nuevo contacto web — ${formName.replace(/^Formulario Propyte web (ES|EN) - /, "")}`;

  const lines: string[] = [
    `📩 Nuevo touchpoint desde ${langTag === "ES" ? "el sitio web" : "the website"}.`,
    "",
    `Formulario: ${formName}`,
    `Campaña: ${campaign}`,
    `Fecha: ${new Date().toISOString()}`,
  ];

  if (data.email) lines.push(`Email enviado: ${data.email}`);
  if (data.phone) lines.push(`Teléfono: ${data.phone}`);
  if (data.whatsapp) lines.push(`WhatsApp: ${data.whatsapp}`);
  if (data.company) lines.push(`Empresa: ${data.company}`);
  if (data.city) lines.push(`Ciudad: ${data.city}`);
  if (data.location) lines.push(`Ubicación: ${data.location}`);

  const desc = composeDescription(source, data);
  if (desc) {
    lines.push("");
    lines.push("--- Contexto ---");
    lines.push(desc);
  }

  const mensaje = composeMensaje(source, data);
  if (mensaje) {
    lines.push("");
    lines.push("--- Mensaje del prospecto ---");
    lines.push(mensaje);
  }

  // UTM tracking si está poblado
  const utmParts: string[] = [];
  if (utms.utm_source) utmParts.push(`source=${utms.utm_source}`);
  if (utms.utm_medium) utmParts.push(`medium=${utms.utm_medium}`);
  if (utms.utm_campaign) utmParts.push(`campaign=${utms.utm_campaign}`);
  if (utms.gclid) utmParts.push(`gclid=${utms.gclid}`);
  if (utmParts.length > 0) {
    lines.push("");
    lines.push(`UTM: ${utmParts.join(" | ")}`);
  }

  return {
    title,
    content: lines.join("\n"),
  };
}

/**
 * Extrae el id del Lead existente del error DUPLICATE_DATA de Zoho.
 * Zoho devuelve algo como:
 *   { code: "DUPLICATE_DATA", details: { api_name: "Email", id: "55000..." } }
 * Pero nosotros loggeamos el error como string ya sanitizado, así que aquí
 * necesitamos el objeto raw — el caller debe pasar el detail original.
 */
export function extractDuplicateLeadId(
  detail: { code?: string; details?: { id?: string } } | null | undefined,
): string | null {
  if (!detail) return null;
  if (detail.code !== "DUPLICATE_DATA") return null;
  return detail.details?.id || null;
}

/**
 * sourceToZohoPayload — entrada principal.
 *
 * Genera el payload Zoho según el source del form. Para `provider_form` también
 * devuelve `account` para la doble llamada (REQ-F-06).
 *
 * @param zohoDevelopmentId Para `property_inquiry`, el id resuelto vía Propyte_zoho_id_map
 *                          (ver resolve-proyecto-interes.ts). undefined si no hay mapeo.
 */
export function sourceToZohoPayload(
  source: LeadSource,
  data: FormData,
  locale: Locale,
  utms: UtmData,
  zohoDevelopmentId?: string,
): ZohoPayloadResult {
  const base = baseLeadFields(source, locale, utms);

  // Newsletter: el form solo capta email — Last_Name siempre "Suscriptor", First_Name parsed
  const useFallbackName = source === "newsletter";
  const fallback = useFallbackName ? "Suscriptor" : "Anónimo";
  const parsed = parseName(data.name, fallback);

  const lead: ZohoLead = {
    ...base,
    Last_Name: parsed.lastName,
    ...(parsed.firstName ? { First_Name: parsed.firstName } : {}),
    Tipo_de_Contacto: tipoDeContacto(source),
  };

  // Newsletter sin nombre: intenta parsear First_Name del email
  if (useFallbackName && !parsed.firstName) {
    const fromEmail = parseFirstNameFromEmail(data.email);
    if (fromEmail) lead.First_Name = fromEmail;
  }

  // Campos comunes — solo si están poblados
  if (data.email) lead.Email = data.email;
  // Phone vs Mobile — Form 8 usa Mobile (whatsapp); resto usa Phone
  if (source === "affiliate_request") {
    if (data.whatsapp) lead.Mobile = data.whatsapp;
  } else {
    if (data.phone) lead.Phone = data.phone;
  }
  if (data.company) lead.Company = data.company;
  if (data.city) lead.City = data.city;
  if (data.location && !data.city) lead.City = data.location;
  // Country default Mexico para web (todos nuestros forms son MX-centric)
  lead.Country = "Mexico";

  // Broker registration: marker boolean + Inmobiliaria
  if (source === "broker_registration") {
    lead.Broker = true;
    if (data.company) lead.Inmobiliaria = data.company;
  }

  // Built consultation: Presupuesto text libre
  if (source === "built_consultation" && data.budget) {
    lead.Presupuesto = data.budget;
  }

  // Property inquiry: lookup zoho_developmentId
  if (source === "property_inquiry") {
    if (zohoDevelopmentId) {
      lead.Proyecto_de_Interes = [{ id: zohoDevelopmentId }];
    }
    // Si no hay mapping, composeDescription ya incluyó "Propiedad: <name>"
  }

  // Description (contexto estructurado) — sin texto libre
  const desc = composeDescription(source, data);
  if (desc) lead.Description = desc;

  // Mensaje (texto libre del prospecto)
  const mensaje = composeMensaje(source, data);
  if (mensaje) lead.Mensaje = mensaje;

  // Forms con Account asociado: F6 (Proveedor), F3/F4/F7 (Desarrolladora) — doble llamada Lead + Account.
  // F7 (built_consultation): company es OPCIONAL en el form — solo creamos Account si el usuario la llenó.
  let account: ZohoAccount | undefined;
  const isProvider = source === "provider_form";
  const isDeveloper = source === "b2b_request" || source === "developer_request";
  const isBuiltWithCompany = source === "built_consultation" && !!data.company;
  if (isProvider || isDeveloper || isBuiltWithCompany) {
    const industry = isProvider
      ? (data.category ? CATEGORY_TO_INDUSTRY[data.category] ?? "Otro" : "Otro")
      : "Desarrolladora";
    const fallbackName = isProvider ? "Proveedor sin nombre" : "Desarrolladora sin nombre";
    // Para el Account, Description sí concatena contexto + mensaje (Accounts no tiene campo Mensaje propio)
    const accountDescriptionParts = [desc, mensaje ? `Mensaje: ${mensaje}` : undefined].filter(Boolean);
    const accountDesc = accountDescriptionParts.length > 0
      ? truncateDescription(accountDescriptionParts.join("\n"))
      : undefined;
    const billingCity = data.city || data.location;
    account = {
      Account_Name: data.company || fallbackName,
      Industry: industry,
      Fuente_de_Empresa: "Sitio web",
      Estado_de_Empresa: "NUEVO",
      ...(data.phone ? { Phone: data.phone } : {}),
      ...(data.companyWebsite ? { Website: data.companyWebsite } : {}),
      ...(billingCity ? { Billing_City: billingCity } : {}),
      Billing_Country: "Mexico",
      ...(accountDesc ? { Description: accountDesc } : {}),
    };
  }

  return { lead, account };
}
