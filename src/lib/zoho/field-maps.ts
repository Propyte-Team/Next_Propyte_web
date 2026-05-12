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
  website?: string | null; // NOTE: en payload "user" website (Form 6); también honeypot — el endpoint lo separa antes
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
    Nombre_de_Campa_a: `Propyte web - ${campaignSlug(source)}`,
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
    // Q6 abierta — afiliados defaultean a Lead hasta confirmación de Luis
    case "affiliate_request":   return "Lead";
    default:                    return "Lead";
  }
}

/** Description compuesta — concatena campos extra que no tienen field dedicado en Zoho. */
function composeDescription(source: LeadSource, data: FormData): string | undefined {
  const parts: string[] = [];

  switch (source) {
    case "contact":
      if (data.subject) parts.push(`Asunto: ${data.subject}`);
      if (data.message) parts.push(data.message);
      break;
    case "property_inquiry":
      if (data.investmentType) parts.push(`Tipo inversión: ${data.investmentType}`);
      if (data.propertyName) parts.push(`Propiedad: ${data.propertyName}`);
      if (data.message) parts.push(data.message);
      break;
    case "developer_request":
      if (data.projectType) parts.push(`Tipo proyecto: ${data.projectType}`);
      if (data.unitCount) parts.push(`Unidades: ${data.unitCount}`);
      if (data.message) parts.push(data.message);
      break;
    case "b2b_request":
      if (data.message) parts.push(data.message);
      break;
    case "broker_registration":
      if (data.brokerType) parts.push(`Tipo broker: ${data.brokerType}`);
      if (data.experience) parts.push(`Experiencia: ${data.experience}`);
      if (data.focusArea) parts.push(`Zona enfoque: ${data.focusArea}`);
      if (data.message) parts.push(`Mensaje: ${data.message}`);
      break;
    case "provider_form": {
      const industry = data.category ? CATEGORY_TO_INDUSTRY[data.category] ?? data.category : undefined;
      if (industry) parts.push(`Categoría: ${industry}`);
      if (data.website) parts.push(`Sitio web: ${data.website}`);
      if (data.message) parts.push(`Mensaje: ${data.message}`);
      break;
    }
    case "built_consultation":
      if (data.projectType) parts.push(`Tipo proyecto: ${data.projectType}`);
      if (data.budget) parts.push(`Presupuesto: ${data.budget}`);
      if (data.message) parts.push(data.message);
      break;
    case "affiliate_request":
      if (data.experience) parts.push(`Experiencia: ${data.experience}`);
      if (data.interest) parts.push(`Interés: ${data.interest}`);
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

  // Description (catch-all)
  const desc = composeDescription(source, data);
  if (desc) lead.Description = desc;

  // Form 6 — segunda llamada a Accounts
  let account: ZohoAccount | undefined;
  if (source === "provider_form") {
    const industry = data.category ? CATEGORY_TO_INDUSTRY[data.category] ?? "Otro" : "Otro";
    account = {
      Account_Name: data.company || "Proveedor sin nombre",
      Industry: industry,
      Fuente_de_Empresa: "Sitio web",
      Estado_de_Empresa: "NUEVO",
      ...(data.phone ? { Phone: data.phone } : {}),
      ...(data.website ? { Website: data.website } : {}),
      ...(data.city ? { Billing_City: data.city } : {}),
      Billing_Country: "Mexico",
      ...(desc ? { Description: desc } : {}),
    };
  }

  return { lead, account };
}
