// GENERADO POR scripts/gen-lp-manifest.mjs — NO EDITAR A MANO.
// Se regenera en cada `npm run build` (prebuild). Para actualizarlo:
//   node scripts/gen-lp-manifest.mjs

export type LandingManifestEntry = {
  /** Segmento de la carpeta bajo `src/app/lp/`. */
  slug: string;
  /** Ruta servida, relativa al dominio. */
  path: string;
};

export const LP_MANIFEST: readonly LandingManifestEntry[] = [
  { slug: 'casas-riviera-maya', path: '/lp/casas-riviera-maya' },
  { slug: 'homes-riviera-maya', path: '/lp/homes-riviera-maya' },
  { slug: 'lotes-playa-del-carmen', path: '/lp/lotes-playa-del-carmen' },
  { slug: 'terrenos-playa-del-carmen', path: '/lp/terrenos-playa-del-carmen' },
];
