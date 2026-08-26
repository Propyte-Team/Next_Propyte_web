import type { Metadata } from 'next';
import Image from 'next/image';
import { Archivo, Azeret_Mono } from 'next/font/google';
import { getLotePlayaDelCarmen } from '@/lib/supabase/lp-lotes';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import MotionProvider from './_components/MotionProvider';
import { BarraEscala, Escalon, Escalonado, ParallaxHero, Reveal } from './_components/motion';
import FormTerrenos from './_components/FormTerrenos';
import Mensualidad from './_components/Mensualidad';
import BarraMovil from './_components/BarraMovil';
import WhatsAppTerrenos from './_components/WhatsAppTerrenos';
import EstadoDelSitio from './_components/EstadoDelSitio';
import Privada from './_components/Privada';
import { numerarLaminas } from './_components/laminas';
import './lpt-theme.css';

// ============================================================
// VARIANTE B del A/B de Google Ads. Contra /lp/lotes-playa-del-carmen.
//
// La variante A es la página completa: 13 pantallas, cada disclosure abierto,
// comparador de lotes, plan de pagos desglosado, prueba de que la empresa
// existe. Está construida para que alguien que llega decidido pueda auditarnos
// entero antes de dar su teléfono, y ese es un objetivo legítimo.
//
// Esta es la hipótesis contraria: que el tráfico de Search llega ANTES de eso,
// con una sola pregunta —«¿cuánto al mes y es legal?»— y que trece pantallas
// entre la pregunta y el campo de teléfono cuestan más leads de los que la
// transparencia recupera.
//
// ═══ QUÉ SE MANTIENE IGUAL, PARA QUE EL A/B MIDA ALGO ═══
//
// Misma acción de conversión en Ads, mismo `source` de Zoho, mismo valor de
// conversión (ninguno), mismo hueco de consentimiento. Lo único que cambia es
// la página. Si además cambiara la medición, la diferencia de resultados no
// sería atribuible al diseño.
//
// ═══ QUÉ NO SE HEREDA DE LA VARIANTE A ═══
//
// Ni un token visual. La A es crema con serif y acento terracota; ésta es
// selva drenada con naranja de estaca y una sola grotesca. Dos variantes que
// se parecen miden ruido. Ver la cabecera de `lpt-theme.css`.
//
// ═══ CUATRO REGLAS DE DATO QUE NO SE NEGOCIAN ═══
//
//   1. `nombre_desarrollo` JAMÁS llega al DOM. Los textos salen ya saneados de
//      `getLotePlayaDelCarmen`; aquí no se concatena ningún nombre comercial.
//   2. Los disponibles salen de `lotesDisponiblesPrivada`, que es lo que
//      declara el desarrollador. NO del número de registros de `v_units`: el
//      Hub guarda UNA fila por desarrollo y esa fila es un TIPO de lote. La
//      variante A llegó a publicar «Uno disponible» contra 229 reales.
//   3. Toda cifra en pesos lleva «MXN» pegada. El `$` de es-MX se lee como
//      dólar, y aquí se publican precios de siete cifras.
//   4. Cada imagen va rotulada por lo que es. Un render se rotula como render.
//
// ═══ REVISIÓN DEL 2026-08-26 — POR QUÉ ESTA PÁGINA CRECIÓ ═══
//
// Se pidió «más imágenes y que sí convierta», con una landing de la competencia
// como referencia: más de treinta imágenes, galería de amenidades, testimonios
// y el formulario repetido cinco veces.
//
// Lo que se tomó de ahí, y lo que no:
//
//   · SÍ, las imágenes. Esta variante se publicaba con UNA. Detrás del primer
//     pliegue eran cuatro pantallas de cifras sobre verde, y quien busca
//     «terrenos en playa del carmen» quiere ver el sitio. Ahora son 13, las 13
//     revisadas a ojo una por una contra la regla 1 — dos archivos de la
//     galería quedaron FUERA por llevar rótulos dentro de la imagen. Ver
//     `IMAGENES_CURADAS` en `lp-lotes.ts`.
//   · SÍ, la galería de amenidades — pero atada al dato. Las 10 amenidades
//     salen de columnas booleanas del registro, y solo 6 tienen render. Las
//     otras 4 se publican SIN imagen en vez de emparejarlas con una parecida.
//   · SÍ, repetir el formulario: tres instancias, no dos. La nueva va detrás
//     del mosaico, que es donde la intención es máxima.
//   · NO, los testimonios. No tenemos. Inventarlos es exactamente lo que esta
//     página existe para no hacer.
//   · NO, la urgencia. El competidor publica «80% vendido»; aquí son 81 de 310,
//     y se publica 81 de 310. Es tracción, no escasez, y se dice como es.
//
// ⚠️ CONSECUENCIA PARA EL A/B, DICHA EN VOZ ALTA: la variante B se construyó
// como la hipótesis «3.6 pantallas contra 12.3». Con esto deja de ser eso. Lo
// que sigue midiendo, y es lo que importa, es CONVERSIÓN — y la propiedad que
// justificaba la hipótesis se conservó intacta: el formulario sigue dentro del
// primer viewport, y todo lo que se añadió está por DEBAJO de él. La página no
// creció delante del campo de teléfono; creció detrás.
// ============================================================

