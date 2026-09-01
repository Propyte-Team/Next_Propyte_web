import type { Metadata } from 'next';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { getLotePlayaDelCarmen } from '@/lib/supabase/lp-lotes';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import FormEnganche from './_components/FormEnganche';
import DesgloseEnganche from './_components/DesgloseEnganche';
import FiguraRedonda from './_components/FiguraRedonda';
import FlotantesEnganche from './_components/FlotantesEnganche';
import EstructuraPago from './_components/EstructuraPago';
import { ICONOS, IconoNeutro, normalizarAmenidad } from './_components/iconos';
import { mxn, m2 } from './_components/formato';
import './lpe-theme.css';

// ============================================================
// VARIANTE C — EL ENGANCHE COMO PROTAGONISTA.
//
// Tercera landing de lotes de Playa del Carmen. Las otras dos:
//   A · /lp/lotes-playa-del-carmen      — 12 secciones, auditoría completa
//   B · /lp/terrenos-playa-del-carmen   — corta, la MENSUALIDAD es el gancho
//   C · esta                            — el ENGANCHE es el gancho
//
// ═══ LA APUESTA, Y POR QUÉ ES DISTINTA DE LA DE LA B ═══
//
// La B publica «desde $10,280 MXN al mes» porque la mensualidad es lo que la
// gente compara. Esta publica «$202,176 MXN de enganche» porque el enganche es
// lo que DECIDE: la mensualidad se evalúa contra el sueldo, el enganche contra
// el ahorro que ya existe, y es el número que frena a quien no puede juntar el
// 20%.
//
// Es una apuesta con dos filos, dicho sin adornos: la cifra ahuyenta tráfico.
// La hipótesis es que ahuyenta al que nunca iba a comprar, y que el que sí
// puede llega a la conversación sin la sorpresa que hoy mata leads en la
// primera llamada. Si la hipótesis es falsa, esta variante va a traer menos
// leads y MEJORES, y el CPL solo no lo va a decir — ver la nota de medición.
//
// ═══ DE DÓNDE SALE EL ESTILO ═══
//
// Se pidió copiar el estilo completo de la landing de la competencia que sí
// convierte (Ciudad Mayakoba / Bosques). Se midió la página real en el
// navegador, no se copió de memoria: Poppins en 205 nodos, serif en itálica
// para la palabra de acento, blanco dominante, `border-radius: 32px` en 79
// nodos, un verde saturado para CTA y otro pálido para paneles, titular a 48 px
// en peso 400, y 86 imágenes en 15 secciones.
//
// Todo eso está reproducido aquí. Lo que NO se copia —logotipo, fotografías,
// textos y el verde de su marca— y por qué eso no es un detalle está explicado
// en la cabecera de `lpe-theme.css`. El color sale de la paleta canónica de
// Propyte.
//
// ═══ LO QUE NO CAMBIA, PARA QUE LAS TRES SE PUEDAN COMPARAR ═══
//
// Misma acción de conversión en Ads, mismo `source: 'lp_lotes_pdc'` de Zoho,
// mismo valor de conversión (ninguno), mismo hueco de consentimiento. Lo único
// que cambia es la página. En GA4 las separa `form_type`
// (`lp_enganche_pdc`), en Zoho el `page` → `Nombre_anuncio`.
//
// ⚠️ TRES VARIANTES PARTEN EL TRÁFICO EN TRES. La campaña de Lotes PDC ya
// pierde ~90% de impresiones por rango y con DOS variantes la significancia
// estaba en duda. Con tres, medir el CPL a dos semanas no va a concluir nada.
// Esto no es motivo para no construirla —construida ya está y no cuesta
// tráfico hasta que alguien la conecte— pero sí para no repartir a tres bandas
// sin subir antes la puja.
//
// ═══ CUATRO REGLAS DE DATO QUE NO SE NEGOCIAN ═══
//
//   1. `nombre_desarrollo` JAMÁS llega al DOM. Los textos salen ya saneados de
//      `getLotePlayaDelCarmen`; aquí no se concatena ningún nombre comercial.
//   2. Los disponibles salen de `lotesDisponiblesPrivada`, que es lo que
//      declara el desarrollador. NO del número de registros de `v_units`: el
//      Hub guarda UNA fila por desarrollo y esa fila es un TIPO de lote.
//   3. Toda cifra en pesos lleva «MXN» pegada. El `$` de es-MX se lee como
//      dólar, y aquí se publican precios de siete cifras.
//   4. Cada imagen va rotulada por lo que es. Un render se rotula como render.
//      Y cambiar el recorte de una imagen obliga a REVISARLA otra vez: ver
//      `ARCHIVOS_RECHAZADOS` en `lp-lotes.ts`.
// ============================================================

