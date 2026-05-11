// Helpers para consumir contenido editorial dinámico desde Propyte Hub.
//
// Endpoints públicos en hub.propyte.com con cache 5min + SWR 1h.
// Si HUB_API_URL no está configurado o la red falla, las funciones
// regresan [] y los componentes deben caer al fallback hardcoded.

// PROPYTE_HUB_URL es el nombre canonico ya configurado en Vercel.
// HUB_API_URL queda como alias por compat con el .env.example.
const HUB_BASE = process.env.PROPYTE_HUB_URL ?? process.env.HUB_API_URL ?? "";

const NEXT_FETCH_OPTIONS = {
  // Next.js ISR: revalidar cada 5 min en producción
  next: { revalidate: 300 },
};

export interface HubTestimonial {
  id: string;
  context: "home" | "recruitment" | "built" | "brokers";
  name: string;
  role_es: string | null;
  role_en: string | null;
  location: string | null;
  quote_es: string;
  quote_en: string;
  rating: number | null;
  photo_url: string | null;
  verified: boolean;
  stat1_label_es: string | null;
  stat1_label_en: string | null;
  stat1_value: string | null;
  stat2_label_es: string | null;
  stat2_label_en: string | null;
  stat2_value: string | null;
  sort_order: number;
}

export interface HubFaq {
  id: string;
  context: "general" | "property" | "broker" | "developer" | "recruitment";
  category: string | null;
  question_es: string;
  question_en: string;
  answer_es: string;
  answer_en: string;
  sort_order: number;
}

export interface HubCta {
  id: string;
  slot: string;
  eyebrow_es: string | null;
  eyebrow_en: string | null;
  title_es: string;
  title_en: string;
  subtitle_es: string | null;
  subtitle_en: string | null;
  button_label_es: string | null;
  button_label_en: string | null;
  button_href: string | null;
  icon_name: string | null;
  accent_color: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface HubBlogFeatured {
  id: string;
  category: "asesores" | "inversionistas";
  post_slug: string;
  sort_order: number;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!HUB_BASE) return null;
  try {
    const res = await fetch(`${HUB_BASE}${path}`, NEXT_FETCH_OPTIONS);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getTestimonials(
  context: HubTestimonial["context"],
): Promise<HubTestimonial[]> {
  const r = await fetchJson<{ items: HubTestimonial[] }>(
    `/api/public/testimonials?context=${context}`,
  );
  return r?.items ?? [];
}

export async function getFaqs(
  context: HubFaq["context"],
  category?: string,
): Promise<HubFaq[]> {
  const qs = new URLSearchParams({ context });
  if (category) qs.set("category", category);
  const r = await fetchJson<{ items: HubFaq[] }>(`/api/public/faqs?${qs.toString()}`);
  return r?.items ?? [];
}

export async function getCta(slot: string): Promise<HubCta | null> {
  const r = await fetchJson<{ item: HubCta | null }>(`/api/public/ctas?slot=${slot}`);
  return r?.item ?? null;
}

export async function getBlogFeatured(category: HubBlogFeatured["category"]): Promise<HubBlogFeatured[]> {
  const r = await fetchJson<{ items: HubBlogFeatured[] }>(
    `/api/public/blog-featured?category=${category}`,
  );
  return r?.items ?? [];
}

// =============================================================================
// Site config — Fase B.1
// =============================================================================
// Speckit: Propyte_hub/specs/dynamic-content/spec.md §Fase B.1
// Endpoint: GET /api/public/site-config → { config: { key: value, ... } }

export type HubSiteConfig = Record<string, unknown>;

// Next.js dedupa fetches con misma URL+options dentro del mismo request
// (React request memoization), y revalida cada 300s gracias a NEXT_FETCH_OPTIONS.
// No agregamos cache adicional a nivel de módulo — eso bloquea el revalidate.
export async function getSiteConfig(): Promise<HubSiteConfig> {
  const r = await fetchJson<{ config: HubSiteConfig }>(`/api/public/site-config`);
  return r?.config ?? {};
}

// Resolver una key específica con tipo. Falla silenciosamente si no existe.
export async function getSiteConfigValue<T = unknown>(key: string): Promise<T | null> {
  const cfg = await getSiteConfig();
  return (cfg[key] as T) ?? null;
}

// Resolver pair localizado `${baseKey}_es` / `${baseKey}_en` con fallback a ES.
export async function getLocalizedSiteConfig(
  baseKey: string,
  locale: string,
): Promise<string | null> {
  const cfg = await getSiteConfig();
  const lang = locale === "en" ? "en" : "es";
  const localized = cfg[`${baseKey}_${lang}`];
  if (typeof localized === "string") return localized;
  const fallback = cfg[`${baseKey}_es`];
  return typeof fallback === "string" ? fallback : null;
}

// Helpers para resolver locale-specific value desde una entrada bilingüe.
export function localized<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  locale: string,
): string | null {
  const key = `${field}_${locale === "en" ? "en" : "es"}`;
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

// =============================================================================
// Company stats — Fase B.2
// =============================================================================
// Speckit: Propyte_hub/specs/dynamic-content/spec.md §Fase B.2
// Endpoint: GET /api/public/company-stats?context=<...> → { items: HubCompanyStat[] }

export type HubCompanyStatContext =
  | "home"
  | "quienes_somos"
  | "estructura"
  | "unete"
  | "built";

export interface HubCompanyStat {
  id: string;
  context: HubCompanyStatContext;
  key: string;
  value: string;
  label_es: string;
  label_en: string;
  sublabel_es: string | null;
  sublabel_en: string | null;
  sort_order: number;
}

export async function getCompanyStats(
  context: HubCompanyStatContext,
): Promise<HubCompanyStat[]> {
  const r = await fetchJson<{ items: HubCompanyStat[] }>(
    `/api/public/company-stats?context=${context}`,
  );
  return r?.items ?? [];
}

// Resolver label + sublabel localizados de un stat. Devuelve string vacío si no hay match.
export function localizedStatLabel(stat: HubCompanyStat, locale: string): string {
  return locale === "en" ? stat.label_en : stat.label_es;
}

export function localizedStatSublabel(
  stat: HubCompanyStat,
  locale: string,
): string | null {
  return locale === "en" ? stat.sublabel_en : stat.sublabel_es;
}

// =============================================================================
// Explore categories — Fase B.3
// =============================================================================
// Speckit: Propyte_hub/specs/dynamic-content/spec.md §Fase B.3
// Endpoint: GET /api/public/explore-categories → { items: HubExploreCategory[] }

export interface HubExploreCategory {
  id: string;
  slug: string;
  type_key: string | null;
  label_es: string;
  label_en: string;
  image_url: string;
  href: string;
  sort_order: number;
}

export async function getExploreCategories(): Promise<HubExploreCategory[]> {
  const r = await fetchJson<{ items: HubExploreCategory[] }>(
    `/api/public/explore-categories`,
  );
  return r?.items ?? [];
}

export function localizedExploreLabel(
  cat: HubExploreCategory,
  locale: string,
): string {
  return locale === "en" ? cat.label_en : cat.label_es;
}
