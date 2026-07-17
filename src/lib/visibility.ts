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
  PROPIEDADES_DETAIL_ESQUEMAS: "propiedades.detail.esquemas",
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
  // Page-level toggles (el Hub ya los expone como page.*). Gatean la PÁGINA
  // completa vía assertPageVisible() → notFound() si el Hub la marca false.
  // Nota de naming: el Hub usa `page.corredores` para la ruta /brokers.
  PAGE_ZONAS: "page.zonas",
  PAGE_BLOG: "page.blog",
  PAGE_BROKERS: "page.corredores",
  PAGE_PROVEEDORES: "page.proveedores",
  PAGE_UNETE: "page.unete",
  PAGE_BUILT: "page.built",
  PAGE_DESTACADOS: "page.destacados",
  PAGE_RENTAS: "page.rentas",
  // Páginas agregadas al Hub 2026-06-16 (site_visibility, default visible=true).
  PAGE_DESARROLLADORES: "page.desarrolladores",
  PAGE_EXCLUSIVOS: "page.exclusivos",
  PAGE_FAQ: "page.faq",
  PAGE_FINANCIAMIENTO: "page.financiamiento",
  PAGE_GLOSARIO: "page.glosario",
  PAGE_METODOLOGIA: "page.metodologia",
  PAGE_COMO_COMPRAR: "page.como-comprar",
  PAGE_COMO_INVERTIR: "page.como-invertir",
  PAGE_PROMOCIONES: "page.promociones",
} as const;

// fail-open: key not in map → visible
export function isVisible(map: VisibilityMap, key: string): boolean {
  return map[key] !== false;
}

export async function getVisibility(): Promise<VisibilityMap> {
  // PROPYTE_HUB_URL es el nombre canónico (Vercel). En Hostinger prod la var
  // se llama HUB_API_URL — sin este fallback, getVisibility devolvía {} y el
  // fail-open mostraba TODAS las pestañas (mismo patrón que hub-content.ts).
  const hubUrl = process.env.PROPYTE_HUB_URL ?? process.env.HUB_API_URL;
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