/**
 * Poppins: la geométrica del estilo copiado. Es la decisión tipográfica más
 * visible de la página y no es casual — en la landing de referencia sostiene
 * 205 nodos de texto. Se cargan cuatro pesos porque el estilo depende del
 * CONTRASTE entre un titular ligero (400) y la cifra (600), no de un solo peso
 * medio para todo.
 *
 * La serif en itálica de los acentos NO se declara aquí: es `--font-lp-display`
 * (Newsreader), que el layout compartido de `/lp` ya carga con su itálica. El
 * acento cuesta cero bytes de red en una página que se paga por clic.
 */
const sans = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-lpe-sans',
  display: 'swap',
});

export const revalidate = 300;

export const metadata: Metadata = {
  // Sin «| Propyte» al final: el layout raíz ya aplica `template: '%s | Propyte'`
  // y el título salía duplicado en producción («... | Propyte | Propyte»).
  title: 'Terrenos en Playa del Carmen con $202,176 MXN de enganche',
  description:
    'Lotes residenciales en privada desde 129 m². Enganche del 20%, el resto en mensualidades sin intereses y sin banco. Te mandamos el plan de pagos completo.',
  // El layout de /lp ya declara noindex; se repite aquí para que la variante no
  // dependa de que nadie toque el layout compartido.
  robots: { index: false, follow: true },
};

const BLUR_HERO =
  'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEF/8QAHhABAAICAQUAAAAAAAAAAAAAAQIDABESMUVRcYL/xAAVAQEBAAAAAAAAAAAAAAAAAAABA//EABYRAQEBAAAAAAAAAAAAAAAAAAABIf/aAAwDAQACEQMRAD8AJVZVJFCDs2efWW6secGzc4hLprCmaHbqfrJTS//Z';

// `mxn` y `m2` viven en `_components/formato.ts` y NO aquí: el desglose es un
// componente cliente y necesita el mismo formato. Dos definiciones del formato
// del dinero divergen —la que lleva «MXN» y la que se le olvidó—, así que hay
// una sola, en un módulo sin directiva que se empaqueta en los dos lados. El
// motivo completo, y el intento fallido de pasarlo como prop, está en ese
// archivo.

