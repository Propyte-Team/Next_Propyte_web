/**
 * Catálogo de slots de materiales audiovisuales del sitio — FUENTE ÚNICA.
 *
 * Cada vez que pones un material gestionable en el sitio (un `<SiteMedia mediaKey>`),
 * agrega su slot aquí. El Hub lee este catálogo vía `/api/public/site-media-slots`
 * y lo muestra automáticamente en "Materiales del sitio" (sin tocar ni redeployar
 * el Hub). El Hub mantiene una copia solo como fallback si la web no responde.
 *
 * `defaultKind` es sugerencia para el admin; el material real guarda su propio
 * `kind` en la fila (cualquier slot puede ser imagen o video).
 */
export interface SiteMediaSlot {
  key: string;
  group: string;
  labelEs: string;
  labelEn: string;
  defaultKind: 'image' | 'video';
  /** Hint de aspect para el preview del admin (ej. "16/9"). */
  aspect?: string;
}

export const SITE_MEDIA_SLOTS: SiteMediaSlot[] = [
  // Desarrollos · Ciudades
  { key: 'city.cancun', group: 'Desarrollos · Ciudades', labelEs: 'Foto de Cancún', labelEn: 'Cancún photo', defaultKind: 'image', aspect: '21/9' },
  { key: 'city.tulum', group: 'Desarrollos · Ciudades', labelEs: 'Foto de Tulum', labelEn: 'Tulum photo', defaultKind: 'image', aspect: '21/9' },
  { key: 'city.merida', group: 'Desarrollos · Ciudades', labelEs: 'Foto de Mérida', labelEn: 'Mérida photo', defaultKind: 'image', aspect: '21/9' },
  { key: 'city.playa-del-carmen', group: 'Desarrollos · Ciudades', labelEs: 'Foto de Playa del Carmen', labelEn: 'Playa del Carmen photo', defaultKind: 'image', aspect: '21/9' },
  // Zonas
  { key: 'zona.generic', group: 'Zonas', labelEs: 'Foto genérica de zona', labelEn: 'Generic zone photo', defaultKind: 'image', aspect: '16/9' },
  // Nosotros
  { key: 'nosotros.oficina', group: 'Nosotros', labelEs: 'Oficina Propyte (Quiénes somos)', labelEn: 'Propyte office', defaultKind: 'image', aspect: '4/3' },
  { key: 'nosotros.equipo-liderazgo', group: 'Nosotros', labelEs: 'Equipo de liderazgo (Estructura)', labelEn: 'Leadership team', defaultKind: 'image', aspect: '16/9' },
  // Educativas
  { key: 'como-comprar.hero', group: 'Educativas', labelEs: 'Hero · Cómo comprar', labelEn: 'How to buy hero', defaultKind: 'image', aspect: '21/9' },
  { key: 'como-invertir.hero', group: 'Educativas', labelEs: 'Hero · Cómo invertir', labelEn: 'How to invest hero', defaultKind: 'image', aspect: '21/9' },
  { key: 'metodologia.dashboard', group: 'Educativas', labelEs: 'Dashboard de datos (Metodología)', labelEn: 'Data dashboard', defaultKind: 'video', aspect: '16/9' },
  // Contacto
  { key: 'contacto.oficina', group: 'Contacto', labelEs: 'Oficina (Contacto)', labelEn: 'Office (Contact)', defaultKind: 'image', aspect: '16/9' },
  // Built
  { key: 'built.renders', group: 'Built', labelEs: 'Renders / proyectos Built', labelEn: 'Built renders', defaultKind: 'image', aspect: '21/9' },
  // Brokers
  { key: 'brokers.hero', group: 'Brokers', labelEs: 'Hero · Brokers', labelEn: 'Brokers hero', defaultKind: 'image', aspect: '4/3' },
  { key: 'brokers.equipo', group: 'Brokers', labelEs: 'Equipo / Account Manager (Brokers)', labelEn: 'Broker team', defaultKind: 'image', aspect: '16/9' },
];

export const SITE_MEDIA_KEYS: string[] = SITE_MEDIA_SLOTS.map((s) => s.key);
