import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Archivo } from 'next/font/google';
import { getCasasRivieraMaya, resumenInventario } from '@/lib/supabase/lp-casas';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero, dineroCompacto } from '../_components/format';
import FormAutonomo from './_components/FormAutonomo';
import Inventario from './_components/Inventario';
import BarraCasas from './_components/BarraCasas';
import './lpc-theme.css';

// ============================================================
// Landing de pago de CASAS — Riviera Maya (Playa del Carmen + Tulum).
//
// Tercera landing de `app/lp/`, y la primera que vende producto TERMINADO. Las
// otras dos venden suelo: lote y terreno, donde el argumento es el plan de
// pagos y el estatus de urbanización. Aquí el argumento son once casas que
// existen, con su precio, y la única pregunta que la página tiene que
// contestar es «¿de verdad tienen casas y de verdad cuestan eso?».
//
// ═══ UN SOLO OBJETIVO, Y LAS CONSECUENCIAS QUE TRAE ═══
//
// La página convierte o no sirve. Eso se traduce en decisiones que parecen
// omisiones y no lo son:
//
//   · CERO ENLACES DE SALIDA salvo los legales. Ni a /propiedades/[slug], ni a
//     una galería, ni al sitio. Las tarjetas de la cuadrícula NO son enlaces:
//     seleccionan una casa y bajan al formulario. Un visitante pagado que se va
//     a navegar el catálogo es un visitante que no vuelve al campo de teléfono.
//   · EL FORMULARIO ESTÁ MONTADO Y CON SUS CAMPOS A LA VISTA desde el primer
//     pixel, en el hero y otra vez al cierre. La lección está pagada en la
//     landing de lotes: $991.40 MXN en 72 clics con cero envíos porque el
//     formulario vivía detrás de una compuerta de calificación.
//   · LOS DOS CANALES QUE PROMETE EL ANUNCIO —dossier por correo y WhatsApp—
//     conviven en cada punto de conversión, con el dossier primero. WhatsApp
//     convierte más cómodo pero califica menos y no deja lead si nadie
//     contesta; al mismo peso visual se come el correo al que va la ficha.
//
// ═══ TRES REGLAS DE DATO QUE NO SE NEGOCIAN ═══
//
//   1. TODA cifra sale de `getCasasRivieraMaya()`. Ni el titular escribe un
//      número a mano: «once casas» y «desde $4.4 M» se derivan del inventario,
//      así que cuando se venda una, el titular cambia solo en la siguiente
//      revalidación. Un titular hardcodeado se desincroniza del listado que
//      tiene debajo y la página empieza a mentir sin que nadie la toque.
//   2. NINGÚN NOMBRE DE DESARROLLO NI DE DESARROLLADOR llega al DOM. El data
//      layer ni siquiera selecciona esas columnas. Nombrar al desarrollador en
//      pauta pagada es una decisión comercial que nadie ha tomado.
//   3. NADA DE URGENCIA INVENTADA. No hay contadores, ni «quedan 2», ni
//      «oferta termina hoy». Lo único que se publica sobre escasez es cuántas
//      casas hay publicadas, que es un hecho verificable contra el sistema.
//
// ═══ POR QUÉ NO SE PUBLICA LA MENSUALIDAD ═══
//
// El registro declara $410,479 y $363,333 «mensuales» en dos casas de 5.7 y
// 10.9 millones. No son mensualidades: es un dato mal capturado en el Hub. El
// enganche sí cuadra contra el precio en las ocho casas que lo declaran, así
// que ese se publica y la mensualidad no. Ver la cabecera de `lp-casas.ts`.
// ============================================================

/**
 * Archivo, con el eje de ANCHO. Es la decisión, no la familia.
 *
 * A peso 600 y tracking -0.045em en titulares grandes, las palabras se
 * compactan en un bloque de tinta: el gesto de portada de revista de
 * arquitectura, que es el registro entero de esta página. La misma familia a
 * ancho y peso normales hace el texto corrido sin cambiar de voz, así que una
 * sola tipografía sostiene el documento y no hace falta el par display+cuerpo
 * que lleva cualquier landing.
 *
 * Se comparte el nombre de variable con el tema (`--font-lpc-display`), que la
 * consume en `.lpc-display` y `.lpc-titulo`.
 */
const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-lpc-display',
  display: 'swap',
});

