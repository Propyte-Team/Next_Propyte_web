import { TituloSeccion, RULE_DARK } from './ui';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Lo que todavía no sabemos. Bloque único.
//
// Antes esto eran ocho chips ámbar repartidos por toda la página. Honestidad
// concentrada se lee como integridad; dispersa se lee como desorganización, y
// ocho advertencias sueltas producen la sensación de que el producto está mal
// documentado en vez de la de que el anunciante es serio.
//
// Ningún gate se suaviza ni desaparece: cambian de sitio. Cada sección que
// antes llevaba su chip ahora enlaza aquí.
//
// La lista se construye desde el estado real de los datos, no a mano. Cuando el
// Hub publique la tasa o la licencia, el punto correspondiente desaparece solo
// y el encabezado cambia de número: no hay que acordarse de editar este
// archivo. Si algún día no queda ninguno, el bloque no se renderiza.
// ============================================================

/** ANCLA canónica. Toda referencia a este bloque usa esta constante. */
export const ANCLA_GATES = 'falta-confirmar';

const NUMERO_PALABRA = ['Cero', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis'];

interface Pendiente {
  titulo: string;
  porQueImporta: string;
}

export default function LoQueFaltaConfirmar({ lote }: { lote: LoteLanding }) {
  const pendientes: Pendiente[] = [];

  // 1 · Etapa. El registro trae fechas de urbanización de UNA etapa y no
  // confirma que sean las de este lote. Es el gate con más consecuencia.
  pendientes.push({
    titulo: 'A qué etapa pertenece este lote',
    porQueImporta:
      'Determina si el plazo de financiamiento es de 48 o de 60 meses, y en qué momento le toca la urbanización. Las fechas que publicamos abajo son de una etapa cuya correspondencia con este lote todavía no está confirmada.',
  });

  // 2 · Tasa. Sin ella no se publica mensualidad, y es la cifra de mayor
  // palanca de la página. El registro escribe "MSI" en la nota de plazos, pero
  // una prosa no es una tasa declarada: publicar 0% por inferencia es
  // exactamente lo que esta página existe para no hacer.
  if (lote.tasaAnual === null) {
    pendientes.push({
      titulo: 'La tasa del financiamiento, por escrito',
      porQueImporta:
        'El desarrollador describe los plazos como meses sin intereses, pero no ha declarado la tasa como dato. Hasta que lo haga no publicamos la mensualidad: preferimos dejar el hueco a que descubras un interés que no anunciamos.',
    });
  }

  // 3 · Apartado. No existe como campo en ninguna tabla; es un hueco real.
  pendientes.push({
    titulo: 'Las condiciones de devolución del apartado',
    porQueImporta:
      'Es la pregunta que más conviene resolver antes de entregar dinero, y la estamos pidiendo por escrito.',
  });

  // 4 · Licencia. Obligación legal explícita, art. 69. Se cita AQUÍ y sólo
  // aquí: antes aparecía duplicada en el bloque jurídico y en el pie legal.
  if (!lote.licencia.completa) {
    pendientes.push({
      titulo: 'Licencia del desarrollo y autorización de venta municipal',
      porQueImporta:
        'Son obligatorias en la publicidad de lotes conforme al artículo 69 de la Ley de Asentamientos Urbanos de Quintana Roo. Las estamos recabando.',
    });
  }

  if (pendientes.length === 0) return null;

  const cuantas = NUMERO_PALABRA[pendientes.length] ?? String(pendientes.length);
  const plural = pendientes.length > 1;

  return (
    <section
      id={ANCLA_GATES}
      aria-labelledby="gates-titulo"
      className="scroll-mt-6 border-t border-[var(--lp-line-dark)] bg-[var(--lp-dark)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <TituloSeccion id="gates-titulo" tono="oscuro">
              {cuantas} cosa{plural && 's'} que todavía no sabemos
            </TituloSeccion>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-white/70">
              Publicamos esto porque la mayoría de los anuncios de esta zona
              simplemente no lo menciona.
            </p>
          </div>

          <div>
            <ol className={`border-t ${RULE_DARK}`}>
              {pendientes.map((p, i) => (
                <li
                  key={p.titulo}
                  className={`grid grid-cols-[2rem_1fr] gap-x-3 border-b ${RULE_DARK} py-5`}
                >
                  <span
                    aria-hidden="true"
                    className="lp-num text-sm text-amber"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="lp-display text-base font-semibold leading-snug tracking-tight text-white">
                      {p.titulo}
                    </h3>
                    <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-white/60">
                      {p.porQueImporta}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-6 max-w-[58ch] text-sm leading-relaxed text-white/70">
              {plural ? 'Las' : 'La'} pedimos por escrito y{' '}
              {plural ? 'las publicamos' : 'la publicamos'} aquí en cuanto{' '}
              {plural ? 'lleguen' : 'llegue'}. Si necesitas alguna antes de avanzar,
              dínoslo y te la mandamos el mismo día en que la tengamos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