export default async function LandingEngancheTerrenos() {
  const lote = await getLotePlayaDelCarmen();

  // Inventario agotado: es un escenario probable, no un caso borde. Se trata
  // como estado y sin ofrecer otro lote como si fuera el mismo.
  if (!lote) {
    return (
      <div className={`lpe-root ${sans.variable}`}>
        <div className="mx-auto max-w-2xl px-5 py-32">
          <h1 className="lpe-titular text-[clamp(1.75rem,1.3rem+2vw,2.5rem)]">
            Estos terrenos <span className="lpe-italica">ya no</span> están
            disponibles
          </h1>
          <p className="lpe-cuerpo mt-5 max-w-[52ch] text-base leading-relaxed text-[var(--lpe-tinta-2)]">
            El inventario que anunciábamos en esta página se agotó. Si quieres,
            te avisamos cuando entre inventario comparable en Playa del Carmen,
            con sus números completos.
          </p>
        </div>
      </div>
    );
  }

  const plan = lote.plan;
  const img = lote.imagenes;
  const hero = img.hero;
  const superficieM2 = lote.superficieM2;
  const plazos = plan?.opciones.map((o) => o.meses) ?? lote.mesesOpciones ?? [];
  const engancheTexto = plan ? mxn(plan.engancheMxn) : null;

  // Vendidos = declarados menos disponibles. No es escasez inventada: es resta,
  // y no se dramatiza. 81 de 310 es tracción, no «últimos lugares».
  const vendidos =
    lote.lotesDisponiblesPrivada !== null &&
    lote.lotesTotalesPrivada !== null &&
    lote.lotesTotalesPrivada >= lote.lotesDisponiblesPrivada
      ? lote.lotesTotalesPrivada - lote.lotesDisponiblesPrivada
      : null;

  /**
   * La banda de cifras, equivalente al «X en números» del original — pero cada
   * una sale de una columna del registro. Su banda publica «+16% de plusvalía
   * anualizada», que es el tipo de cifra que aquí no se puede publicar porque
   * no tenemos de dónde sacarla. Se arma con lo que hay: si un dato falta, su
   * cifra NO entra y no se rellena el hueco.
   */
  const cifras = [
    superficieM2 ? { valor: m2(superficieM2), pie: 'por lote' } : null,
    lote.precioM2Mxn ? { valor: mxn(lote.precioM2Mxn), pie: 'por m²' } : null,
    plan?.sinIntereses ? { valor: '0%', pie: 'de interés' } : null,
    vendidos !== null
      ? { valor: `${vendidos}`, pie: `lotes vendidos de ${lote.lotesTotalesPrivada}` }
      : null,
  ].filter((c): c is { valor: string; pie: string } => c !== null);

  /** Amenidades declaradas, con su icono de línea. Ver `iconos.tsx`. */
  const amenidades = lote.amenidades.map((nombre) => ({
    nombre,
    Icono: ICONOS[normalizarAmenidad(nombre)] ?? IconoNeutro,
  }));

  /**
   * La galería. Las 8 que no usa ninguna otra sección: el hero se pinta a
   * sangre, `alberca` acompaña a las amenidades y `urbanizacion`/`casasCenital`
   * son el par hoy/proyectado.
   *
   * ⚠️ Los `aspecto` de aquí son recortes NUEVOS respecto a la variante B, así
   * que las 12 imágenes se revisaron otra vez a 2× ya maquetadas. No cambies un
   * `aspecto` sin repetir esa revisión.
   */
  const galeria = [
    { clave: 'gimnasio' as const, etiqueta: 'Gimnasio', aspecto: 'aspect-[4/5]', ancha: false },
    { clave: 'casaClub' as const, etiqueta: 'Casa club', aspecto: 'aspect-[4/5]', ancha: false },
    { clave: 'cine' as const, etiqueta: 'Cine al aire libre', aspecto: 'aspect-[16/10]', ancha: true },
    { clave: 'canchasCenital' as const, etiqueta: 'Canchas', aspecto: 'aspect-[4/5]', ancha: false },
    { clave: 'casaClubComedor' as const, etiqueta: 'Comedor', aspecto: 'aspect-[4/5]', ancha: false },
    { clave: 'domingo' as const, etiqueta: 'Alberca y casa club', aspecto: 'aspect-[4/5]', ancha: false },
    { clave: 'amenidades' as const, etiqueta: 'Pádel y pickleball', aspecto: 'aspect-[4/5]', ancha: false },
    { clave: 'andador' as const, etiqueta: 'Andadores', aspecto: 'aspect-[16/9] lg:aspect-[21/9]', ancha: true },
  ].filter((g) => img[g.clave]);

  const mensajeWa = [
    `Hola, vi la página de terrenos en Playa del Carmen (ref. ${lote.slug}).`,
    engancheTexto ? `Vi que el enganche es de ${engancheTexto}.` : null,
    'Quiero el plan de pagos completo.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`lpe-root ${sans.variable}`}>
      {/* ═══════════ 01 · Hero ═══════════
          La cápsula de foto inscrita en una banda oscura, que es la composición
          del original. La banda es AZTEC y no blanca por una razón concreta: el
          layout compartido de `/lp` monta el logotipo BLANCO de Propyte flotando
          en `top-0`, y sobre una banda blanca desaparecería. Retintar el logo
          desde este archivo no se puede —vive fuera de `.lpe-root`—, así que la
          banda se adapta al logo y no al contrario.

          El formulario va DENTRO del primer pliegue, debajo de la cápsula. El
          original deja aquí solo un botón, pero eso ya costó $991.40 MXN en 72
          clics con cero envíos en la variante A: el campo de teléfono se ve o no
          existe. */}
      <section className="lpe-sobre-oscuro bg-[var(--lpe-aztec)] px-3 pb-12 pt-16 sm:px-5 sm:pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="lpe-capsula lpe-entra relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
            {hero && (
              <Image
                src={hero.url}
                alt={hero.alt}
                fill
                priority
                // `100vw` a secas hace que el navegador pida el candidato de
                // 3840 px. El original mide 2400: pedir más no añade un píxel
                // real, solo reescala hacia arriba un JPEG en el LCP.
                sizes="(min-width: 1280px) 1216px, 100vw"
                placeholder="blur"
                blurDataURL={BLUR_HERO}
                className="object-cover"
              />
            )}
            {/* Velo local al pie, no una capa a pantalla completa: el centro de
                la fotografía se queda limpio. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[var(--lpe-aztec)] via-[var(--lpe-aztec)]/75 to-transparent"
            />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-12">
              {/* EL H1 ES EL LCP. Solo se mueve, jamás se funde: un `opacity:0`
                  aquí retrasa el LCP de una página que se paga por clic, y si se
                  atasca deja la página sin titular para siempre.

                  La composición es la del original: palabra de acento en serif
                  itálica + la cifra en la sans pesada, en la misma línea. */}
              <h1 className="lpe-titular max-w-[22ch] text-[clamp(1.875rem,1.1rem+3.6vw,3.75rem)] text-white">
                <span className="lpe-italica">Terrenos</span> en Playa del Carmen
                {engancheTexto && (
                  <>
                    {' '}
                    <span className="lpe-italica">con</span>{' '}
                    <span className="lpe-cifra">{engancheTexto}</span>{' '}
                    <span className="lpe-italica">de enganche</span>
                  </>
                )}
              </h1>
              <p className="lpe-cuerpo mt-4 text-[0.9375rem] text-white/75 sm:text-base">
                {[lote.zona, lote.ciudad].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {/* Debajo de la cápsula: el argumento a la izquierda, la conversión a
              la derecha. En móvil el orden del documento es argumento →
              FORMULARIO, y el formulario entra en el primer viewport. */}
          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6 lg:pt-3">
              <p className="lpe-cuerpo text-[1.0625rem] leading-relaxed text-white/80 sm:text-[1.125rem]">
                Lotes residenciales en privada, con financiamiento directo del
                desarrollador. Sin banco, sin buró y sin comprobante de
                ingresos.
              </p>

              {/* Antes aquí había una fila con las MISMAS tres cifras sueltas y
                  debajo 519 px de vacío hasta el fondo de la tarjeta del
                  formulario (medido en 1440 y en 1920). `EstructuraPago` dice
                  lo mismo más la proporción y el cuándo de cada tramo, que es
                  la pregunta que abre un enganche de siete cifras. */}
              {plan && <EstructuraPago plan={plan} />}
            </div>

            <div id="solicitud" className="scroll-mt-8 lg:col-span-6">
              <FormEnganche
                variante="hero"
                plazos={plazos}
                loteRef={lote.slug}
                loteTitulo={lote.titulo}
                engancheTexto={engancheTexto}
              />
            </div>
          </div>
        </div>

        {/* Sentinela de los elementos fijos. Sin alto: no ocupa layout. */}
        <div id="lpe-sentinela" aria-hidden="true" className="h-px w-full" />
      </section>

      {/* ═══════════ 02 · La declaración ═══════════
          El equivalente exacto de la segunda sección del original: una frase
          centrada, grande, con la cifra dentro y la palabra de acento en
          itálica. Es donde el enganche deja de ser un dato de ficha y se vuelve
          la propuesta. */}
      {plan && (
        <section className="bg-[var(--lpe-blanco)] px-5 py-20 sm:px-8 lg:py-28">
          <p className="lpe-titular mx-auto max-w-[26ch] text-center text-[clamp(1.75rem,1.1rem+3.2vw,3.5rem)]">
            Solo <span className="lpe-cifra">{mxn(plan.engancheMxn)}</span>{' '}
            <span className="lpe-italica">de enganche</span> y el lote queda
            apartado a tu nombre.
          </p>
          <p className="lpe-cuerpo mx-auto mt-8 max-w-[54ch] text-center text-[1.0625rem] leading-relaxed text-[var(--lpe-tinta-2)]">
            El {plan.enganchePct}% del precio. El resto se paga en mensualidades
            {plan.sinIntereses ? ' sin intereses' : ''} directamente con el
            desarrollador, y un último {plan.contraentregaPct}% cuando te
            entregan el lote.
          </p>
        </section>
      )}

      {/* ═══════════ 03 · El desglose ═══════════ */}
      {plan && lote.precioMxn && (
        <section className="bg-[var(--lpe-hueso)] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">
              03 · A dónde va tu dinero
            </p>
            <h2 className="lpe-titular mt-4 max-w-[24ch] text-[clamp(1.75rem,1.3rem+2vw,2.875rem)]">
              Los <span className="lpe-italica">tres pagos</span>, completos
            </h2>
            <p className="lpe-cuerpo mt-5 max-w-[56ch] text-[1.0625rem] leading-relaxed text-[var(--lpe-tinta-2)]">
              Publicamos los tres, no solo el enganche. El{' '}
              {plan.contraentregaPct}% de contraentrega es un pago fuerte y
              esconderlo hasta la llamada es lo que convierte un interesado en
              una discusión.
            </p>

            <div className="mt-12">
              <DesgloseEnganche plan={plan} precioMxn={lote.precioMxn} />
            </div>

            {lote.esquemaPago && (
              <p className="lpe-cuerpo mt-10 max-w-[62ch] border-t border-[var(--lpe-linea)] pt-6 text-[0.8125rem] leading-relaxed text-[var(--lpe-tinta-3)]">
                Esquema declarado por el desarrollador: {lote.esquemaPago}
                {/[.!?]$/.test(lote.esquemaPago.trim()) ? '' : '.'} Los gastos de
                escrituración y el mantenimiento se cotizan aparte, y te los
                desglosamos en el plan que te mandamos.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ═══════════ 04 · Amenidades ═══════════
          La composición del original: a la izquierda el titular con acento en
          itálica y la lista con iconos de trazo fino; a la derecha una cápsula
          de imagen. La diferencia está en el dato — sus amenidades son copy,
          las nuestras salen de columnas booleanas del registro. */}
      {amenidades.length > 0 && (
        <section className="bg-[var(--lpe-blanco)] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">
                04 · La privada
              </p>
              <h2 className="lpe-titular mt-4 max-w-[20ch] text-[clamp(1.75rem,1.3rem+2vw,2.875rem)]">
                <span className="lpe-italica">Disfruta</span> de las amenidades
                que ya están contratadas
              </h2>

              <ul className="mt-9 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {amenidades.map(({ nombre, Icono }) => (
                  <li key={nombre} className="flex items-center gap-3">
                    <span className="shrink-0 text-[var(--lpe-teal-texto)]">
                      <Icono />
                    </span>
                    <span className="lpe-cuerpo text-[0.9375rem] text-[var(--lpe-tinta)]">
                      {nombre}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="lpe-cuerpo mt-8 max-w-[52ch] text-[0.8125rem] leading-relaxed text-[var(--lpe-tinta-3)]">
                Las {amenidades.length} salen de la ficha del desarrollador, no
                de nuestro copy. Se entregan conforme a su calendario de obra, y
                te lo mandamos junto con el plan de pagos.
              </p>
            </div>

            {img.alberca && (
              <div className="lpe-aparece">
                <FiguraRedonda
                  imagen={img.alberca}
                  etiqueta="Alberca comunitaria"
                  aspecto="aspect-[4/5]"
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════ 05 · La galería ═══════════
          El bloque de más peso visual del original —14 imágenes de proyecto— en
          cápsulas de 32 px. Las 8 van diferidas, así que no entran en el LCP. */}
      {galeria.length > 0 && (
        <section className="bg-[var(--lpe-hueso)] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">05 · El proyecto</p>
            <h2 className="lpe-titular mt-4 max-w-[22ch] text-[clamp(1.75rem,1.3rem+2vw,2.875rem)]">
              Esto es lo que hay <span className="lpe-italica">al otro lado</span>{' '}
              de la caseta
            </h2>

            {/* ⚠️ Sin `Reveal` de framer-motion, y es deliberado: esa primitiva
                sirve `initial={{opacity:0}}`, o sea que el CERO viaja en el HTML
                y lo levanta un observer en el cliente. Para un párrafo es un
                riesgo aceptable; para las imágenes que son la razón de ser de la
                sección, no. `.lpe-aparece` es CSS con `animation-timeline:
                view()`: lo conduce el scroll, no puede atascarse en cero, y
                donde no hay soporte la imagen simplemente se ve. */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {galeria.map((g) => (
                <div
                  key={g.clave}
                  className={`lpe-aparece ${g.ancha ? 'col-span-2' : ''}`}
                >
                  <FiguraRedonda
                    imagen={img[g.clave]!}
                    etiqueta={g.etiqueta}
                    aspecto={g.aspecto}
                    // El candidato pedido sigue al span real, o el navegador
                    // descarga el de 3840 px para una cápsula de 368.
                    sizes={
                      g.ancha
                        ? '(min-width: 1024px) 780px, 100vw'
                        : '(min-width: 1024px) 384px, 50vw'
                    }
                    // Pie fuera: ocho pies bajo ocho cápsulas es una columna de
                    // letra chica. El aviso de que son renders va una sola vez,
                    // abajo, y la etiqueta de qué es va dentro de la cápsula.
                    conPie={false}
                  />
                </div>
              ))}
            </div>

            <p className="lpe-cuerpo mt-8 max-w-[62ch] text-[0.8125rem] leading-relaxed text-[var(--lpe-tinta-3)]">
              Las {galeria.length} imágenes de arriba son renders del proyecto
              del desarrollador, no obra existente: hoy la privada no está
              construida. Cómo se ve el terreno HOY está en la siguiente
              sección, y eso sí es fotografía.
            </p>
          </div>
        </section>
      )}

      {/* ═══════════ 06 · Solicitud · 02 ═══════════
          El original repite su formulario cinco veces. Aquí van tres, y esta es
          la del punto de máxima intención: justo después de ver el sitio. */}
      <section className="bg-[var(--lpe-aqua-suave)] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <h2 className="lpe-titular text-[clamp(1.625rem,1.25rem+1.9vw,2.625rem)]">
              ¿Te mandamos el{' '}
              <span className="lpe-italica">calendario de obra</span>?
            </h2>
            <p className="lpe-cuerpo mt-5 max-w-[50ch] text-[1.0625rem] leading-relaxed text-[var(--lpe-tinta-2)]">
              Va junto al plan de pagos: en qué mes entrega el desarrollador cada
              amenidad de la lista, cuáles ya están contratadas y cuáles siguen
              en proyecto. Con fechas, no con «próximamente».
            </p>
          </div>
          <div className="lg:col-span-6">
            <FormEnganche
              variante="medio"
              plazos={plazos}
              loteRef={lote.slug}
              loteTitulo={lote.titulo}
              engancheTexto={engancheTexto}
            />
          </div>
        </div>
      </section>

      {/* ═══════════ 07 · Hoy y proyectado ═══════════
          Esto NO viene del original y es a propósito: su galería es de obra
          entregada y no publica una sola imagen de cómo se ve el terreno el día
          que firmas. Es lo único que ellos no pueden hacer y nosotros sí, y es
          además el par de imágenes que la persona pide en el primer mensaje. */}
      {(img.urbanizacion || img.casasCenital) && (
        <section className="bg-[var(--lpe-blanco)] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">07 · El sitio</p>
            <h2 className="lpe-titular mt-4 max-w-[26ch] text-[clamp(1.75rem,1.3rem+2vw,2.875rem)]">
              Así está <span className="lpe-italica">hoy</span> y así está{' '}
              <span className="lpe-italica">proyectado</span>
            </h2>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:gap-12">
              {img.urbanizacion && (
                <div className="lpe-aparece">
                  <FiguraRedonda
                    imagen={img.urbanizacion}
                    etiqueta="Hoy · fotografía"
                    aspecto="aspect-[4/3]"
                    sizes="(min-width: 1024px) 576px, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
              )}
              {img.casasCenital && (
                <div className="lpe-aparece">
                  <FiguraRedonda
                    imagen={img.casasCenital}
                    etiqueta="Proyectado · render"
                    aspecto="aspect-[4/3]"
                    sizes="(min-width: 1024px) 576px, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
              )}
            </div>

            <p className="lpe-cuerpo mt-10 max-w-[60ch] text-[1.0625rem] leading-relaxed text-[var(--lpe-tinta-2)]">
              Lo que se compra es el terreno
              {superficieM2 ? ` de ${m2(superficieM2)}` : ''}, no la casa. La
              casa la construyes tú, cuando quieras y con quien quieras, dentro
              de lo que permite el reglamento del fraccionamiento.
            </p>
          </div>
        </section>
      )}

      {/* ═══════════ 08 · Las cifras ═══════════
          El «X en números» del original, con una diferencia que importa: su
          banda publica «+16% de plusvalía anualizada» y aquí no hay ninguna
          cifra de rendimiento, porque no tenemos de dónde sacarla. Solo entra
          lo que está en una columna. */}
      {cifras.length > 0 && (
        <section className="lpe-sobre-oscuro bg-[var(--lpe-aztec)] px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="lpe-rotulo text-[var(--lpe-teal)]">08 · En números</p>
            {/* Las etiquetas van ancladas al fondo de la celda, no pegadas a
                su cifra. Medido en producción: «$7,800 MXN» envuelve a dos
                líneas y empujaba su etiqueta 46 px por debajo de las otras
                tres, así que los cuatro pies quedaban a alturas distintas y la
                fila se leía rota. Anclar abajo hace que los pies formen una
                línea sin importar cuántas líneas ocupe el número — y aguanta
                que mañana el dato sea más largo, que es lo que pasará: estas
                cifras salen de la ficha del desarrollador, no de este archivo. */}
            <dl className="mt-10 grid grid-cols-2 items-stretch gap-x-8 gap-y-12 lg:grid-cols-4">
              {cifras.map((c) => (
                <div key={c.pie} className="flex h-full flex-col">
                  <dd className="lpe-cifra text-[clamp(1.875rem,1.3rem+2.4vw,3rem)] tabular-nums text-white">
                    {c.valor}
                  </dd>
                  <dt className="lpe-cuerpo mt-auto pt-3 text-[0.8125rem] leading-snug text-white/55">
                    {c.pie}
                  </dt>
                </div>
              ))}
            </dl>
            <p className="lpe-cuerpo mt-12 max-w-[62ch] border-t border-white/15 pt-6 text-[0.8125rem] leading-relaxed text-white/50">
              Cifras declaradas por el desarrollador y calculadas sobre el precio
              de lista. No publicamos proyecciones de plusvalía: no tenemos una
              fuente que las sostenga.
            </p>
          </div>
        </section>
      )}

      {/* ═══════════ 09 · Cierre ═══════════ */}
      <section className="bg-[var(--lpe-blanco)] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">
              09 · Siguiente paso
            </p>
            <h2 className="lpe-titular mt-4 text-[clamp(1.875rem,1.35rem+2.4vw,3.25rem)]">
              Te mandamos el plan completo y{' '}
              <span className="lpe-italica">tú decides</span>
            </h2>
            <p className="lpe-cuerpo mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-[var(--lpe-tinta-2)]">
              Precio cerrado, enganche, la mensualidad de cada plazo, la
              contraentrega y qué cubre la escritura. En un PDF, por WhatsApp,
              sin que tengas que ir a ninguna oficina para verlo.
            </p>
          </div>

          <div className="lg:col-span-6">
            <FormEnganche
              variante="cierre"
              plazos={plazos}
              loteRef={lote.slug}
              loteTitulo={lote.titulo}
              engancheTexto={engancheTexto}
            />
          </div>
        </div>

        {/* Rótulo del inventario y de las imágenes. Va en el pie porque es
            obligación de honestidad, no argumento de venta, pero va. */}
        <div className="mx-auto mt-16 max-w-6xl">
          <p className="lpe-cuerpo border-t border-[var(--lpe-linea)] pt-6 text-[0.75rem] leading-relaxed text-[var(--lpe-tinta-3)]">
            {lote.estadoComercial ? `Estado: ${lote.estadoComercial}. ` : ''}
            {lote.lotesDisponiblesPrivada && lote.lotesTotalesPrivada
              ? `${lote.lotesDisponiblesPrivada} lotes disponibles de ${lote.lotesTotalesPrivada} declarados por el desarrollador. `
              : ''}
            Las imágenes de esta página son renders del proyecto del
            desarrollador salvo la aérea del polígono, que es fotografía real;
            cada una va rotulada. Precios y condiciones sujetos a cambio sin
            previo aviso.
          </p>
        </div>
      </section>

      <FlotantesEnganche
        engancheTexto={engancheTexto}
        whatsapp={lote.asesor?.whatsapp ?? FALLBACK_WHATSAPP}
        mensajeWa={mensajeWa}
        loteSlug={lote.slug}
      />
    </div>
  );
}
