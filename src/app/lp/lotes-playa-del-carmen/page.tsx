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
import UnDomingoAqui from '../_components/UnDomingoAqui';
import LoQueFaltaConfirmar from '../_components/LoQueFaltaConfirmar';
import { EnlaceGate, TituloSeccion, RULE_DARK } from '../_components/ui';
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
  const apr = lote.aprovechamiento;
  // Imagen curada; `imagenPortada` queda como respaldo si la galería del
  // desarrollo cambia y el archivo de la lista blanca deja de existir.
  const heroImg =
    lote.imagenes.hero ??
    (lote.imagenPortada
      ? {
          url: lote.imagenPortada,
          alt: 'Vista aérea de la privada residencial sobre Av. Universidades, Playa del Carmen',
        }
      : null);

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

            {/* H1. El anterior describía una categoría («un lote en privada»);
                este nombra la consecuencia. No es una promesa: «puedes construir
                una casa de dos niveles» es aritmética de COS y CUS que cualquiera
                puede verificar, y el dato que la sostiene está justo debajo. Es
                simultáneamente lo más duro y lo más emocional de la página. */}
            <h1 className="mt-5 max-w-[24ch] font-display text-[clamp(2rem,1.4rem+3.2vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-white">
              {apr ? (
                <>
                  Aquí puedes construir una casa de{' '}
                  {apr.niveles === 2 ? 'dos' : apr.niveles} niveles, a 4.2 km de la
                  playa
                </>
              ) : (
                <>Un lote en privada en Playa del Carmen, a 4.2 km de la playa</>
              )}
            </h1>

            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-white/70">
              {lote.superficieM2 ? m2(lote.superficieM2) : 'Superficie por confirmar'}{' '}
              dentro de una privada
              {lote.lotesTotalesPrivada && <> de {lote.lotesTotalesPrivada} lotes</>} en
              Playa del Carmen.
              {apr && (
                <>
                  {' '}
                  El uso de suelo permite hasta {m2(apr.construibleM2)} construidos:
                  tres recámaras, no dos.
                </>
              )}{' '}
              El financiamiento es directo con el desarrollador
              {plan?.sinIntereses && (
                <>
                  , <strong className="font-semibold text-white">sin intereses</strong>
                </>
              )}
              {lote.enganchePct && <>, con {lote.enganchePct}% de enganche</>}.
            </p>

            {/* Tira de pago. Orden deliberado: primero lo que cuesta entrar, luego
                lo que se paga cada mes, después lo construible y sólo al final el
                precio total.

                La tercera celda es la que cambia la percepción del precio: el
                total sobre la superficie del lote se lee caro; sobre los metros
                construibles se lee distinto. Mismo número, marco distinto, cero
                engaño — el precio total sigue en la tira, no se esconde.

                El enganche ya NO se lee de `plan`: se lee de `lote.engancheMxn`,
                que no depende de la tasa. Antes esta celda decía «sin dato»
                mientras la ficha, cuatro bloques abajo, publicaba la cifra. */}
            <dl
              className={`mt-9 grid grid-cols-2 border-y ${RULE_DARK} divide-x divide-aqua-bright/20 sm:grid-cols-4`}
            >
              {[
                {
                  k: 'Enganche',
                  v: lote.engancheMxn !== null ? mxn(lote.engancheMxn) : null,
                  destacado: true,
                },
                {
                  k: plazoMax ? `Al mes · ${plazoMax.meses} meses` : 'Al mes',
                  v: plazoMax ? mxn(plazoMax.mensualidadMxn) : null,
                  destacado: true,
                },
                {
                  k: 'Construible',
                  v: apr ? m2(apr.construibleM2) : null,
                  destacado: false,
                },
                { k: 'Precio total', v: lote.precioMxn ? mxn(lote.precioMxn) : null },
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
                    {c.v ?? (
                      <a
                        href="#falta-confirmar"
                        className="text-amber/90 underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-amber"
                      >
                        falta confirmar
                      </a>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* La contraentrega no es letra chica: es parte del número de arriba. */}
            {plan ? (
              <p className="mt-3 max-w-[52ch] text-xs leading-relaxed text-white/45">
                Más un pago final de {mxn(plan.contraentregaMxn)} contra entrega, que
                es el {plan.contraentregaPct}% del precio. Te mandamos la tabla de
                amortización completa por escrito.
              </p>
            ) : (
              <p className="mt-3 max-w-[52ch] text-xs leading-relaxed text-white/45">
                El precio por metro cuadrado es{' '}
                {lote.precioM2Mxn ? mxnExacto(lote.precioM2Mxn) : 'por confirmar'}. La
                mensualidad la publicamos en cuanto el desarrollador declare la tasa
                por escrito.
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

          {heroImg && (
            <div className="relative mt-10 h-[42vw] min-h-[240px] lg:mt-0 lg:h-auto lg:min-h-[560px]">
              <Image
                src={heroImg.url}
                alt={heroImg.alt}
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
            {plan?.sinIntereses && <> y sin intereses</>}
            {/* B-2: cuando `plan` era null esto interpolaba la palabra «enganche»
                y luego la repetía, produciendo «enganche de enganche» en vivo.
                El porcentaje no depende del plan: vive en `lote.enganchePct`. */}
            {lote.enganchePct && <>: {lote.enganchePct}% de enganche</>}
            {plazoMax && <> y hasta {plazoMax.meses} meses</>}. Es propiedad privada, no
            terreno ejidal.
          </p>
        </div>
      </section>

      {/* ═══════════ 2.5 · Un domingo aquí ═══════════
          Va inmediatamente después de la respuesta directa, antes de cualquier
          objeción. Es el único bloque de la página cuyo trabajo es proyectar la
          vida, y el único punto donde se agrega un ancla de CTA. */}
      <UnDomingoAqui lote={lote} telefono={FALLBACK_WHATSAPP} mensaje={mensajeWa} />

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

      {/* ═══════════ 6.5 · El calendario, reencuadrado ═══════════
          El cambio de mayor palanca de la página, y no cambia un solo hecho:
          mismas fechas, misma advertencia, ninguna omisión. Lo que cambia es
          que el calendario largo deja de ser sólo un costo y se nombra también
          como lo que es —la razón por la que el producto es barato y financiado
          sin intereses— y el costo se declara acto seguido, en el mismo bloque.

          Va DESPUÉS de la tabla de servicios a propósito: primero el visitante
          ve que hoy no hay nada conectado, y sólo entonces lee por qué eso es
          el precio de la ventana de cinco años. Al revés sería suavizar. */}
      <section aria-labelledby="ventana-titulo" className="border-b border-navy/12 bg-gray-light">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <TituloSeccion id="ventana-titulo">
              Por qué el calendario largo es la razón para comprar ahora, no el motivo
              para no hacerlo
            </TituloSeccion>

            <div className="flex max-w-[62ch] flex-col gap-4 text-base leading-relaxed text-graphite">
              <p>
                Un terreno urbanizado y escriturado en esta zona cuesta más y se paga
                de contado o con crédito bancario. Lo que compras aquí es tiempo:
                fijas hoy el precio y la ubicación, y el desarrollo te da una ventana
                de cinco años para iniciar obra.
              </p>
              <p>
                Eso significa que no necesitas el dinero de la construcción hoy. Pagas
                el terreno
                {plan?.sinIntereses && lote.mesesOpciones.length > 0 ? (
                  <> en {lote.mesesOpciones.join(' o ')} meses sin intereses</>
                ) : (
                  <> conforme al plan del desarrollador</>
                )}
                , y cuando termines de pagarlo empiezas a juntar para la obra, sin que
                nadie te apure y sin renta corriendo en paralelo sobre algo que no es
                tuyo.
              </p>
              {/* El costo de la ventana, sin suavizar y en el mismo bloque. */}
              <p>
                El costo de esa ventana es concreto y está arriba: hoy no hay
                servicios conectados y el lote no es escriturable. Los servicios están
                proyectados para octubre y noviembre de 2027, y la escrituración a
                finales de 2026 según el desarrollador. Si tu plan es construir el año
                que entra, este producto no te sirve y te lo decimos aquí en lugar de
                tres llamadas después.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 6.6 · Lo que falta confirmar ═══════════
          Los chips ámbar que antes vivían dispersos por seis secciones. */}
      <LoQueFaltaConfirmar lote={lote} />

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
                    {lote.regimenPropiedad ?? <EnlaceGate que="régimen de propiedad" tono="oscuro" />}.
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
                  <EnlaceGate que="% de gastos de cierre" />
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
                falsa que el artículo 69 pretende evitar.

                Cuando NO está completa, el pie no repite el párrafo: el
                incumplimiento se declara una sola vez, en el bloque de
                pendientes, y aquí sólo se enlaza. Tres copias del mismo texto
                legal en una página leen como plantilla, y la plantilla es
                justo lo que esta página no puede permitirse. */}
            {lote.licencia.completa ? (
              <p>
                Publicidad de lotes conforme al artículo 69 de la Ley de Asentamientos
                Urbanos de Quintana Roo: los datos de licencia y autorización de venta
                municipal se indican en la sección de situación jurídica de esta
                página.
              </p>
            ) : (
              <p>
                Sobre la licencia del desarrollo y la autorización de venta municipal,{' '}
                <a
                  href="#falta-confirmar"
                  className="underline decoration-white/30 transition-colors duration-200 hover:text-white/80"
                >
                  lo decimos arriba
                </a>
                : todavía no las tenemos por escrito y explicamos por qué.
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
