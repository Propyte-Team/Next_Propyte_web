/**
 * NAP canónico de Propyte — fuente única de verdad.
 *
 * "NAP" (Name, Address, Phone) es lo que Google cruza entre el sitio, la ficha
 * de Google Business Profile y los directorios externos para concluir que todos
 * hablan de la MISMA entidad. Si estos datos divergen entre sí, la señal se
 * diluye y el ranking en Maps se resiente.
 *
 * La ficha manda; el sitio se alinea. No editar estos valores sin haber
 * actualizado antes la ficha verificada:
 *   https://maps.google.com/?cid=8644542860614705024
 *
 * Antes de este módulo el NAP vivía en cuatro sitios independientes y ya habían
 * divergido: el JSON-LD publicaba "Calle 5 Norte 95, C.P. 77710" (calle y CP
 * equivocados) y `info@propyte.com` (buzón que no es el público).
 *
 * Consumidores:
 *   - SchemaMarkup.tsx        → JSON-LD RealEstateAgent (lo que lee Google)
 *   - Footer.tsx              → fallback visible si el Hub no responde
 *   - ContactPageContent.tsx  → embed del mapa y enlace a la ficha
 *
 * El texto visible sale del Hub (`contact.address_es` / `_en`); estas constantes
 * son el fallback y la fuente del JSON-LD. `nap.test.ts` vigila que no divergan.
 */

export const NAP_NAME = 'Propyte';

/** Razón social oficial (SOP-4.2-01 §3) — va en legalName, no en name. */
export const NAP_LEGAL_NAME = 'Nativa Tulum';

/** Nombre de la ficha en Google Business Profile (letrero físico). */
export const NAP_GBP_NAME = 'PROPYTE | Real Estate Playa del Carmen';

export const NAP_PHONE = '+52 984 463 8032';

/** Buzón público. El Hub sirve el mismo valor en `contact.email`. */
export const NAP_EMAIL = 'contacto@propyte.com';

export const NAP_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '5ta Avenida esquina Calle 40 Norte',
  addressLocality: 'Playa del Carmen',
  addressRegion: 'Quintana Roo',
  postalCode: '77720',
  addressCountry: 'MX',
} as const;

/** Dirección en una línea — fallback visible cuando el Hub no responde. */
export const NAP_ADDRESS_LINE_ES =
  '5ta Avenida esq. Calle 40 Norte, C.P. 77720, Playa del Carmen, Q. Roo';
export const NAP_ADDRESS_LINE_EN =
  '5th Avenue & 40th Street North, C.P. 77720, Playa del Carmen, Q. Roo';

/** Coordenadas del pin real de la ficha, no del centroide de la calle. */
export const NAP_GEO = {
  latitude: 20.6364179,
  longitude: -87.0655601,
} as const;

/**
 * CID de la ficha. Es el identificador estable de Google Business Profile y la
 * forma canónica de enlazarla: `hasMap` y `sameAs` apuntando aquí son lo que
 * ata este sitio a ese pin.
 */
export const GBP_CID = '8644542860614705024';
export const GBP_URL = `https://maps.google.com/?cid=${GBP_CID}`;

/**
 * Embed por CID, no por búsqueda de texto (`?q=<dirección>`). Un query de texto
 * es una búsqueda cualquiera; el CID incrusta LA ficha.
 */
export const GBP_EMBED_URL = `https://maps.google.com/maps?cid=${GBP_CID}&output=embed`;

export const NAP_SAME_AS = [
  'https://www.instagram.com/propyte.mx/',
  'https://www.facebook.com/propyte',
  GBP_URL,
] as const;

/**
 * Horario de atención — debe coincidir con el publicado en la ficha.
 *
 * Abre los SIETE días de 10:00 a 19:00 (confirmado por Luis, 2026-08-20). Antes
 * de esa confirmación el sitio declaraba Lun–Vie 9:00–18:00 y Sáb 10:00–14:00:
 * apertura y cierre equivocados, y el domingo publicado como cerrado.
 */
export const NAP_OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '10:00',
    closes: '19:00',
  },
] as const;
// El horario en texto visible vive en los mensajes de i18n
// (`dondeEstamos.labHours` y `contact.info.hours`); `nap.test.ts` vigila que no
// reaparezcan los valores viejos ahí.

/** Zonas donde Propyte comercializa — alimenta `areaServed` del JSON-LD. */
export const NAP_AREA_SERVED = [
  'Playa del Carmen',
  'Tulum',
  'Cancún',
  'Mérida',
  'Riviera Maya',
] as const;