// ISR: el inventario cambia sin deploy. 5 minutos es suficientemente fresco
// para que un anuncio no cite un precio que la página ya no muestra, y evita
// pegarle a Supabase en cada impresión pagada.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Casas en venta en Playa del Carmen y Tulum | Precios reales | Propyte',
  description:
    'Inventario real de casas en la Riviera Maya con precio, enganche y disponibilidad verificados. Recibe el dossier completo por correo o pregunta por WhatsApp.',
  // El layout de /lp ya declara noindex; se repite aquí para que la landing no
  // dependa de que nadie toque el layout compartido.
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default async function LandingCasasRivieraMaya() {
  const casas = await getCasasRivieraMaya();
  const resumen = resumenInventario(casas);

  // Inventario vacío es un escenario probable, no un caso borde: basta con que
  // el Hub despublique las once. La página lo trata como ESTADO y sigue
  // capturando —el visitante ya costó dinero—, pero no finge tener casas.
  if (casas.length === 0) {
    return (
      <div className={`lpc-root ${display.variable} bg-[var(--lpc-paper)]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <p className="lpc-etiqueta text-[var(--lpc-signal)]">Inventario</p>
          <h1 className="lpc-display mt-4 text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] text-[var(--lpc-ink)]">
            Ahora mismo no tenemos casas publicadas en la Riviera Maya.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpc-ink-2)]">
            No vamos a mostrarte departamentos como si fueran casas. Escríbenos y te avisamos en
            cuanto entre inventario, con los números completos.
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[56px] items-center bg-[var(--lpc-ink)] px-7 text-sm uppercase tracking-[0.1em] text-[var(--lpc-paper)]"
          >
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));

  // Tríptico del hero: las tres primeras casas CON foto.
  //
  // Tres fotos reales y no una a sangre. La razón es de riesgo, y conviene
  // dejarla escrita: una sola imagen a pantalla completa apuesta el primer
  // pliegue entero a que ESA foto sea buena, y las fotos las sube cada
  // desarrollador al Hub sin dirección de arte. Tres, en formato de lámina,
  // aguantan que una salga floja y además dicen de un vistazo lo que la página
  // promete —hay VARIAS casas—, que es justo la duda del tráfico frío.
  const triptico = casas.filter((c) => c.imagen).slice(0, 3);

  const rango = {
    desde: resumen.desde,
    hasta: casas[casas.length - 1]?.precio ?? null,
  };

  return (
    <div className={`lpc-root ${display.variable} bg-[var(--lpc-paper)] text-[var(--lpc-ink)]`}>
      {/* ══════════ HERO ══════════
          Blanco puro. El color de la página lo ponen las casas, no la paleta.
          La cabecera compartida se reinvierte a tinta desde `lpc-theme.css`. */}
      <section id="hero" className="relative">
        <div className="mx-auto max-w-[92rem] px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:pb-24">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            {/* ─── Columna editorial ─── */}
            <div className="lg:col-span-7">
              <div className="lpc-regla pt-4">
                <p className="lpc-etiqueta text-[var(--lpc-signal)]">
                  Inventario verificado · Playa del Carmen y Tulum
                </p>
              </div>

              <h1 className="lpc-display mt-7 text-[clamp(2.5rem,1.4rem+4.6vw,5.25rem)] text-[var(--lpc-ink)]">
                {casas.length} casas reales,
                <br />
                con su precio real.
              </h1>

              <p className="mt-8 max-w-[54ch] text-[1.0625rem] leading-relaxed text-[var(--lpc-ink-2)]">
                No es un catálogo de renders ni una lista de «desde». Son las casas que tenemos
                publicadas hoy en la Riviera Maya, cada una con su precio cerrado, su enganche y su
                disponibilidad. Déjanos tus datos y te mandamos los números de todas.
              </p>

              {/* Cifras del encabezado, TODAS derivadas del inventario. */}
              <dl className="mt-12 grid grid-cols-2 border-t border-[var(--lpc-line-strong)] sm:grid-cols-4">
                {[
                  { t: 'Disponibles', v: String(casas.length), s: 'casas publicadas' },
                  {
                    t: 'Desde',
                    v: rango.desde ? dineroCompacto(rango.desde) : '—',
                    s: 'precio de entrada',
                  },
                  {
                    t: 'Hasta',
                    v: rango.hasta ? dineroCompacto(rango.hasta) : '—',
                    s: 'tope del inventario',
                  },
                  {
                    t: 'Enganche',
                    v: resumen.engancheMinimoPct ? `${resumen.engancheMinimoPct}%` : '—',
                    s: 'el más bajo publicado',
                  },
                ].map((cifra) => (
                  <div
                    key={cifra.t}
                    className="border-b border-[var(--lpc-line)] py-5 pr-4 sm:border-b-0"
                  >
                    <dt className="lpc-etiqueta text-[var(--lpc-ink-3)]">{cifra.t}</dt>
                    <dd className="lpc-display lpc-cifra mt-2 text-[1.375rem] leading-none text-[var(--lpc-ink)]">
                      {cifra.v}
                    </dd>
                    <dd className="mt-1.5 text-xs leading-snug text-[var(--lpc-ink-3)]">
                      {cifra.s}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Tríptico. `priority` solo en la primera: es la única candidata
                  real a LCP y marcar las tres competiría por el mismo ancho de
                  banda que el resto del primer pliegue. */}
              {triptico.length > 0 && (
                <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-3">
                  {triptico.map((casa, i) => (
                    <figure key={casa.id} className="relative aspect-[3/4] bg-[var(--lpc-paper-2)]">
                      <Image
                        src={casa.imagen as string}
                        alt={`Casa en ${casa.zona ?? casa.ciudad}, ${casa.ciudad}`}
                        fill
                        priority={i === 0}
                        sizes="(min-width: 1024px) 19vw, 31vw"
                        className="lpc-foto-hero object-cover"
                      />
                      <figcaption className="lpc-etiqueta absolute inset-x-0 bottom-0 bg-[var(--lpc-ink)]/85 px-2 py-1.5 text-[0.5625rem] tracking-[0.1em] text-[var(--lpc-on-dark)]">
                        {casa.ciudad}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Columna de conversión ───
                El panel oscuro es el único elemento invertido del primer
                pliegue: en un documento monocromo la inversión ES la jerarquía,
                y aquí señala sin ambigüedad dónde está la acción. */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <FormAutonomo casas={opciones} telefonoWhatsApp={FALLBACK_WHATSAPP} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ QUÉ ES ESTA PÁGINA ══════════
          Tres afirmaciones verificables, en lugar de la banda de «beneficios»
          que llevaría cualquier landing. Cada una es comprobable contra el
          propio documento, que es lo que la hace útil en tráfico frío. */}
      <section className="lpc-regla bg-[var(--lpc-paper-2)]">
        <div className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 sm:py-16">
          <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-3">
            {[
              [
                'Precio publicado, no «desde»',
                'Cada casa de abajo lleva su precio cerrado en la moneda en que se vende. Dos se venden en dólares y se publican en dólares — sin tipo de cambio inventado.',
              ],
              [
                'Si no lo sabemos, lo decimos',
                'Donde el desarrollador no declaró una cifra verás «Confirmar», no un estimado. Preferimos un hueco honesto a un número que el asesor tenga que desmentir.',
              ],
              [
                'Sin mensualidades de adorno',
                'Publicamos el enganche porque cuadra contra el precio. La mensualidad la calculamos contigo según el esquema real de cada desarrollador.',
              ],
            ].map(([titulo, cuerpo]) => (
              <li key={titulo} className="border-t border-[var(--lpc-line-strong)] pt-4">
                <h3 className="lpc-titulo text-[1.0625rem] text-[var(--lpc-ink)]">{titulo}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--lpc-ink-2)]">{cuerpo}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ INVENTARIO + FORMULARIO DE CIERRE ══════════ */}
      <Inventario casas={casas} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══════════ PIE MÍNIMO ══════════
          Los ÚNICOS enlaces de salida de la página, y son obligatorios por ley.
          No hay menú, no hay «ver más propiedades», no hay redes. */}
      <footer className="bg-[var(--lpc-dark)] pb-24 sm:pb-8">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-3 border-t border-[var(--lpc-line-dark)] px-5 py-7 text-xs text-[var(--lpc-on-dark-3)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="max-w-[62ch] leading-relaxed">
            Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación
            con el desarrollador. Propyte no es la desarrolladora de estos inmuebles.
            {rango.desde && rango.hasta ? (
              <>
                {' '}
                Inventario publicado: {casas.length} casas de {dinero(rango.desde)} a{' '}
                {dinero(rango.hasta)}.
              </>
            ) : null}
          </p>
          {/* `prefetch={false}` en los dos: son los únicos enlaces de salida de
              la página y casi nadie los pulsa. Con el prefetch por defecto,
              cada visita pagada descargaría además el bundle de dos páginas del
              sitio que no va a ver — coste de LCP a cambio de nada. */}
          <nav className="flex shrink-0 gap-5">
            <Link
              href="/es/privacidad"
              prefetch={false}
              className="underline underline-offset-2 hover:text-[var(--lpc-on-dark-2)]"
            >
              Privacidad
            </Link>
            <Link
              href="/es/terminos"
              prefetch={false}
              className="underline underline-offset-2 hover:text-[var(--lpc-on-dark-2)]"
            >
              Términos
            </Link>
          </nav>
        </div>
      </footer>

      <BarraCasas telefonoWhatsApp={FALLBACK_WHATSAPP} totalCasas={casas.length} />
    </div>
  );
}
