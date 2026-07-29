/**
 * Mapa categoría de artículo → página pilar.
 *
 * Sin este enlace bidireccional cada artículo compite con su propio pilar por la
 * misma intención en vez de reforzarlo; con ~60 artículos nuevos previstos eso es
 * canibalización a escala.
 *
 * OJO — este mapa **publica UI**: añadir una entrada hace aparecer el módulo
 * "Artículos relacionados" en esa página hub y el enlace al pilar en esos
 * artículos. Verificar que la categoría tenga artículos antes de mapearla.
 *
 * `null` = decidido NO tener pilar (Luis, 2026-07-28: "Estilo de vida" no encaja
 * en ninguno). Se distingue de `undefined` (categoría que nadie mapeó todavía) a
 * propósito: si aparece una categoría nueva en BD y nadie toca este archivo, el
 * artículo se queda sin pilar EN SILENCIO. `pilarDeCategoria` avisa en dev.
 */

export const PILARES = [
  'como-invertir',
  'financiamiento',
  'como-comprar',
  'mercado',
  'brokers',
  'desarrolladores',
] as const;

export type Pilar = (typeof PILARES)[number];

/** Clave = valor EXACTO de `blog_posts.category` (no se localiza, es la misma en es/en). */
export const CATEGORIA_A_PILAR: Record<string, Pilar | null> = {
  'Inversión': 'como-invertir',
  'Para Inversionistas': 'como-invertir',
  'Guías de compra': 'como-comprar',
  'Legal y fiscal': 'como-comprar',
  'Mercado': 'mercado',
  'Para Asesores': 'brokers',
  // Sin pilar por decisión explícita — no es un olvido.
  'Estilo de vida': null,
  // Categoría creada 2026-07-29 para el contenido de arquitectura y diseño de
  // vivienda (autor por defecto: Pablo Toral). Sin pilar, por el mismo criterio
  // que "Estilo de vida": es contenido editorial, no una etapa del embudo de
  // compra. Si se decide colgarla de /como-comprar, es cambiar este valor.
  'Arquitectura y diseño': null,
};

/** Clave i18n del texto de enlace, en el namespace `pilares`. */
export const PILAR_LABEL_KEY: Record<Pilar, string> = {
  'como-invertir': 'comoInvertir',
  financiamiento: 'financiamiento',
  'como-comprar': 'comoComprar',
  mercado: 'mercado',
  brokers: 'brokers',
  desarrolladores: 'desarrolladores',
};

/**
 * Pilar de una categoría. `null` tanto si la categoría no tiene pilar por
 * decisión como si es desconocida — pero la desconocida se registra, porque una
 * categoría nueva sin mapear es un artículo que pierde su enlace sin avisar.
 */
export function pilarDeCategoria(category: string): Pilar | null {
  if (!(category in CATEGORIA_A_PILAR)) {
    console.warn(
      `[pilares] categoría "${category}" sin entrada en CATEGORIA_A_PILAR — el artículo queda sin enlace a pilar. Añádela (o mapéala a null si es deliberado).`
    );
    return null;
  }
  return CATEGORIA_A_PILAR[category] ?? null;
}

/** Categorías que alimentan un pilar. Vacío = ese hub no tiene artículos que mostrar. */
export function categoriasDePilar(pilar: Pilar): string[] {
  return Object.entries(CATEGORIA_A_PILAR)
    .filter(([, p]) => p === pilar)
    .map(([cat]) => cat);
}

export function pilarHref(locale: string, pilar: Pilar): string {
  return `/${locale}/${pilar}`;
}