/**
 * Grotesca con eje de ANCHO. El eje es la decisión, no la familia: ensanchada
 * al 112% en titulares da la letra de rotulación de un plano —ancha, plana,
 * dibujada para leerse de lejos— y a ancho normal hace texto corrido sin
 * cambiar de voz. Una sola familia, con contraste real de peso y ancho, aguanta
 * toda la página sin el par display+cuerpo que lleva cualquier landing.
 */
const sans = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-lpt-sans',
  display: 'swap',
});

/**
 * Mono para las cotas. No es disfraz de «técnico»: la página publica
 * superficies, plazos y dinero en columnas que tienen que cuadrar
 * verticalmente, y eso pide cifras tabulares. Se usa SOLO en cifras y rótulos.
 */
const mono = Azeret_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-lpt-mono',
  display: 'swap',
});

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Terrenos en Playa del Carmen a 60 meses sin banco | Propyte',
  description:
    'Lotes residenciales en privada, desde 129 m². Enganche del 20%, mensualidades directas con el desarrollador y escrituración. Pide el plan de pagos completo.',
  // El layout de /lp ya declara noindex; se repite aquí para que la variante no
  // dependa de que nadie toque el layout compartido.
  robots: { index: false, follow: true },
};

const BLUR_HERO =
  'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEF/8QAHhABAAICAQUAAAAAAAAAAAAAAQIDABESMUVRcYL/xAAVAQEBAAAAAAAAAAAAAAAAAAABA//EABYRAQEBAAAAAAAAAAAAAAAAAAABIf/aAAwDAQACEQMRAD8AJVZVJFCDs2efWW6secGzc4hLprCmaHbqfrJTS//Z';

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

/** Toda cifra de dinero sale por aquí, y por aquí sale siempre con «MXN». */
const mxn = (n: number) => `${MXN.format(Math.round(n))} MXN`;
const m2 = (n: number) => `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)} m²`;

