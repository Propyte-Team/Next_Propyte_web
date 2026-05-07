/**
 * Rutas cuyo Hero tiene background oscuro (`#0F1923` / `#1A2F3F`).
 *
 * Se consume desde:
 *   - MainPadding → extiende el bg dark detrás del padding-top para que
 *     el área debajo del header transparente coincida con el hero.
 *   - Breadcrumbs → pinta el texto en variante dark (white/teal) cuando
 *     se renderiza sobre uno de estos heros, eliminando el strip blanco
 *     visualmente desconectado.
 *
 * Reglas:
 *   - Path sin prefijo de locale (`/unete`, no `/es/unete`).
 *   - Match por `startsWith()` — incluye sub-rutas (`/nosotros/quienes-somos`).
 *   - Cuando agregues una página nueva con dark hero, súmala aquí.
 */
export const DARK_HERO_ROUTES = [
  '/unete',
  '/corredores',
  '/reclutamiento',
  '/built',
  '/nosotros',
  '/blog',
  '/desarrolladores',
  '/proveedores',
  '/como-comprar',
  '/como-invertir',
  '/financiamiento',
  '/destacados',
  '/faq',
  '/glosario',
  '/promociones',
];

/**
 * Devuelve true si el pathname dado (con o sin prefijo de locale) corresponde
 * a una página con hero oscuro.
 */
export function isDarkHeroRoute(pathname: string): boolean {
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  return DARK_HERO_ROUTES.some((r) => bare.startsWith(r));
}
