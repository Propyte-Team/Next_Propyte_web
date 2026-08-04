/**
 * Mapa categoría de artículo → hub donde mostrarla ("afinidad de superficie").
 *
 * OJO — esto NO es la taxonomía de pilares del maestro editorial. Esa vive en
 * `pilares.ts` y en la columna `blog_posts.pilar` (P1..P7). Son dos preguntas
 * distintas, separadas a propósito:
 *   - `pilares.ts`  → ¿a qué pilar PERTENECE esta pieza? (taxonomía, uno a uno)
 *   - este archivo  → ¿en qué hub tiene sentido MOSTRARLA? (superficie, muchos a muchos)
 * Una pieza puede ser P1 (fiscal) y aun así reforzar /es/como-comprar.
 *
 * Sin este enlace bidireccional cada artículo compite con su propio hub por la
 * misma intención en vez de reforzarlo; con ~60 artículos nuevos previstos eso es
 * canibalización a escala.
 *
 * OJO — este mapa **publica UI**: añadir una entrada hace aparecer el módulo
 * "Artículos relacionados" en esa página hub y el enlace al hub en esos
 * artículos. Verificar que la categoría tenga artículos antes de mapearla.
 *
 * `null` = decidido NO tener hub (Luis, 2026-07-28: "Estilo de vida" no encaja
 * en ninguno). Se distingue de `undefined` (categoría que nadie mapeó todavía) a
 * propósito: si aparece una categoría nueva en BD y nadie toca este archivo, el
 * artículo se queda sin hub EN SILENCIO. `hubDeCategoria` avisa en dev.
 */

export const HUBS_RELACIONADOS = [
  'como-invertir',
  'financiamiento',
  'como-comprar',
  'mercado',
  'brokers',
  'desarrolladores',
] as const;

export type HubRelacionado = (typeof HUBS_RELACIONADOS)[number];

/** Clave = valor EXACTO de `blog_posts.category` (no se localiza, es la misma en es/en). */
export const CATEGORIA_A_HUB: Record<string, HubRelacionado | null> = {
  'Inversión': 'como-invertir',
  'Para Inversionistas': 'como-invertir',
  'Guías de compra': 'como-comprar',
  'Legal y fiscal': 'como-comprar',
  'Mercado': 'mercado',
  'Para Asesores': 'brokers',
  // Sin hub por decisión explícita — no es un olvido.
  'Estilo de vida': null,
  // Categoría creada 2026-07-29 para el contenido de arquitectura y diseño de
  // vivienda (autor por defecto: Pablo Toral). Sin hub, por el mismo criterio
  // que "Estilo de vida": es contenido editorial, no una etapa del embudo de
  // compra. Si se decide colgarla de /como-comprar, es cambiar este valor.
  'Arquitectura y diseño': null,
};

/** Clave i18n del texto de enlace, en el namespace `hubRelacionado`. */
export const HUB_LABEL_KEY: Record<HubRelacionado, string> = {
  'como-invertir': 'comoInvertir',
  financiamiento: 'financiamiento',
  'como-comprar': 'comoComprar',
  mercado: 'mercado',
  brokers: 'brokers',
  desarrolladores: 'desarrolladores',
};

/**
 * Hub de una categoría. `null` tanto si la categoría no tiene hub por decisión
 * como si es desconocida — pero la desconocida se registra, porque una categoría
 * nueva sin mapear es un artículo que pierde su enlace sin avisar.
 */
export function hubDeCategoria(category: string): HubRelacionado | null {
  if (!(category in CATEGORIA_A_HUB)) {
    console.warn(
      `[hub-relacionado] categoría "${category}" sin entrada en CATEGORIA_A_HUB — el artículo queda sin enlace a hub. Añádela (o mapéala a null si es deliberado).`
    );
    return null;
  }
  return CATEGORIA_A_HUB[category] ?? null;
}

/** Categorías que alimentan un hub. Vacío = ese hub no tiene artículos que mostrar. */
export function categoriasDeHub(hub: HubRelacionado): string[] {
  return Object.entries(CATEGORIA_A_HUB)
    .filter(([, h]) => h === hub)
    .map(([cat]) => cat);
}

export function hubHref(locale: string, hub: HubRelacionado): string {
  return `/${locale}/${hub}`;
}
