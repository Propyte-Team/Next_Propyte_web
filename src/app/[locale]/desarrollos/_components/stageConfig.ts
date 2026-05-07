/**
 * Stage taxonomy for /desarrollos/etapa/{stage} routes.
 * Each entry powers a thin page wrapper that renders the marketplace
 * pre-filtered by `stage` on Supabase.
 */
export interface StageInfo {
  /** Canonical slug used in URLs and `stage` column. */
  slug: 'preventa' | 'construccion' | 'entrega_inmediata';
  /** Display name singular. */
  nameEs: string;
  nameEn: string;
  descEs: string;
  descEn: string;
}

export const STAGE_MAP: Record<string, StageInfo> = {
  preventa: {
    slug: 'preventa',
    nameEs: 'Preventa',
    nameEn: 'Pre-sale',
    descEs:
      'Desarrollos en preventa con precios de lanzamiento, planes de financiamiento y mayor potencial de plusvalía. Asegura tu propiedad antes que el resto.',
    descEn:
      'Pre-sale developments with launch pricing, financing plans, and higher appreciation potential. Lock in your property before the rest.',
  },
  construccion: {
    slug: 'construccion',
    nameEs: 'En Construcción',
    nameEn: 'Under Construction',
    descEs:
      'Desarrollos en construcción con avance verificado. Acércate a la entrega con confianza y aprovecha precios competitivos antes de la entrega final.',
    descEn:
      'Under-construction developments with verified progress. Get close to delivery with confidence and lock in competitive pricing before final handover.',
  },
  entrega_inmediata: {
    slug: 'entrega_inmediata',
    nameEs: 'Entrega Inmediata',
    nameEn: 'Ready to Move In',
    descEs:
      'Propiedades listas para entrega inmediata. Sin esperas: muévete o renta tu inversión desde el primer día.',
    descEn:
      'Ready-to-move-in properties. No waiting periods: move in or rent out your investment from day one.',
  },
};

/**
 * URL-safe slug → canonical stage value.
 * `entrega_inmediata` (db) is exposed as `entrega-inmediata` (URL).
 */
export const STAGE_URL_SLUGS: Record<string, string> = {
  preventa: 'preventa',
  construccion: 'construccion',
  'entrega-inmediata': 'entrega_inmediata',
};

export const STAGE_SLUGS_URL = Object.keys(STAGE_URL_SLUGS);
