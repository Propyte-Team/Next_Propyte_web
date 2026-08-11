import { AlertTriangle, Check, Clock, Minus } from '@/lib/icons';

// ============================================================
// Primitivas de la landing.
//
// Referencia visual: la autoridad de un plano catastral / certificado de
// registro. Bloque de título, campos reglados, leyenda con estados explícitos,
// sello de licencia. NO brochure, NO revista, NO terminal de desarrollador.
//
// Reglas de la superficie:
//   · radius 0 y cero sombras. La estructura la hacen las reglas de 1px.
//   · nada de tarjetas: bloques reglados que comparten el grid de la página.
//   · el cian de marca (#A2F9FF) SOLO sobre fondo oscuro. Es el activo de
//     identidad más distintivo y es ilegible sobre blanco.
//   · el ámbar es exclusivamente semántico: marca lo que no sabemos. Nunca
//     decoración.
//   · cifras en mono con tabular-nums, para que las columnas cuadren.
// ============================================================

/** Hairline sobre oscuro y sobre claro. */
export const RULE_DARK = 'border-aqua-bright/20';
export const RULE_LIGHT = 'border-navy/12';

/**
 * Gate abierto: dato que no publicamos porque no lo tenemos por escrito.
 * Es el centro moral de la página, así que se ve, no se esconde.
 */
export function Gate({ que, tono = 'claro' }: { que: string; tono?: 'claro' | 'oscuro' }) {
  return (
    <span
      role="note"
      className={`inline-flex items-baseline gap-1.5 border px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-wide ${
        tono === 'oscuro'
          ? 'border-amber/50 bg-amber/10 text-amber'
          : 'border-amber/60 bg-amber/8 text-[#7A4E00]'
      }`}
    >
      <AlertTriangle className="size-3 shrink-0 translate-y-px" aria-hidden="true" />
      Falta confirmar: {que}
    </span>
  );
}

/**
 * Fila de campo del bloque de especificaciones. Etiqueta a la izquierda en
 * versalitas, dato a la derecha en mono. La regla vertical entre columnas es
 * lo que le da la lectura de documento y no de tarjeta.
 */
export function Campo({
  etiqueta,
  children,
  destacado = false,
  tono = 'claro',
}: {
  etiqueta: string;
  children: React.ReactNode;
  /** Marca el dato que ningún competidor publica. */
  destacado?: boolean;
  tono?: 'claro' | 'oscuro';
}) {
  const oscuro = tono === 'oscuro';
  return (
    <div
      className={`grid grid-cols-[minmax(7.5rem,0.8fr)_1.2fr] border-t ${
        oscuro ? RULE_DARK : RULE_LIGHT
      } ${destacado ? (oscuro ? 'bg-aqua-bright/[0.04]' : 'bg-navy/[0.03]') : ''}`}
    >
      <dt
        className={`border-r px-3 py-3 text-[0.6875rem] uppercase tracking-[0.08em] sm:px-4 ${
          oscuro ? `${RULE_DARK} text-white/45` : `${RULE_LIGHT} text-navy/50`
        }`}
      >
        {etiqueta}
      </dt>
      <dd
        className={`px-3 py-3 font-mono text-sm tabular-nums sm:px-4 ${
          oscuro
            ? destacado
              ? 'text-aqua-bright'
              : 'text-white/85'
            : destacado
              ? 'font-medium text-navy'
              : 'text-graphite'
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

/** Contenedor del bloque de campos: cierra la reja por abajo y por los lados. */
export function BloqueCampos({
  children,
  tono = 'claro',
}: {
  children: React.ReactNode;
  tono?: 'claro' | 'oscuro';
}) {
  return (
    <dl
      className={`border-x border-b ${tono === 'oscuro' ? RULE_DARK : RULE_LIGHT}`}
    >
      {children}
    </dl>
  );
}

type Estado = 'disponible' | 'en_proceso' | 'proyectado';

const ESTADO_META: Record<Estado, { etiqueta: string; Icono: typeof Check; clase: string }> = {
  disponible: { etiqueta: 'Disponible', Icono: Check, clase: 'text-success' },
  en_proceso: { etiqueta: 'En proceso', Icono: Clock, clase: 'text-amber' },
  proyectado: { etiqueta: 'Proyectado', Icono: Minus, clase: 'text-white/40' },
};

/**
 * Estado de un servicio. El icono acompaña al texto: el color nunca es el único
 * indicador, porque quien no distingue verde de ámbar también necesita saberlo.
 */
export function EstadoServicio({ estado }: { estado: Estado }) {
  const { etiqueta, Icono, clase } = ESTADO_META[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 ${clase}`}>
      <Icono className="size-3.5 shrink-0" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

/**
 * Encabezado de sección. Sin kicker en versalitas: repetir una etiqueta
 * diminuta sobre cada título es andamiaje, no voz. La jerarquía la hace la
 * escala y la regla superior.
 */
export function TituloSeccion({
  children,
  id,
  tono = 'claro',
}: {
  children: React.ReactNode;
  id: string;
  tono?: 'claro' | 'oscuro';
}) {
  return (
    <h2
      id={id}
      className={`font-display text-[clamp(1.5rem,1.1rem+1.6vw,2.125rem)] font-semibold leading-[1.15] tracking-[-0.02em] ${
        tono === 'oscuro' ? 'text-white' : 'text-navy'
      }`}
    >
      {children}
    </h2>
  );
}
