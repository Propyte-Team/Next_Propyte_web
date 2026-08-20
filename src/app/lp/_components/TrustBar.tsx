import { ClipboardCheck, Eye, MapPin, Users } from '@/lib/icons';
import { ANCLA_PRUEBA } from './PruebaDeQueExistimos';
import { ANCLA_URBANIZACION } from './UrbanizacionReal';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Barra de credibilidad.
//
// EL PROBLEMA QUE RESUELVE. La única prueba de confianza de la página («Cómo
// compruebas que existimos») vivía al 90% del scroll. La tensión de decisión,
// en cambio, ocurre en el primer CTA: quien duda de que la comercializadora
// exista no llega al 90%, se va en el 15%.
//
// ES UN RESUMEN ENLAZADO, NO UN REEMPLAZO. Las cuatro celdas son cuatro
// promesas de una línea, cada una con destino a donde vive la evidencia
// completa. El bloque del final se queda intacto: aquí no se argumenta, aquí
// se declara que hay algo que se puede ir a verificar.
//
// SIN STOCK Y SIN RETRATOS. La barra no nombra a un asesor concreto: quien
// atiende un lead depende de la asignación, así que poner una cara aquí
// promete una persona que puede no ser la que conteste. La celda lleva al
// equipo comercial completo. Las cuatro celdas usan un icono de línea del
// vocabulario de la página, no una ilustración.
//
// LAS CELDAS SON EL ENLACE COMPLETO, no un «leer más» de 12px al final: en
// 390px el objetivo táctil es la tarjeta entera.
//
// La oficina viene del Hub y puede faltar. Cuando falta, la celda no se
// renderiza vacía: desaparece, y la reja se recompone al número real de
// celdas. Una fila de cuatro con un hueco es peor que una fila de tres.
// ============================================================

/** Rejas por número de celdas. Tailwind no admite clases compuestas en runtime. */
const REJA: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

export default function TrustBar({ lote }: { lote: LoteLanding }) {
  const { oficina } = lote;

  const celdas = [
    oficina && {
      clave: 'oficina',
      href: `#${ANCLA_PRUEBA}`,
      etiqueta: 'Oficina física',
      Icono: MapPin,
      cuerpo: oficina.direccion,
      pie: 'Ven a revisar los documentos en papel.',
    },
    {
      clave: 'equipo',
      href: '/es/nosotros/equipo-comercial',
      externo: true,
      etiqueta: 'Quién te atiende',
      Icono: Users,
      cuerpo: 'Conoce al equipo completo',
      pie: 'Nombre, cargo y cara de cada asesor comercial.',
    },
    {
      clave: 'metodologia',
      href: '/es/metodologia',
      externo: true,
      etiqueta: 'Cinco criterios',
      Icono: ClipboardCheck,
      cuerpo: 'Documentados antes de publicar',
      pie: 'La misma revisión para toda propiedad que listamos.',
    },
    {
      clave: 'campo',
      href: `#${ANCLA_URBANIZACION}`,
      etiqueta: 'Verificado en campo',
      Icono: Eye,
      cuerpo: 'Fuimos al terreno',
      pie: 'El estado de urbanización no se copia del brochure.',
    },
  ].filter((c) => c !== null);

  if (celdas.length === 0) return null;

  return (
    <section
      aria-label="Cómo puedes verificar quiénes somos"
      className="border-b border-[var(--lp-line)] bg-[var(--lp-paper-2)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
        <div
          className={`grid gap-px border-t-2 border-[var(--lp-accent)] bg-[var(--lp-line)] ${
            REJA[celdas.length] ?? REJA[4]
          }`}
        >
          {celdas.map((c) => {
            const Icono = 'Icono' in c ? c.Icono : null;

            return (
              <a
                key={c.clave}
                href={c.href}
                {...('externo' in c && c.externo
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="group flex flex-col gap-2 bg-[var(--lp-paper)] p-4 transition-colors duration-200 hover:bg-[var(--lp-paper-2)] sm:p-5"
              >
                <div className="flex items-center gap-2">
                  {Icono && (
                    <Icono
                      className="size-3.5 shrink-0 text-[var(--lp-accent)]"
                      aria-hidden="true"
                    />
                  )}
                  {/* `span` y no `h3`, por dos razones. La semántica: el
                      encabezado de la celda es el cuerpo, no esta etiqueta, y
                      un heading dentro de un enlace no aporta nada al lector
                      de pantalla que ya recibe la celda entera como un solo
                      destino. Y la práctica: `globals.css` declara
                      `:where(h1…h6)` FUERA de toda capa de cascada, así que
                      gana a cualquier utility de Tailwind —que sí vive en
                      `@layer utilities`— sin importar la especificidad. Un
                      `h3` aquí saldría a 22px en Inter, ignorando la clase. */}
                  <span className="block text-[0.625rem] uppercase tracking-[0.12em] text-[var(--lp-muted)]">
                    {c.etiqueta}
                  </span>
                </div>

                <p className="text-sm font-medium leading-snug text-[var(--lp-ink)] underline decoration-[var(--lp-line)] decoration-dotted underline-offset-4 transition-colors duration-200 group-hover:decoration-[var(--lp-accent)]">
                  {c.cuerpo}
                </p>
                <p className="text-xs leading-relaxed text-[var(--lp-muted)]">{c.pie}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