export default async function LandingTerrenosPlayaDelCarmen() {
  const lote = await getLotePlayaDelCarmen();

  // Inventario de una unidad: que salga del catálogo es un escenario probable,
  // no un caso borde. Se trata como estado, no como error, y sin ofrecer otro
  // lote como si fuera el mismo.
  if (!lote) {
    return (
      <div className={`lpt-root ${sans.variable} ${mono.variable} bg-[var(--lpt-selva)]`}>
        <div className="mx-auto max-w-2xl px-5 py-32">
          <h1 className="lpt-titular text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] text-[var(--lpt-claro)]">
            Estos terrenos ya no están disponibles
          </h1>
          <p className="lpt-cuerpo mt-5 max-w-[52ch] text-base leading-relaxed text-[var(--lpt-claro-2)]">
            El inventario que anunciábamos en esta página se agotó. Si quieres,
            te avisamos cuando entre inventario comparable en Playa del Carmen,
            con sus números completos.
          </p>
          <div className="mt-8">
            <WhatsAppTerrenos
              telefono={FALLBACK_WHATSAPP}
              loteSlug="agotado"
              mensaje="Hola, vi que los terrenos de Playa del Carmen ya no están disponibles. Quiero que me avisen cuando entre inventario comparable."
            />
          </div>
        </div>
      </div>
    );
  }

  const plan = lote.plan;
  const apr = lote.aprovechamiento;
  const hero = lote.imagenes.hero;
  // Índice de láminas, numerado en orden de documento y solo con las que de
  // verdad resolvieron. La leyenda de amenidades referencia estos números, así
  // que se calcula UNA vez aquí y se pasa hacia abajo. Ver `laminas.ts`.
  const laminas = numerarLaminas(lote.imagenes);
  // Conteo por tipo de LO QUE SE VA A SERVIR, para el aviso del pie.
  //
  // Son las láminas del índice MÁS el hero, que se pinta aparte y por eso no
  // está en `ORDEN_LAMINAS` (ver `laminas.ts`). Se cuenta sobre lo que resolvió,
  // no sobre el tamaño de la lista blanca: si un archivo desaparece de la
  // galería del Hub no se pinta, y el pie no puede decir que sí.
  const laminasServidas = [
    ...(hero ? [hero] : []),
    ...Object.keys(laminas).map((k) => lote.imagenes[k as keyof typeof lote.imagenes]!),
  ];
  const laminasRender = laminasServidas.filter((i) => i.tipo === 'render').length;
  const laminasFoto = laminasServidas.filter((i) => i.tipo === 'foto').length;
  // Const local, no propiedad: TypeScript conserva el estrechamiento de un
  // const dentro de un closure, y la seccion 03 lee la superficie dentro de
  // un .map().
  const superficieM2 = lote.superficieM2;
  // El esquema es texto libre del catálogo y no siempre termina en punto. Sin
  // esto se pegaba con la frase siguiente: «…20% contraentrega Los gastos de
  // escrituración…». Se normaliza aquí, no se corrige en la base: el dato es
  // del desarrollador y la puntuación es cosa de esta página.
  const esquemaFrase = lote.esquemaPago
    ? /[.!?]$/.test(lote.esquemaPago.trim())
      ? lote.esquemaPago.trim()
      : `${lote.esquemaPago.trim()}.`
    : '';
  const plazos = plan?.opciones.map((o) => o.meses) ?? lote.mesesOpciones ?? [];
  const mensualidadMin = plan?.opciones.at(-1)?.mensualidadMxn ?? null;

  /**
   * Las tres pruebas del primer pliegue. Se ARMAN a partir de lo que hay: si un
   * dato falta, su prueba no entra, y nunca se rellena el hueco con una frase
   * de relleno. Tres pruebas verdaderas convencen más que cinco genéricas.
   */
  const pruebas = [
    plan && plan.enganchePct
      ? { cifra: `${Math.round(plan.enganchePct)}%`, pie: 'de enganche' }
      : null,
    lote.lotesDisponiblesPrivada && lote.lotesTotalesPrivada
      ? {
          cifra: `${lote.lotesDisponiblesPrivada}`,
          pie: `de ${lote.lotesTotalesPrivada} lotes libres`,
        }
      : null,
    superficieM2 ? { cifra: m2(superficieM2), pie: 'por lote' } : null,
  ].filter((p): p is { cifra: string; pie: string } => p !== null);

  /**
   * Lo verificable. Cada punto o sale de una columna del registro o NO se
   * publica. El régimen y el subtipo se imprimen con la palabra literal del
   * catálogo, sin eufemismo: «semi urbanizado» se dice así.
   *
   * ⚠️ LA NOTA DE ESCRITURACIÓN NO SE PUBLICA EN ESTA VARIANTE. DECISIÓN DE
   * NEGOCIO DE LUIS, 2026-08-21, NO UN DESCUIDO — no volver a añadirla creyendo
   * que falta un dato.
   *
   * Qué se quitó: `lote.escrituracionNota`, que hoy declara literalmente «HOY
   * NO ES ESCRITURABLE: titulo en fideicomiso» con fecha estimada a finales de
   * 2026. Se le dijo al usuario que es una condición material de la compra y
   * que quitarla del punto de entrada del tráfico pagado traslada el hallazgo a
   * una conversación posterior. Se ejecutó igualmente.
   *
   * Dónde sigue viva: la variante A, `/lp/lotes-playa-del-carmen`, la publica
   * en su bloque de situación jurídica. El dato NO se ha borrado de ningún
   * sitio; solo no se muestra aquí.
   */
  const verificables = [
    lote.licencia.licenciaNumero
      ? {
          rotulo: 'Licencia',
          titulo: `Licencia de fraccionamiento ${lote.licencia.licenciaNumero}`,
          nota: lote.licencia.licenciaFecha
            ? `Emitida el ${lote.licencia.licenciaFecha}. El número es público y se puede cotejar en el municipio.`
            : 'El número es público y se puede cotejar en el municipio.',
        }
      : null,
    lote.regimenPropiedad
      ? {
          rotulo: 'Régimen',
          titulo: lote.regimenPropiedad,
          nota: 'No es ejido. Es el punto donde se cae la mayoría de las ofertas baratas de la zona.',
        }
      : null,
    // Aquí iba «Escritura». Ver el bloque de arriba antes de reponerla.
    lote.subtipoLiteral
      ? {
          rotulo: 'Qué es',
          titulo: lote.subtipoLiteral,
          nota: lote.usoSuelo
            ? `Uso de suelo ${lote.usoSuelo}. Te decimos la palabra exacta del catálogo, no una versión bonita.`
            : 'Te decimos la palabra exacta del catálogo, no una versión bonita.',
        }
      : null,
  ].filter(
    (v): v is { rotulo: string; titulo: string; nota: string } => v !== null,
  );

  /**
   * La ficha del lote: los verificables más el aprovechamiento, en una sola
   * tira de cotas.
   *
   * POR QUÉ NO SON DOS SECCIONES. Lo eran. «Lo que puedes ir a comprobar sin
   * nosotros» se quedó con dos tarjetas cuando salió la nota de escrituración,
   * y la licencia de fraccionamiento no está capturada en NINGUNO de los 22
   * desarrollos del Hub (medido). Un titular que promete cosas comprobables
   * seguido de dos tarjetas promete más de lo que entrega, y dejaba media
   * pantalla vacía.
   *
   * Fusionadas, cada parte hace lo que sabe hacer: la cifra de lo construible
   * carga la banda, y el régimen y el uso de suelo bajan a cotas de ficha
   * técnica. Es además el registro correcto para esos datos: en una hoja de
   * topógrafo el régimen no es un argumento de venta con su tarjeta, es una
   * línea de la leyenda. El COS y el CUS dejan de ser una nota al pie suelta y
   * entran como una cota más.
   */
  const ficha = [
    ...verificables.map((v) => ({ rotulo: v.rotulo, valor: v.titulo, nota: v.nota })),
    apr
      ? {
          rotulo: 'Aprovechamiento',
          valor: `COS ${apr.cos} · CUS ${apr.cus}`,
          nota: `La casa puede ocupar hasta ${m2(apr.huellaM2)} de huella en planta. El resto queda como área libre, que lo exige el reglamento del fraccionamiento y no es recomendación nuestra.`,
        }
      : null,
  ].filter((f): f is { rotulo: string; valor: string; nota: string } => f !== null);

  const mensajeWa = [
    `Hola, vi la página de terrenos en Playa del Carmen (ref. ${lote.slug}).`,
    superficieM2 ? `Son ${m2(superficieM2)}.` : null,
    'Quiero el plan de pagos completo.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <MotionProvider>
      <div
        className={`lpt-root ${sans.variable} ${mono.variable} bg-[var(--lpt-selva)] text-[var(--lpt-claro)]`}
      >
        {/* ═══════════ 01 · Hero + conversión ═══════════
            Una sola pantalla que contiene la promesa Y el campo de teléfono.
            En la variante A el formulario completo vivía a y ≈ 3,374 px: tres
            pantallas y media de scroll entre el anuncio y la conversión. */}
        <section className="relative isolate overflow-hidden bg-[var(--lpt-abismo)]">
          {hero && (
            <ParallaxHero className="absolute inset-0 -z-10">
              <Image
                src={hero.url}
                alt={hero.alt}
                fill
                priority
                // `100vw` a secas hace que el navegador pida el candidato de
                // 3840 px. El original mide 2400: pedir más no añade un píxel
                // real, solo reescala hacia arriba un JPEG de 691 KB en el LCP.
                sizes="(min-width: 2048px) 2048px, 100vw"
                // Sin placeholder el hueco se pinta con el fondo oscuro y en
                // conexión lenta la página se ve como un rectángulo negro.
                placeholder="blur"
                blurDataURL={BLUR_HERO}
                className="object-cover"
              />
            </ParallaxHero>
          )}

          {/* Velo en dos capas: vertical para asentar el texto, y uno lateral
              que solo existe en escritorio para que la caliza del formulario
              no compita con la hora dorada de la foto. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--lpt-abismo)] via-[var(--lpt-abismo)]/80 to-[var(--lpt-abismo)]/25"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-[var(--lpt-abismo)] via-[var(--lpt-abismo)]/55 to-transparent lg:block"
          />
          {/* La trama del plano. Se funde despacio al cargar: es lo único de la
              página que sí puede animar opacidad, porque si se quedara a cero
              no faltaría ninguna información. */}
          <div
            aria-hidden="true"
            className="lpt-plano lpt-entra-trama absolute inset-0 -z-10 opacity-60"
          />

          {/* ═══ EL ORDEN CAMBIA ENTRE MÓVIL Y ESCRITORIO, Y ESO ES EL DISEÑO ═══
              En escritorio el formulario va a la derecha, a la altura del
              titular, y las tres pruebas ocupan la fila de abajo a la izquierda.
              En móvil no hay columna derecha: el orden del documento es
              titular → FORMULARIO → pruebas.

              Medido: con las pruebas antes del formulario, en un teléfono de
              390×844 el formulario arrancaba fuera del primer viewport y el
              banner de cookies le caía encima. Eso convertía la variante corta
              en la larga con menos texto. Las pruebas son apoyo; el campo de
              teléfono es el objetivo, y va primero. */}
          <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:pb-24 lg:pt-36">
            <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:pt-6">
              <p
                className="lpt-rotulo lpt-entra text-[var(--lpt-estaca)]"
                style={{ animationDelay: '40ms' }}
              >
                {[lote.zona, lote.ciudad].filter(Boolean).join(' · ')}
              </p>

              {/* EL H1 ES EL LCP. Solo se mueve, jamás se funde: un `opacity:0`
                  aquí retrasa el LCP de una página que se paga por clic, y si
                  se atasca deja la página sin titular para siempre. */}
              <h1 className="lpt-titular lpt-entra mt-4 text-[clamp(2.5rem,1.5rem+4.6vw,4.75rem)] text-[var(--lpt-claro)]">
                Terrenos en Playa del Carmen
                {mensualidadMin && (
                  <>
                    {' '}
                    <span className="text-[var(--lpt-estaca)]">
                      desde {mxn(mensualidadMin)} al mes
                    </span>
                  </>
                )}
              </h1>

              <p
                className="lpt-cuerpo lpt-entra mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-[var(--lpt-claro-2)]"
                style={{ animationDelay: '120ms' }}
              >
                Lotes residenciales en privada, con financiamiento directo del
                desarrollador. Sin banco, sin buró y sin comprobante de ingresos.
              </p>

            </div>

            {/* El formulario. Única superficie clara del primer pliegue, a la
                altura del titular en escritorio y justo debajo en móvil. */}
            <div
              id="solicitud"
              className="scroll-mt-8 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1"
            >
              <div className="lpt-entra" style={{ animationDelay: '280ms' }}>
                <FormTerrenos
                  variante="hero"
                  plazos={plazos}
                  loteRef={lote.slug}
                  loteTitulo={lote.titulo}
                />
              </div>
            </div>

            {pruebas.length > 0 && (
              <ul
                className="lpt-entra flex flex-wrap gap-x-10 gap-y-6 border-t border-[var(--lpt-linea-fuerte)] pt-6 lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:self-end"
                style={{ animationDelay: '200ms' }}
              >
                {pruebas.map((p) => (
                  <li key={p.pie}>
                    <p className="lpt-titular text-[1.75rem] text-[var(--lpt-claro)]">{p.cifra}</p>
                    <p className="lpt-cota mt-0.5 text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpt-claro-3)]">
                      {p.pie}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sentinela de la barra fija de móvil. Sin alto: no ocupa layout. */}
          <div id="lpt-sentinela" aria-hidden="true" className="h-px w-full" />
        </section>

        {/* ═══════════ 02 · El sitio ═══════════
            Dos láminas: la fotografía aérea real del polígono HOY y el render
            de lotes ya construidos. Va aquí, antes del dinero, porque la
            primera pregunta de quien acaba de hacer clic en un anuncio de
            terrenos no es cuánto: es QUÉ. */}
        <EstadoDelSitio
          imagenes={lote.imagenes}
          laminas={laminas}
          numeroSeccion="02"
          superficieTexto={superficieM2 ? m2(superficieM2) : null}
          disponibles={lote.lotesDisponiblesPrivada}
          totales={lote.lotesTotalesPrivada}
        />

        {/* ═══════════ 03 · La mensualidad ═══════════ */}
        {plan && lote.precioMxn && (
          <section className="lpt-plano border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-selva)]">
            <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
              <Reveal>
                <p className="lpt-rotulo text-[var(--lpt-estaca)]">03 · El plan</p>
              </Reveal>
              <Reveal delay={0.06}>
                <div className="mt-10">
                  <Mensualidad plan={plan} precioMxn={lote.precioMxn} />
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="lpt-cuerpo mt-12 max-w-[62ch] border-t border-[var(--lpt-linea)] pt-6 text-sm leading-relaxed text-[var(--lpt-claro-3)]">
                  Precio de lista {mxn(lote.precioMxn)}
                  {superficieM2
                    ? ` por ${m2(superficieM2)}, es decir ${mxn(lote.precioMxn / superficieM2)} por m²`
                    : ''}
                  . {esquemaFrase} Los gastos de escrituración y el
                  mantenimiento se cotizan aparte, y te los desglosamos en el
                  plan que te mandamos.
                </p>
              </Reveal>
            </div>
          </section>
        )}

        {/* ═══════════ 04 · El lote ═══════════
            Una sola banda donde antes había dos. Arriba la cifra que responde
            la segunda pregunta real de quien compra terreno para construir
            —«¿me cabe la casa que quiero?»— y que no es dato nuevo, sino
            multiplicación sobre el COS y el CUS que ya publica la ficha. Abajo,
            la ficha técnica en cotas. Ver el comentario de `ficha`. */}
        {(apr && superficieM2) || ficha.length > 0 ? (
          <section className="lpt-plano border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-selva)]">
            <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
              <Reveal>
                <p className="lpt-rotulo text-[var(--lpt-estaca)]">04 · El lote</p>
              </Reveal>

              {apr && superficieM2 && (
                <>
                  <Reveal delay={0.06}>
                    <h2 className="lpt-titular mt-4 max-w-[20ch] text-[clamp(1.875rem,1.4rem+2.2vw,3rem)] text-[var(--lpt-claro)]">
                      Puedes construir más metros de los que compras
                    </h2>
                  </Reveal>

                  <Reveal delay={0.12}>
                    <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:gap-16">
                      {[
                        { etiqueta: 'Terreno', valor: superficieM2, nota: 'lo que compras' },
                        {
                          etiqueta: 'Construible',
                          valor: apr.construibleM2,
                          nota: `sumando ${apr.niveles} niveles, con CUS ${apr.cus}`,
                        },
                      ].map((d, i) => (
                        <div key={d.etiqueta}>
                          <p className="lpt-cota text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpt-claro-3)]">
                            {d.etiqueta}
                          </p>
                          <p
                            className={`lpt-titular mt-2 text-[clamp(2.25rem,1.4rem+3.4vw,3.5rem)] ${
                              i === 1 ? 'text-[var(--lpt-estaca)]' : 'text-[var(--lpt-claro)]'
                            }`}
                          >
                            {m2(d.valor)}
                          </p>
                          <BarraEscala
                            pct={d.valor / Math.max(superficieM2, apr.construibleM2)}
                            className={`mt-4 h-1.5 w-full ${
                              i === 1 ? 'bg-[var(--lpt-estaca)]' : 'bg-[var(--lpt-claro-3)]'
                            }`}
                          />
                          <p className="lpt-cuerpo mt-3 text-sm text-[var(--lpt-claro-2)]">
                            {d.nota}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Reveal>
                </>
              )}

              {/* La ficha. Columnas separadas por filete, como la leyenda de un
                  plano: rótulo, valor y la línea que explica por qué importa. */}
              {ficha.length > 0 && (
                <Escalonado
                  className="mt-16 grid border-t border-[var(--lpt-linea-fuerte)] sm:grid-cols-2 lg:grid-cols-3"
                  delay={0.08}
                >
                  {ficha.map((f) => (
                    <Escalon
                      key={f.rotulo}
                      className="border-b border-[var(--lpt-linea)] py-7 pr-8 lg:border-b-0 lg:border-r lg:pl-8 lg:first:pl-0 lg:last:border-r-0"
                    >
                      <p className="lpt-cota text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpt-estaca)]">
                        {f.rotulo}
                      </p>
                      <p className="lpt-titular mt-2.5 text-[1.25rem] leading-tight text-[var(--lpt-claro)]">
                        {f.valor}
                      </p>
                      <p className="lpt-cuerpo mt-2.5 max-w-[42ch] text-[0.875rem] leading-relaxed text-[var(--lpt-claro-2)]">
                        {f.nota}
                      </p>
                    </Escalon>
                  ))}
                </Escalonado>
              )}
            </div>
          </section>
        ) : null}

        {/* ═══════════ 05 · La privada ═══════════
            El mosaico de láminas y la leyenda de amenidades. Es lo más largo
            que se añadió, y va deliberadamente DESPUÉS del dinero y de lo
            verificable: primero se contesta cuánto y si es legal, y solo
            entonces se enseña dónde. Diez imágenes son diferidas, así que no
            entran en el LCP. */}
        <Privada
          imagenes={lote.imagenes}
          amenidades={lote.amenidades}
          laminas={laminas}
          numeroSeccion="05"
        />

        {/* ═══════════ 06 · Solicitud · 02 ═══════════
            LA INSTANCIA NUEVA DEL FORMULARIO, y el sitio importa: viene
            inmediatamente después del mosaico. Antes, quien acababa de ver las
            láminas tenía que volver a subir cinco secciones o seguir bajando
            hasta el cierre. Ahora el campo está donde queda la ganas.

            No repite argumento —eso es trabajo de la sección anterior—, solo
            nombra lo que se manda. */}
        <section className="lpt-plano border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-selva-2)]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-20">
            <div className="lg:col-span-6">
              <Reveal>
                <h2 className="lpt-titular text-[clamp(1.75rem,1.35rem+2vw,2.75rem)] text-[var(--lpt-claro)]">
                  ¿Te mandamos el calendario de obra?
                </h2>
              </Reveal>
              <Reveal delay={0.06}>
                <p className="lpt-cuerpo mt-5 max-w-[50ch] text-[1.0625rem] leading-relaxed text-[var(--lpt-claro-2)]">
                  Va junto al plan de pagos: en qué mes entrega el desarrollador
                  cada amenidad de la lista de arriba, cuáles ya están
                  contratadas y cuáles siguen en proyecto. Con fechas, no con
                  «próximamente».
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal delay={0.1}>
                <FormTerrenos
                  variante="medio"
                  plazos={plazos}
                  loteRef={lote.slug}
                  loteTitulo={lote.titulo}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════ 07 · Cierre ═══════════
            Tercera y última instancia del formulario. Quien llegó hasta aquí ya
            leyó los números y lo verificable: no hay nada nuevo que decirle,
            solo el campo donde escribir. */}
        <section className="border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-abismo)]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:col-span-6">
              <Reveal>
                <p className="lpt-rotulo text-[var(--lpt-estaca)]">07 · Siguiente paso</p>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="lpt-titular mt-4 text-[clamp(2rem,1.4rem+2.8vw,3.5rem)] text-[var(--lpt-claro)]">
                  Te mandamos el plan completo y tú decides
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="lpt-cuerpo mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-[var(--lpt-claro-2)]">
                  Precio cerrado, enganche, la mensualidad de cada plazo y qué
                  cubre la escritura. En un PDF, por WhatsApp, sin que tengas que
                  ir a ninguna oficina para verlo.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="mt-8">
                  <WhatsAppTerrenos
                    telefono={lote.asesor?.whatsapp ?? FALLBACK_WHATSAPP}
                    loteSlug={lote.slug}
                    mensaje={mensajeWa}
                  />
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6">
              <Reveal delay={0.1}>
                <FormTerrenos
                  variante="cierre"
                  plazos={plazos}
                  loteRef={lote.slug}
                  loteTitulo={lote.titulo}
                />
              </Reveal>
            </div>
          </div>

          {/* Rótulo de la imagen y estado del inventario. Va en el pie porque es
              obligación de honestidad, no argumento de venta, pero va: una foto
              sin rotular en una página de preventa es una promesa implícita. */}
          <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
            <p className="lpt-cota border-t border-[var(--lpt-linea)] pt-6 text-[0.6875rem] leading-relaxed text-[var(--lpt-claro-3)]">
              {/* Se cuentan las imágenes REALMENTE servidas y por tipo, en vez
                  de escribir «13 renders»: si un archivo desaparece de la
                  galería del Hub, la página resuelve ese hueco a null y este
                  pie diría un número falso. */}
              {laminasRender > 0
                ? `${laminasRender === 1 ? 'La imagen es un render' : `${laminasRender} de las imágenes de esta página son renders`} del proyecto del desarrollador, no obra existente${
                    laminasFoto > 0
                      ? `; ${laminasFoto === 1 ? 'la restante es fotografía real del terreno' : `las otras ${laminasFoto} son fotografía real del terreno`}`
                      : ''
                  }. Cada una va rotulada. `
                : ''}
              {lote.estadoComercial ? `Estado: ${lote.estadoComercial}. ` : ''}
              {lote.lotesDisponiblesPrivada && lote.lotesTotalesPrivada
                ? `${lote.lotesDisponiblesPrivada} lotes disponibles de ${lote.lotesTotalesPrivada} declarados por el desarrollador. `
                : ''}
              Precios y condiciones sujetos a cambio sin previo aviso.
            </p>
          </div>
        </section>

        <BarraMovil mensualidadTexto={mensualidadMin ? `${mxn(mensualidadMin)} al mes` : null} />
      </div>
    </MotionProvider>
  );
}
