import type { ReactNode } from 'react';

// ============================================================
// Iconos de línea para la lista de amenidades.
//
// ═══ POR QUÉ DIBUJADOS A MANO Y NO DE UNA LIBRERÍA ═══
//
// Es el elemento que la landing de referencia usa en su lista de amenidades:
// pictogramas de trazo fino, uno por línea. `lucide-react` está en el proyecto,
// pero no tiene semántica para «Salón de Eventos», «Pet Zone» ni «Área de
// Niños», y el resultado de forzarlo es el catálogo de iconos aproximados que
// tiene cualquier landing generada: un cuadrado para «CCTV», una casa para
// «salón». Doce trazos propios cuestan menos que eso y no añaden bundle.
//
// ═══ LA REGLA QUE IMPORTA: NO HAY ICONO GENÉRICO ═══
//
// `ICONOS` es un mapa CERRADO por nombre normalizado de amenidad. Una amenidad
// que el Hub empiece a declarar mañana y no esté aquí se pinta con un punto
// neutro, NO con un icono parecido. Un icono equivocado es peor que ninguno:
// afirma algo visualmente que el dato no dice.
//
// Todos comparten caja de 24 y trazo de 1.5, que es lo que los hace leerse como
// una familia y no como iconos pegados de sitios distintos.
// ============================================================

const props = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** Alberca: la línea de agua con las ondas. */
const Alberca = () => (
  <svg {...props}>
    <path d="M3 15c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" />
    <path d="M3 19c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" />
    <path d="M7.5 13.5V5.5a2 2 0 0 1 4 0M15 13.5V5.5a2 2 0 0 1 4 0M7.5 9.5h4" />
  </svg>
);

/** Gimnasio: la mancuerna. */
const Gimnasio = () => (
  <svg {...props}>
    <path d="M4 9v6M7 7.5v9M17 7.5v9M20 9v6M7 12h10" />
  </svg>
);

/** Salón de eventos: la copa. */
const Salon = () => (
  <svg {...props}>
    <path d="M6 4h12l-1 5.5a5 5 0 0 1-10 0L6 4ZM12 15v5M8.5 20h7" />
  </svg>
);

/** Jardín: el árbol. */
const Jardin = () => (
  <svg {...props}>
    <path d="M12 20v-6" />
    <path d="M12 14c-3.3 0-6-2.3-6-5.2C6 5.6 8.7 3 12 3s6 2.6 6 5.8c0 2.9-2.7 5.2-6 5.2Z" />
    <path d="M9.5 17 12 15l2.5 2" />
  </svg>
);

/** Seguridad 24 h: el escudo con la hora. */
const Seguridad = () => (
  <svg {...props}>
    <path d="M12 3l7 2.5v6c0 4-3 7.2-7 9.5-4-2.3-7-5.5-7-9.5v-6L12 3Z" />
    <path d="M12 9v3l2 1.5" />
  </svg>
);

/** CCTV: la cámara en su soporte. */
const Cctv = () => (
  <svg {...props}>
    <path d="M3 8.5l13-3.5 1.4 5.2-13 3.5L3 8.5ZM6.2 13.2 7 16M17.4 10.2 20 9.5M12 20h6" />
    <path d="M15 20a3 3 0 0 0-3-3" />
  </svg>
);

/** Acceso controlado: la pluma de la caseta. */
const Acceso = () => (
  <svg {...props}>
    <path d="M4 20v-9M4 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6.5 9.5 20 7v3L6.5 12.5M4 20h16" />
  </svg>
);

/** Pet zone: la huella. */
const Pet = () => (
  <svg {...props}>
    <path d="M12 20c-2.2 0-3.8-1.4-3.8-3.1 0-1.6 1.4-2.6 3.8-2.6s3.8 1 3.8 2.6c0 1.7-1.6 3.1-3.8 3.1Z" />
    <path d="M7 12.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM17 12.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM10.2 8.4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM13.8 8.4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" />
  </svg>
);

/** Cancha: el rectángulo con la línea de medio campo. */
const Cancha = () => (
  <svg {...props}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="M12 5.5v13" />
    <path d="M12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
  </svg>
);

/** Área de niños: el columpio. */
const Ninos = () => (
  <svg {...props}>
    <path d="M4 5h16M6.5 5l-2 14M17.5 5l2 14M9.5 5v8.5M14.5 5v8.5M8 13.5h8" />
  </svg>
);

/**
 * Mapa CERRADO amenidad → icono, por nombre normalizado (minúsculas, sin
 * acentos). Lo que no está aquí NO recibe icono aproximado.
 */
export const ICONOS: Record<string, () => ReactNode> = {
  'alberca comunitaria': Alberca,
  gimnasio: Gimnasio,
  'salon de eventos': Salon,
  'jardin comunitario': Jardin,
  'seguridad 24h': Seguridad,
  cctv: Cctv,
  'acceso controlado': Acceso,
  'pet zone': Pet,
  cancha: Cancha,
  'area de ninos': Ninos,
};

/**
 * Fallback explícito para una amenidad sin icono propio: un punto, no un
 * pictograma inventado. Se ve que es una viñeta y no afirma nada.
 */
export const IconoNeutro = () => (
  <svg {...props}>
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

/**
 * `\p{M}` en vez del rango literal de diacríticos combinantes: ese rango se
 * escribe con caracteres invisibles en el código fuente, y un `replace` que
 * parece correcto y no hace nada es el fallo que no se ve en revisión.
 */
export const normalizarAmenidad = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();
