export type VisibilityMap = Record<string, boolean>;

// Visibility keys registered in real_estate_hub.site_visibility
export const VISIBILITY_KEYS = {
  HOME_HERO: "home.hero",
  HOME_FEATURED: "home.featured",
  HOME_TESTIMONIALS: "home.testimonials",
  HOME_PARTNERS: "home.partners",
  HOME_CTA_JOIN: "home.cta_join",
  HOME_WHY_PROPYTE: "home.why_propyte",
  NAV_MERCADO: "nav.mercado",
  NAV_BROKERS: "nav.brokers",
  NAV_BUILT: "nav.built",
  NAV_BLOG: "nav.blog",
  NAV_PROVIDERS: "nav.providers",
  DESARROLLOS_MAP: "desarrollos.map",
  DESARROLLOS_COMPARE: "desarrollos.compare",
  DESARROLLOS_DETAIL_RENTABILIDAD: "desarrollos.detail.rentabilidad",
  DESARROLLOS_DETAIL_GEO: "desarrollos.detail.geo",
  PROPIEDADES_DETAIL_RENTABILIDAD: "propiedades.detail.rentabilidad",
  PROPIEDADES_DETAIL_TOUR: "propiedades.detail.tour",
  PROPIEDADES_DETAIL_GEO: "propiedades.detail.geo",
  MERCADO_VACACIONAL: "mercado.vacacional",
  MERCADO_TRADICIONAL: "mercado.tradicional",
  BLOG_LISTING: "blog.listing",
  CONTACTO_CALENDLY: "contacto.calendly",
  CONTACTO_MAP: "contacto.map",
  NOSOTROS_QUIENES_SOMOS: "nosotros.quienes-somos",
  NOSOTROS_ESTRUCTURA: "nosotros.estructura",
  NOSOTROS_EQUIPO_COMERCIAL: "nosotros.equipo-comercial",
} as const;

// fail-open: key not in map → visible
export function isVisible(map: VisibilityMap, key: string): boolean {
  return map[key] !== false;
}

export async function getVisibility(): Promise<VisibilityMap> {
  const hubUrl = process.env.PROPYTE_HUB_URL;
  if (!hubUrl) return {};

  const env = process.env.VISIBILITY_ENV === "dev" ? "dev" : "prod";

  try {
    const res = await fetch(
      `${hubUrl}/api/site-config/visibility?env=${env}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return {};
    return (await res.json()) as VisibilityMap;
  } catch {
    return {};
  }
}
