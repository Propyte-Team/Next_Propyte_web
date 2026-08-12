import { Check, Clock, Minus } from '@/lib/icons';

// ============================================================
// Primitivas de la landing.
//
// La referencia anterior era «plano catastral»: radius 0, cero sombras,
// hairlines por todas partes, mono en todo. La intención era autoridad de
// documento. El resultado real, a 8000px de scroll, era una página que se
// leía como wireframe sin terminar: todo pesaba lo mismo y nada respiraba.
//
// La referencia ahora es EDITORIAL: una publicación que argumenta. Titulares
// en serif de texto, cifras en grotesk tabular, y el peso lo hacen la escala y
// el espacio, no las reglas de 1px.
//
// Reglas de la superficie:
//   · un solo acento (terracota) en toda la página. Ver `lp-theme.css`.
//   · radios documentados: controles 6px, medios y bloques 14px. Sin mezclas.
//   · las cifras SIEMPRE tabulares, para que las columnas de dinero cuadren.
//   · los gates no gritan: tinta apagada y subrayado punteado, nunca ámbar.
//   · sombras tintadas al fondo, jamás negro puro.
// ============================================================

/** Hairline sobre claro y sobre oscuro. */
export const RULE_LIGHT = 'border-[var(--lp-line)]';
export const RULE_DARK = 'border-[var(--lp-line-dark)]';

/**
 * Referencia al bloque único de pendientes.
 *
 * Sustituye a los ocho chips ámbar que antes se repartían por seis secciones.
 * El ámbar los hacía leer como errores de validación; concentrados y en tinta
 * apagada leen como lo que son: integridad editorial.
 *
 * Es un ancla real, no un botón: funciona sin JS y el foco aterriza en el
 * bloque, que lleva `scroll-mt`.
 */
export function EnlaceGate({
  que,
  tono = 'claro',
}: {
  que: string;
  tono?: 'claro' | 'oscuro';
}) {
  return (
    <a
      href="#falta-confirmar"
      className={`lp-gate text-sm ${tono === 'oscuro' ? 'lp-gate-dark' : ''}`}
    >
      Falta confirmar: {que}
    </a>
  );
}

/**
 * Fila de campo. Etiqueta a la izquierda, dato a la derecha.
 *
 * Ya no lleva reja completa ni regla vertical entre columnas: eso era lo que
 * producía la lectura de hoja de cálculo. Solo una regla inferior suave, y el
 * dato destacado gana peso por escala y color, no por fondo.
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
      className={`grid grid-cols-[minmax(7rem,0.7fr)_1.3fr] items-baseline gap-4 border-b py-4 ${
        oscuro ? RULE_DARK : RULE_LIGHT
      }`}
    >
      <dt
        className={`text-[0.6875rem] uppercase tracking-[0.1em] ${
          oscuro ? 'text-[var(--lp-on-dark-soft)]' : 'text-[var(--lp-muted)]'
        }`}
      >
        {etiqueta}
      </dt>
      <dd
        className={`lp-num ${
          destacado
            ? 'lp-display text-xl sm:text-2xl'
            : 'text-sm sm:text-[0.9375rem]'
        } ${
          oscuro
            ? destacado
              ? 'text-[var(--lp-accent-on-dark)]'
              : 'text-[var(--lp-on-dark)]'
            : destacado
              ? 'text-[var(--lp-accent)]'
              : 'text-[var(--lp-ink-soft)]'
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

/** Contenedor del bloque de campos. Solo abre con una regla marcada arriba. */
export function BloqueCampos({
  children,
  tono = 'claro',
}: {
  children: React.ReactNode;
  tono?: 'claro' | 'oscuro';
}) {
  return (
    <dl
      className={`border-t-2 ${
        tono === 'oscuro'
          ? 'border-[var(--lp-accent-on-dark)]'
          : 'border-[var(--lp-accent)]'
      }`}
    >
      {children}
    </dl>
  );
}

type Estado = 'disponible' | 'en_proceso' | 'proyectado';

const ESTADO_META: Record<Estado, { etiqueta: string; Icono: typeof Check; clase: string }> = {
  disponible: { etiqueta: 'Disponible', Icono: Check, clase: 'text-[#3F8F5C]' },
  en_proceso: { etiqueta: 'En proceso', Icono: Clock, clase: 'text-[var(--lp-accent-on-dark)]' },
  proyectado: { etiqueta: 'Proyectado', Icono: Minus, clase: 'text-[var(--lp-on-dark-soft)]' },
};

/**
 * Estado de un servicio. El icono acompaña al texto: el color nunca es el único
 * indicador, porque quien no distingue verde de terracota también necesita saberlo.
 */
export function EstadoServicio({ estado }: { estado: Estado }) {
  const { etiqueta, Icono, clase } = ESTADO_META[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${clase}`}>
      <Icono className="size-3.5 shrink-0" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

/**
 * Encabezado de sección, en serif de texto.
 *
 * Sin kicker en versalitas: repetir una etiqueta diminuta sobre cada título es
 * andamiaje, no voz, y a lo largo de la página producía un ritmo de plantilla.
 * La jerarquía la hacen la escala y el aire.
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
      className={`lp-display text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] leading-[1.12] text-balance ${
        tono === 'oscuro' ? 'text-[var(--lp-on-dark)]' : 'text-[var(--lp-ink)]'
      }`}
    >
      {children}
    </h2>
  );
}

/**
 * CTA primario. Terracota sólido, texto blanco: 6.1:1, AA holgado.
 * El `active:translate-y` es el único gesto físico de la página.
 */
export function BotonPrimario({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[52px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[var(--lp-r-control)] bg-[var(--lp-accent)] px-7 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--lp-accent-strong)] active:translate-y-px"
    >
      {children}
    </a>
  );
}
