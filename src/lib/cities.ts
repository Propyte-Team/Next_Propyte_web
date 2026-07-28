/**
 * Catálogo de ciudades con landing propia en /desarrollos/{slug} — FUENTE ÚNICA.
 *
 * Todo lo que dependa de la lista de ciudades debe leerse de aquí: el sitemap,
 * el catálogo de slots de materiales y las páginas. Antes el slug vivía copiado
 * en tres listas a mano (CITY_MAP, SITE_MEDIA_SLOTS y el array del sitemap), así
 * que agregar una ciudad eran cuatro pasos y olvidar uno la dejaba a medias sin
 * que nada fallara.
 *
 * **Para agregar una ciudad:** una entrada en `CITY_MAP` + la carpeta
 * `app/[locale]/desarrollos/{slug}/page.tsx` (copiar cualquier wrapper existente
 * y cambiar `CITY_SLUG`). El sitemap y el slot de foto salen solos, y hay tests
 * guardia que fallan si la ruta o la entrada no se corresponden.
 *
 * Criterio para que una ciudad entre: **inventario publicado**. Una landing con
 * "0 resultados" es lo que este catálogo vino a evitar, y Google penaliza páginas
 * vacías (decisión de Luis 2026-07-28).
 */
export interface CityInfo {
  /** Nombre tal como aparece en la columna `city` de Supabase, con acentos. */
  name: string;
  state: string;
  /** Región para el eyebrow del hero. NO es el estado: "Riviera Maya" es marca
   *  con peso SEO para Q. Roo, pero Mérida y Telchac son Yucatán y decir
   *  "Riviera Maya" ahí es falso — y es justo lo que hacía el literal fijo de
   *  `marketplace.heroEyebrow` en la página de Mérida. */
  region: string;
  descEs: string;
  descEn: string;
}

export const CITY_MAP: Record<string, CityInfo> = {
  cancun: {
    name: 'Cancún',
    state: 'Quintana Roo',
    region: 'Riviera Maya',
    descEs:
      'Explora los nuevos desarrollos inmobiliarios en Cancún, Quintana Roo. Preventas de departamentos, casas y terrenos con los mejores precios.',
    descEn:
      'Explore new real estate developments in Cancún, Quintana Roo. Pre-sale apartments, houses, and land at the best prices.',
  },
  'playa-del-carmen': {
    name: 'Playa del Carmen',
    state: 'Quintana Roo',
    region: 'Riviera Maya',
    descEs:
      'Descubre los nuevos desarrollos en Playa del Carmen. Condos de inversión, preventas y oportunidades en la Riviera Maya.',
    descEn:
      'Discover new developments in Playa del Carmen. Investment condos, pre-sales, and opportunities in the Riviera Maya.',
  },
  tulum: {
    name: 'Tulum',
    state: 'Quintana Roo',
    region: 'Riviera Maya',
    descEs:
      'Nuevos lanzamientos inmobiliarios en Tulum. Departamentos, villas y terrenos en preventa con alto potencial de inversión.',
    descEn:
      'New real estate launches in Tulum. Apartments, villas, and land in pre-sale with high investment potential.',
  },
  merida: {
    name: 'Mérida',
    state: 'Yucatán',
    region: 'Yucatán',
    descEs:
      'Desarrollos inmobiliarios en Mérida, Yucatán. Terrenos, casas y departamentos en preventa en las mejores zonas.',
    descEn:
      'Real estate developments in Mérida, Yucatán. Land, houses, and apartments in pre-sale in the best zones.',
  },
  telchac: {
    name: 'Telchac',
    state: 'Yucatán',
    region: 'Yucatán',
    descEs:
      'Desarrollos inmobiliarios frente al mar en Telchac, Yucatán. Departamentos en preventa en la costa yucateca.',
    descEn:
      'Beachfront real estate developments in Telchac, Yucatán. Pre-sale apartments on the Yucatán coast.',
  },
};

export const CITY_SLUGS = Object.keys(CITY_MAP);

/**
 * Variantes de escritura con las que buscar la ciudad en la columna `city`.
 *
 * **`ILIKE` es case-insensitive pero accent-SENSITIVE**: `'%Cancun%'` NO matchea
 * `'Cancún'`. Medido 2026-07-28 en prod, la columna solo guarda la forma
 * acentuada (`Cancún` 141 filas, cero sin acento), y por buscar sin acento las
 * páginas de Cancún y Mérida llevaban meses vacías. Tulum y Playa del Carmen
 * funcionaban solo porque no llevan acento.
 *
 * Se **derivan** del nombre en vez de listarse a mano justamente para que la
 * próxima ciudad con acento no pueda nacer vacía por un olvido.
 */
export function cityMatchTerms(name: string): string[] {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return plain === name ? [name] : [name, plain];
}

/** Filtro PostgREST `.or()` que matchea cualquier variante del nombre.
 *  Ej: `city.ilike.%Cancún%,city.ilike.%Cancun%`. */
export function cityMatchFilter(name: string): string {
  return cityMatchTerms(name).map((term) => `city.ilike.%${term}%`).join(',');
}

/** Llave del slot de foto de portada en SITE_MEDIA_SLOTS. */
export function cityMediaKey(slug: string): string {
  return `city.${slug}`;
}
