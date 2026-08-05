/**
 * Catálogo canónico de pilares editoriales (P1..P7).
 *
 * Fuente de verdad: `docs-editorial/07_Sistema-Pilares_MAESTRO_corte-05ago2026.md` §3.
 * El Hub empareja briefs por `code` y guarda el destino en `blog_briefs.pillar_url`,
 * así que el CÓDIGO es el identificador estable — no el slug, no el label.
 *
 * NO confundir con `hub-relacionado.ts`. Ese mapa responde "¿en qué hub muestro
 * esta pieza?" (afinidad de superficie, muchos a muchos). Este responde "¿a qué
 * pilar PERTENECE?" (taxonomía, uno a uno, guardada en `blog_posts.pilar`).
 *
 * Módulo neutro SIN 'use client' a propósito: importado desde un módulo
 * 'use client', Next 16 RSC convierte el const en proxy function en el server y
 * `===` devuelve siempre false. Mismo motivo que documenta
 * `src/components/blog/categories.ts`.
 *
 * La BD guarda `code`; la URL lleva `slug`. Así `?pilar=fiscal-legal` es legible
 * y neutro al idioma, en vez de repetir el `?categoria=Para%20Inversionistas`
 * (label con espacio, atado al español).
 *
 * P8 (Relocación y Vida) está diferido a fase 2 por el maestro: no se declara.
 */

export const AUDIENCIAS = ['inversionistas', 'asesores'] as const;
export type Audiencia = (typeof AUDIENCIAS)[number];

export const PILAR_CODES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] as const;
export type PilarCode = (typeof PILAR_CODES)[number];

export interface Pilar {
  /** Código canónico del maestro. Es lo que se guarda en `blog_posts.pilar`. */
  readonly code: PilarCode;
  /** Lo que viaja en `?pilar=`. Legible y estable. */
  readonly slug: string;
  /** Hubs del pilar, sin prefijo de locale. El primero es el primario. */
  readonly hubs: readonly string[];
  /**
   * Audiencia por defecto al clasificar una pieza de este pilar. La columna
   * `blog_posts.audiencia` manda si difiere: P7-03 ("cerrar con comprador
   * extranjero") es de asesor y a la vez muy fiscal.
   */
  readonly audiencia: Audiencia;
}

export const PILARES: readonly Pilar[] = [
  { code: 'P1', slug: 'fiscal-legal',   hubs: ['/guias/fiscal-legal'],          audiencia: 'inversionistas' },
  { code: 'P2', slug: 'proceso-compra', hubs: ['/como-comprar'],                audiencia: 'inversionistas' },
  { code: 'P3', slug: 'inversion-roi',  hubs: ['/como-invertir'],               audiencia: 'inversionistas' },
  { code: 'P4', slug: 'financiamiento', hubs: ['/financiamiento'],              audiencia: 'inversionistas' },
  { code: 'P5', slug: 'mercado-zonas',  hubs: ['/mercado'],                     audiencia: 'inversionistas' },
  { code: 'P6', slug: 'costa-branded',  hubs: ['/guias/costa'],                 audiencia: 'inversionistas' },
  { code: 'P7', slug: 'canal',          hubs: ['/brokers', '/desarrolladores'], audiencia: 'asesores' },
] as const;

export function esPilarCode(v: string): v is PilarCode {
  return (PILAR_CODES as readonly string[]).includes(v);
}

export function esAudiencia(v: string): v is Audiencia {
  return (AUDIENCIAS as readonly string[]).includes(v);
}

/** Pilar por código canónico (`P1`). `null` si no existe. */
export function pilarPorCodigo(code: string): Pilar | null {
  return PILARES.find((p) => p.code === code) ?? null;
}

/** Pilar por slug de URL (`fiscal-legal`). `null` si no existe. */
export function pilarPorSlug(slug: string): Pilar | null {
  return PILARES.find((p) => p.slug === slug) ?? null;
}

/** URL del hub primario del pilar, con locale. */
export function pilarHubHref(locale: string, pilar: Pilar): string {
  return `/${locale}${pilar.hubs[0]}`;
}
