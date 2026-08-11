import type { Metadata } from 'next';
import Image from 'next/image';
import { getLotePlayaDelCarmen } from '@/lib/supabase/lp-lotes';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import FichaLote from '../_components/FichaLote';
import UrbanizacionReal from '../_components/UrbanizacionReal';
import CostosNoIncluidos from '../_components/CostosNoIncluidos';
import LicenciaDesarrollo from '../_components/LicenciaDesarrollo';
import LeadFormLotes from '../_components/LeadFormLotes';
import StickyCta from '../_components/StickyCta';
import QueEstasComprando from '../_components/QueEstasComprando';
import PlanDePagos from '../_components/PlanDePagos';
import PruebaDeQueExistimos from '../_components/PruebaDeQueExistimos';
import WhatsAppCta from '../_components/WhatsAppCta';
import { Gate, TituloSeccion, RULE_DARK } from '../_components/ui';
import { mxn, mxnExacto, m2, fechaLarga } from '../_components/format';

// ISR: el inventario cambia sin deploy. 5 min es suficientemente fresco para que
// un anuncio no cite un precio que la página ya no muestra, y evita pegarle a
// Supabase en cada impresión pagada.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Lote residencial en privada · Playa del Carmen',
  description:
    'Lote residencial en privada sobre Av. Universidades, Playa del Carmen. Enganche, mensualidades y el estatus real de urbanización, servicio por servicio.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default async function LandingLotesPlayaDelCarmen() {
  const lote = await getLotePlayaDelCarmen();

  // Inventario de una unidad: que se venda o se aparte es un escenario probable,
  // no un caso borde. La página lo trata como estado, no como error.
  if (!lote) {
    return (
      <div className="bg-aztec">
        <div className="mx-auto max-w-2xl px-5 py-24">
          <h1 className="font-display text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
            Este lote ya no está disponible
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-white/70">
            El lote que anunciábamos en esta página salió del inventario. No vamos a
            mostrarte otro como si fuera el mismo. Si quieres, te avisamos cuando
            entre inventario comparable en Playa del Carmen, con sus números
            completos.
          </p>
          <div className="mt-8">
            <WhatsAppCta
              loteSlug="agotado"
              telefono={FALLBACK_WHATSAPP}
              mensaje="Hola, vi que el lote de Playa del Carmen ya no está disponible. Quiero que me avisen cuando entre inventario comparable."
              surface="lp-lotes-pdc-agotado"
            />
          </div>
        </div>
      </div>
    );
  }

  const corte = fechaLarga(lote.fechaCorte);
  const plan = lote.plan;
  const plazoMax = plan?.opciones.at(-1) ?? null;

  const mensajeWa = [
    `Hola, me interesa el lote residencial en privada de Playa del Carmen (ref. ${lote.slug}).`,
    lote.superficieM2 && lote.precioMxn
      ? `Son ${m2(lote.superficieM2)} en ${mxn(lote.precioMxn)} MXN.`
      : null,
    plazoMax
      ? `Quiero confirmar el plan a ${plazoMax.meses} meses y qué falta por urbanizar.`
      : 'Quiero el detalle del plan de pagos y qué falta por urbanizar.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* ═══════════ 1 · Hero ═══════════
          Fondo aztec drenado: es lo que hace legible el cian de marca, que sobre
          blanco es inusable. La foto va a sangre por la derecha, sin radio. */}
      <section className="bg-aztec">
        <div className="mx-auto max-w-6xl px-5 pt-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-16">
          <div className="lg:pb-16">
            {/* Escasez verificable, no fabricada: el inventario es de una unidad. */}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-aqua-bright">
                Uno disponible
              </p>
              {corte && (
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-white/40">
                  Al {corte}
                </p>
              )}
            </div>

            <h1 className="mt-5 max-w-[24ch] font-display text-[clamp(2rem,1.4rem+3.2vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-white">
              {plan?.sinIntereses ? (
                <>
                  Un lote en privada en Playa del Carmen, con {plan.enganchePct}% de
                  enganche y sin intereses
                </>
              ) : (
                <>Un lote en privada en Playa del Carmen, a 4.2 km de la playa</>
              )}
            </h1>

            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-white/70">
              {lote.superficieM2 ? m2(lote.superficieM2) : 'Superficie por confirmar'}{' '}
              sobre Av. Universidades, dentro de una privada
              {lote.lotesTotalesPrivada && <> de {lote.lotesTotalesPrivada} lotes</>} con
              alberca, casa club, gimnasio, canchas y vigilancia 24 horas. El
              financiamiento es directo con el desarrollador
              {plan?.sinIntereses && <> y no cobra intereses</>}
              {plazoMax && <>: hasta {plazoMax.meses} meses</>}.
            </p>

            {/* Tira de pago. Orden deliberado: primero lo que cuesta entrar, luego
                lo que se paga cada mes, y sólo después el precio total. */}
            <dl
              className={`mt-9 grid grid-cols-2 border-y ${RULE_DARK} divide-x divide-aqua-bright/20 sm:grid-cols-4`}
            >
              {[
                {
                  k: 'Enganche',
                  v: plan ? mxn(plan.engancheMxn) : null,
                  destacado: true,
                },
                {
                  k: plazoMax ? `Al mes · ${plazoMax.meses} meses` : 'Al mes',
                  v: plazoMax ? mxn(plazoMax.mensualidadMxn) : null,
                  destacado: true,
                },
                { k: 'Precio total', v: lote.precioMxn ? mxn(lote.precioMxn) : null },
                { k: 'Por m²', v: lote.precioM2Mxn ? mxnExacto(lote.precioM2Mxn) : null },
              ].map((c) => (
                <div key={c.k} className="px-3 py-4 sm:px-4">
                  <dt className="text-[0.625rem] uppercase tracking-[0.1em] text-white/40">
                    {c.k}
                  </dt>
                  <dd
                    className={`mt-1.5 font-mono text-[0.9375rem] tabular-nums sm:text-lg ${
                      c.destacado ? 'text-aqua-bright' : 'text-white'
                    }`}
                  >
                    {c.v ?? <span className="text-white/30">sin dato</span>}
                  </dd>
                </div>
              ))}
            </dl>

            {/* La contraentrega no es letra chica: es parte del número de arriba. */}
            {plan && (
              <p className="mt-3 max-w-[52ch] text-xs leading-relaxed text-white/45">
                Más un pago final de {mxn(plan.contraentregaMxn)} contra entrega, que
                es el {plan.contraentregaPct}% del precio. Te mandamos la tabla de
                amortización completa por escrito.
              </p>
            )}

            {/* CTA doble, mismo peso visual. WhatsApp co-primario. */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#solicitar"
                className="inline-flex min-h-[52px] cursor-pointer items-center justify-center bg-teal px-6 text-sm font-semibold text-aztec transition-colors duration-200 hover:bg-teal-dark"
              >
                {plan ? 'Ver mi plan de pagos' : 'Pedir el detalle del lote'}
              </a>
              <WhatsAppCta
                loteSlug={lote.slug}
                telefono={FALLBACK_WHATSAPP}
                mensaje={mensajeWa}
                surface="lp-lotes-pdc-hero"
              />
            </div>

            {/* Honestidad en una línea, DESPUÉS del valor. El detalle vive abajo.
                No se suaviza la objeción, se recoloca: como cierre del bloque de
                respuesta directa era la última cosa que el visitante leía antes
                de decidir irse. */}
            <p className="mt-7 max-w-[52ch] text-sm leading-relaxed text-white/55">
              Hoy el lote no tiene servicios conectados y no es escriturable. Abajo
              está el detalle servicio por servicio, con las fechas que declara el
              desarrollador y lo que todavía no podemos confirmar.
            </p>
          </div>

          {lote.imagenPortada && (
            <div className="relative mt-10 h-[42vw] min-h-[240px] lg:mt-0 lg:h-auto lg:min-h-[560px]">
              <Image
                src={lote.imagenPortada}
                alt="Vista aérea del polígono de la privada residencial sobre Av. Universidades, Playa del Carmen"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ 2 · Respuesta directa ═══════════ */}
      <section className="border-b border-navy/12 bg-gray-light">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
          <p className="max-w-[58ch] font-display text-[clamp(1.0625rem,1rem+0.4vw,1.375rem)] leading-[1.5] text-navy">
            En Playa del Carmen tenemos un lote residencial disponible de{' '}
            {lote.superficieM2 ? m2(lote.superficieM2) : 'superficie por confirmar'} en{' '}
            {lote.precioMxn ? `${mxn(lote.precioMxn)} MXN` : 'precio por confirmar'}
            {lote.precioM2Mxn && <>, es decir {mxnExacto(lote.precioM2Mxn)} por metro cuadrado</>}
            . Está en preventa dentro de una privada sobre Av. Universidades, a 4.2 km
            de la playa, con financiamiento directo del desarrollador
            {plan?.sinIntereses && <> y sin intereses</>}: {plan ? `${plan.enganchePct}%` : 'enganche'}{' '}
            de enganche
            {plazoMax && <> y hasta {plazoMax.meses} meses</>}. Es propiedad privada, no
            terreno ejidal.
          </p>
        </div>
      </section>

      {/* ═══════════ 3-4 · Promesa y plan, con el formulario al lado ═══════════
          El formulario vive aquí y no al final: en móvil aparece justo después del
          plan de pagos, a dos pantallas del hero. */}
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
          <div className="flex flex-col gap-16">
            <QueEstasComprando lote={lote} />
            <PlanDePagos lote={lote} />
          </div>

          <aside id="solicitar" className="lg:sticky lg:top-6">
            <LeadFormLotes
              loteNombre={lote.titulo}
              plazoMeses={plazoMax?.meses ?? null}
            />
            <p className="mt-5 max-w-[46ch] text-xs leading-relaxed text-graphite/70">
              Si por presupuesto u objetivo no encaja, te lo decimos en el primer
              mensaje.
            </p>
          </aside>
        </div>

        {/* ═══════════ 5 · Ficha ═══════════ */}
        <div className="mt-16 lg:mt-20 lg:max-w-3xl">
          <FichaLote lote={lote} />
        </div>
      </div>

      {/* ═══════════ 6 · Urbanización ═══════════ */}
      <UrbanizacionReal lote={lote} />

      {/* ═══════════ 7 · Situación jurídica ═══════════ */}
      <section aria-labelledby="juridico-titulo" className="border-t border-aqua-bright/15 bg-aztec">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <TituloSeccion id="juridico-titulo" tono="oscuro">
              Situación jurídica, sin adjetivos
            </TituloSeccion>

            <div className="flex flex-col gap-8">
              <dl className="flex flex-col gap-6">
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
                    Régimen
                  </dt>
                  <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
                    {lote.regimenPropiedad ?? <Gate que="régimen de propiedad" tono="oscuro" />}.
                    Opera con reglamento de construcción y comité de arquitectura que
                    revisa cada proyecto antes de iniciar obra.
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
                    Uso de suelo
                  </dt>
                  <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
                    <span className="font-mono">{lote.usoSuelo ?? 'por confirmar'}</span>,
                    con COS 0.55 y CUS 1.60 según la ficha técnica del desarrollador.
                    Definen cuánto puedes ocupar en planta y cuánto construir en total.
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
                    Escrituración
                  </dt>
                  <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
                    Proyectada a finales de 2026 según el desarrollador. Hoy el título
                    está en fideicomiso, así que el lote no es escriturable. No usamos
                    la expresión &laquo;certeza jurídica absoluta&raquo;: ninguna
                    comercializadora puede sostenerla.
                  </dd>
                </div>
                {lote.rentasCortoPlazoPermitidas !== null && (
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
                      Renta de corto plazo
                    </dt>
                    <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
                      {lote.rentasCortoPlazoPermitidas
                        ? 'Permitida conforme a los estatutos de la privada, una vez que exista construcción. Un terreno sin construir no genera renta.'
                        : 'No permitida conforme a los estatutos de la privada.'}
                    </dd>
                  </div>
                )}
              </dl>

              <LicenciaDesarrollo licencia={lote.licencia} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 8-11 · Costos, filtro, prueba y FAQ ═══════════ */}
      <div className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <div className="flex flex-col gap-16">
          <CostosNoIncluidos lote={lote} />

          {/* ───── 9 · Para quién no es ─────
              Baja hasta aquí desde la primera posición. El texto va íntegro: no
              se acorta ni se suaviza, sólo se coloca después de que exista una
              razón para seguir leyendo. */}
          <section aria-labelledby="filtro-titulo">
            <TituloSeccion id="filtro-titulo">Para quién no es este producto</TituloSeccion>
            <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-graphite">
              <p>
                Comprar el terreno y poder construir no ocurren el mismo día. La
                escrituración está proyectada para finales de 2026 según el
                desarrollador, y hoy el título está en fideicomiso: el lote no es
                escriturable en este momento. La construcción depende de que se
                entreguen servicios y vialidades, proyectados hacia el último
                trimestre de 2027.
              </p>
              <p>
                Si necesitas mudarte pronto, este no es tu producto y es mejor decirlo
                ahora. Si esperas rendimiento por renta desde el primer día, un
                terreno no lo da: lo da lo que construyas encima.
              </p>
              <p>
                Y si tu presupuesto total no alcanza el precio del lote más los gastos
                de escrituración{' '}
                {lote.costos?.cierrePctMin && lote.costos?.cierrePctMax ? (
                  <span className="font-mono text-sm tabular-nums">
                    ({lote.costos.cierrePctMin}% a {lote.costos.cierrePctMax}% adicional)
                  </span>
                ) : (
                  <Gate que="% de gastos de cierre" />
                )}{' '}
                más los cargos únicos que listamos arriba, conviene esperar en lugar de
                estirarte.
              </p>
            </div>
          </section>

          <PruebaDeQueExistimos lote={lote} />

          {/* ───── 11 · FAQ ───── */}
          <section aria-labelledby="faq-titulo">
            <TituloSeccion id="faq-titulo">Preguntas que sí importan</TituloSeccion>
            <dl className="mt-6 border-t border-navy/12">
              {[
                {
                  q: '¿Es terreno ejidal o propiedad privada, y cómo lo compruebo?',
                  a: (
                    <>
                      Es propiedad privada bajo{' '}
                      {lote.regimenPropiedad?.toLowerCase() ?? 'régimen por confirmar'}, no
                      terreno ejidal. Se comprueba con el antecedente de propiedad y el
                      certificado de libertad de gravamen, más la licencia del desarrollo
                      y la autorización de venta municipal. Pídenos los cuatro: si alguno
                      no existe todavía, te lo decimos en lugar de darte largas.
                    </>
                  ),
                },
                {
                  q: '¿Qué significa que la escrituración esté proyectada?',
                  a: (
                    <>
                      Que hoy no puedes escriturar. El título está en fideicomiso y el
                      desarrollador declara finales de 2026 como fecha objetivo. Mientras
                      tanto lo que firmas es un contrato de compraventa con calendario de
                      pagos. Es una fecha declarada, no una garantía contractual, y
                      conviene que quede por escrito en tu contrato.
                    </>
                  ),
                },
                {
                  q: '¿Puedo comprar siendo extranjero?',
                  a: (
                    <>
                      Sí. Playa del Carmen está en zona restringida constitucional, así que
                      la compra se hace mediante fideicomiso bancario, presentando tu
                      identificación fiscal del país donde tributas. El costo del
                      fideicomiso es anual y se suma a los gastos de cierre.
                    </>
                  ),
                },
                {
                  q: '¿Qué servicios tiene el lote hoy y qué falta?',
                  a: lote.ningunServicioHoy ? (
                    <>
                      Hoy no hay ningún servicio conectado. Agua potable, drenaje,
                      electricidad y alumbrado están proyectados, y la vialidad después de
                      ellos. Arriba está el detalle con las fechas que declara el
                      desarrollador y la advertencia de que falta confirmar la etapa exacta
                      de este lote.
                    </>
                  ) : (
                    <>
                      El detalle servicio por servicio, con su estado y fecha estimada,
                      está en la sección de urbanización.
                    </>
                  ),
                },
              ].map((item) => (
                <div key={item.q} className="border-b border-navy/12 py-5">
                  <dt className="font-display text-base font-semibold leading-snug tracking-tight text-navy">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-graphite">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {/* ═══════════ 12 · Cierre ═══════════
          Un solo formulario en la página, arriba. Aquí sólo el ancla de vuelta,
          para no duplicar componente ni eventos de medición. */}
      <section className="bg-aztec">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="max-w-[46ch] font-display text-[clamp(1.25rem,1.1rem+0.8vw,1.75rem)] font-semibold leading-tight tracking-[-0.02em] text-balance text-white">
            {plan
              ? `Te mandamos tu tabla de amortización, el plano con la ubicación del lote y el paquete documental.`
              : 'Te mandamos el detalle completo del lote y el paquete documental.'}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#solicitar"
              className="inline-flex min-h-[52px] cursor-pointer items-center justify-center bg-teal px-6 text-sm font-semibold text-aztec transition-colors duration-200 hover:bg-teal-dark"
            >
              {plan ? 'Ver mi plan de pagos' : 'Pedir el detalle del lote'}
            </a>
            <WhatsAppCta
              loteSlug={lote.slug}
              telefono={FALLBACK_WHATSAPP}
              mensaje={mensajeWa}
              surface="lp-lotes-pdc-cierre"
            />
          </div>
        </div>
      </section>

      {/* ═══════════ 13 · Pie legal ═══════════ */}
      <footer className="border-t border-aqua-bright/15 bg-aztec">
        <div className="mx-auto max-w-6xl px-5 py-10 pb-24 lg:pb-10">
          <div className="flex max-w-[80ch] flex-col gap-3 text-xs leading-relaxed text-white/50">
            <p>
              Precios en pesos mexicanos, vigentes a la fecha de corte indicada y
              sujetos a cambio y disponibilidad sin previo aviso. Las fechas de
              urbanización y escrituración son declaradas por el desarrollador y no
              constituyen garantía. Este anuncio no publica proyecciones de plusvalía
              ni de rendimiento.
            </p>
            {/* Condicional a propósito: si la licencia no está completa, afirmar
                que los datos "se indican" sería exactamente el tipo de declaración
                falsa que el artículo 69 pretende evitar. */}
            {lote.licencia.completa ? (
              <p>
                Publicidad de lotes conforme al artículo 69 de la Ley de Asentamientos
                Urbanos de Quintana Roo: los datos de licencia y autorización de venta
                municipal se indican en la sección de situación jurídica de esta
                página.
              </p>
            ) : (
              <p>
                El artículo 69 de la Ley de Asentamientos Urbanos de Quintana Roo
                obliga a citar la licencia del desarrollo y la autorización de venta
                municipal en la publicidad de lotes. Todavía no tenemos esos cuatro
                datos por escrito del desarrollador, así que lo decimos aquí en lugar
                de omitirlo. Si los necesitas antes de avanzar, pídelos.
              </p>
            )}
            <p>
              <a
                href="/es/privacidad"
                className="underline decoration-white/30 transition-colors duration-200 hover:text-white/80"
              >
                Aviso de privacidad
              </a>
            </p>
          </div>
        </div>
      </footer>

      <StickyCta
        loteSlug={lote.slug}
        telefono={FALLBACK_WHATSAPP}
        mensualidad={plazoMax ? mxn(plazoMax.mensualidadMxn) : null}
        mensaje={mensajeWa}
      />
    </>
  );
}
