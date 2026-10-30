import Image from 'next/image';
import Link from 'next/link';
import localFont from 'next/font/local';
import { getCasasRivieraMaya, resumenInventario } from '@/lib/supabase/lp-casas';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero, dineroCompacto } from '../_components/format';
import FormAutonomo from './_components/FormAutonomo';
import Inventario from './_components/Inventario';
import BarraCasas from './_components/BarraCasas';
import { ChipsHero } from '../_components/v2/ChipsUbicacion';
import {
  BadgeCheck,
  Building2,
  Calculator,
  ClipboardCheck,
  CreditCard,
  FileText,
  Home,
  KeySquare,
  Shield,
  Tag,
} from '@/lib/icons';
import { ubicaciones } from '@/lib/supabase/lp-inventario';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import type { CopyCasas } from './_copy';
import '../_components/v2/tokens.css';
import './lpc-theme.css';

// ============================================================
// Landing de pago de CASAS — Riviera Maya (Playa del Carmen + Tulum).
//
// El cuerpo vive AQUÍ y no en `page.tsx` porque lo sirven dos rutas: la
// española (`/lp/casas-riviera-maya`) y la inglesa (`/lp/homes-riviera-maya`),
// para el tráfico de Estados Unidos y Canadá. Cada `page.tsx` aporta solo lo
// que es propio del segmento de ruta —`metadata`, `revalidate`— y elige el
// diccionario. Todo lo demás es literalmente el mismo árbol.
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
//
// ═══ EL INVENTARIO NO SE FILTRA POR IDIOMA ═══
//
// Las dos rutas sirven las MISMAS casas. Un comprador de Denver y uno de
// Monterrey compiten por el mismo inventario, y una página que enseñara un
// subconjunto distinto según el idioma sería otra forma de mentir. Lo único
// que cambia entre rutas son las cadenas.
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
 *
 * Autoalojada, no next/font/google: el porqué está en src/app/layout.tsx.
 */
const display = localFont({
  src: '../../../fonts/archivo-latin.woff2',
  weight: '100 900',
  style: 'normal',
  // Rango del eje wdth tal como lo declaraba Google. Sin este descriptor el
  // navegador trata la cara como de ancho normal y recorta cualquier
  // `font-stretch` a 100%.
  declarations: [
    { prop: 'font-family', value: 'Archivo' },
    { prop: 'font-stretch', value: '62% 125%' },
  ],
  variable: '--font-lpc-display',
  display: 'swap',
});

/**
 * Corrige `<html lang>` antes de la hidratación.
 *
 * El root layout lo deja estático en `"es"` a propósito: resolverlo con
 * `getLocale()` ahí lee `headers()` y convierte TODO el sitio en dinámico —eso
 * causó los 500 `DYNAMIC_SERVER_USAGE` de julio-2026—. `[locale]/layout.tsx`
 * lo arregla con este mismo `<script>`, pero `/lp/*` vive fuera de `[locale]`
 * y no lo hereda, así que la landing en inglés se serviría anunciándose como
 * española al lector de pantalla y al traductor del navegador.
 *
 * Solo se emite cuando hace falta: en español el atributo ya es correcto y un
 * script inline de más en el primer pliegue de una página pagada no se paga
 * solo.
 */
function CorrigeLang({ copy }: { copy: CopyCasas }) {
  if (copy.locale === 'es') return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang=${JSON.stringify(copy.locale)}`,
      }}
    />
  );
}

export default async function PaginaCasas({ copy }: { copy: CopyCasas }) {
  const casas = await getCasasRivieraMaya();
  const resumen = resumenInventario(casas);

  // Inventario vacío es un escenario probable, no un caso borde: basta con que
  // el Hub despublique las once. La página lo trata como ESTADO y sigue
  // capturando —el visitante ya costó dinero—, pero no finge tener casas.
  if (casas.length === 0) {
    return (
      <div className={`lpc-root ${display.variable} bg-[var(--lpc-paper)]`}>
        <CorrigeLang copy={copy} />
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <p className="lpc-etiqueta text-[var(--lpc-signal)]">{copy.vacio.etiqueta}</p>
          <h1 className="lpc-display mt-4 text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] text-[var(--lpc-ink)]">
            {copy.vacio.titulo}
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpc-ink-2)]">
            {copy.vacio.cuerpo}
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[56px] items-center bg-[var(--lpc-ink)] px-7 text-sm uppercase tracking-[0.1em] text-[var(--lpc-paper)]"
          >
            {copy.vacio.cta}
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
    hasta: resumen.hasta,
  };

  // Brief del 30-oct-2026: el titular lleva el «desde» del inventario y el
  // subtítulo dice qué entrega hay, dónde, y qué financiamiento declaran.
  // Todo derivado; si una cifra no existe, su frase no se imprime.
  const [tituloL1, tituloL2] = copy.hero.titulo(rango.desde ? dineroCompacto(rango.desde) : null);
  const hayPreventa = resumen.preventa > 0;
  const hayInmediata = resumen.entregaInmediata > 0;
  const subtitulo = copy.hero.cuerpo({
    ciudades: resumen.ciudades,
    preventa: hayPreventa,
    inmediata: hayInmediata,
    engancheMin: resumen.engancheMinimoPct,
    directo: resumen.financiamientoDirecto,
  });

  const badges: { icono: typeof Home; etiqueta: string; valor: string }[] = [
    { icono: Home, etiqueta: copy.hero.badges.disponibles[0], valor: copy.hero.badges.disponibles[1](casas.length) },
    ...(rango.desde
      ? [{
          icono: Tag,
          etiqueta: copy.hero.badges.rango[0],
          valor: copy.hero.badges.rango[1](dineroCompacto(rango.desde), rango.hasta ? dineroCompacto(rango.hasta) : null),
        }]
      : []),
    ...(resumen.engancheMinimoPct
      ? [{ icono: CreditCard, etiqueta: copy.hero.badges.enganche[0], valor: copy.hero.badges.enganche[1](resumen.engancheMinimoPct) }]
      : []),
    { icono: KeySquare, etiqueta: copy.hero.badges.entrega[0], valor: copy.hero.badges.entrega[1](hayPreventa, hayInmediata) },
  ];

  // Zonas con inventario para los chips del hero (brief de octubre-2026:
  // «botones de cada lugar más visibles desde la primera parte»). El filtro
  // de ubicación de la familia v2 trabaja sobre `PropiedadLanding`; aquí solo
  // hacen falta ciudad y zona.
  const zonas = ubicaciones(
    casas.map((c) => ({ ciudad: c.ciudad, zona: c.zona }) as PropiedadLanding),
    'zona',
  );

  return (
    <div className={`lpc-root lpv ${display.variable} bg-[var(--lpc-paper)] text-[var(--lpc-ink)]`}>
      <CorrigeLang copy={copy} />

      {/* ══════════ HERO ══════════
          Blanco puro. El color de la página lo ponen las casas, no la paleta.
          La cabecera compartida se reinvierte a tinta desde `lpc-theme.css`. */}
      <section id="hero" className="relative">
        <div className="mx-auto max-w-[92rem] px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:pb-24">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            {/* ─── Columna editorial ─── */}
            <div className="lg:col-span-7">
              <div className="lpc-regla pt-4">
                <p className="lpc-etiqueta text-[var(--lpc-signal)]">{copy.hero.etiqueta}</p>
              </div>

              <h1 className="lpc-display mt-7 text-[clamp(2.5rem,1.4rem+4.6vw,5.25rem)] text-[var(--lpc-ink)]">
                {tituloL1}
                <br />
                {tituloL2}
              </h1>

              <p className="mt-7 max-w-[58ch] text-[1.0625rem] leading-relaxed text-[var(--lpc-ink-2)]">
                {subtitulo}
              </p>

              {zonas.length > 1 && (
                <div className="mt-8">
                  <ChipsHero ubicaciones={zonas} tono="claro" etiquetaTodas={copy.inventario.todas} />
                </div>
              )}

              {/* Badges del brief del 30-oct-2026 (disponibles, rango,
                  enganche, entrega) como banda de cifras con filetes e icono,
                  no como cuatro tarjetas. TODOS derivados del inventario; el
                  que no tiene dato no se pinta. */}
              <dl className={`mt-10 grid grid-cols-2 border-t border-[var(--lpc-line-strong)] ${badges.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
                {badges.map(({ icono: Icono, etiqueta, valor }) => (
                  <div
                    key={etiqueta}
                    className="border-b border-[var(--lpc-line)] py-5 pr-4 sm:border-b-0"
                  >
                    <dt className="flex items-center gap-2">
                      <Icono className="h-4 w-4 text-[var(--lpc-signal)]" strokeWidth={1.75} aria-hidden />
                      <span className="lpc-etiqueta text-[var(--lpc-ink-3)]">{etiqueta}</span>
                    </dt>
                    <dd className="lpc-titulo lpc-cifra mt-2.5 text-[1.0625rem] leading-snug text-[var(--lpc-ink)]">
                      {valor}
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
                        alt={copy.hero.altFoto(casa.zona ?? casa.ciudad, casa.ciudad)}
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
                <FormAutonomo
                  casas={opciones}
                  telefonoWhatsApp={FALLBACK_WHATSAPP}
                  locale={copy.locale}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ INVENTARIO + FORMULARIO DE CIERRE ══════════ */}
      <Inventario casas={casas} telefonoWhatsApp={FALLBACK_WHATSAPP} locale={copy.locale} />

      {/* ══════════ LO QUE REVISAMOS ANTES DE PUBLICAR ══════════
          Brief del 30-oct-2026, en su versión moderada: se cuenta el proceso,
          no se garantiza nada «100%». En claro y en dos columnas (título a la
          izquierda, filas con filete a la derecha) para no repetir la banda
          oscura de tres tarjetas que viene justo después. */}
      <section className="lpc-regla bg-[var(--lpc-paper-2)]">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-12">
          <h2 className="lpc-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] text-[var(--lpc-ink)] lg:col-span-5">
            {copy.revision.titulo}
          </h2>
          <ul className="divide-y divide-[var(--lpc-line)] border-y border-[var(--lpc-line-strong)] lg:col-span-7">
            {copy.revision.puntos.map(([titulo, cuerpo], i) => {
              const Icono = [Shield, Building2, FileText][i] ?? Shield;
              return (
                <li key={titulo} className="grid grid-cols-[2rem_1fr] gap-x-4 py-6 sm:grid-cols-[2.5rem_14rem_1fr] sm:gap-x-6">
                  <Icono className="mt-0.5 h-6 w-6 text-[var(--lpc-signal)]" strokeWidth={1.5} aria-hidden />
                  <h3 className="lpc-titulo text-[1.0625rem] leading-snug text-[var(--lpc-ink)]">{titulo}</h3>
                  <p className="col-start-2 mt-2 text-[0.9375rem] leading-relaxed text-[var(--lpc-ink-2)] sm:col-start-3 sm:mt-0">
                    {cuerpo}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ══════════ CÓMO PUBLICAMOS ══════════
          Tres afirmaciones verificables. Vivían entre el hero y el inventario;
          el brief de octubre-2026 las manda al final (o fuera): aquí quedan,
          reescritas y compactas, después de la conversión y antes del pie. */}
      {/* Banda oscura con icono por afirmación, como el ejemplo del brief
          del 30-oct-2026. La primera va resaltada con el bermellón de
          estado; las otras dos se resaltan al pasar el cursor. */}
      <section className="bg-[var(--lpc-dark)]">
        <div className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 sm:py-14">
          <ul className="grid gap-3 sm:grid-cols-3">
            {copy.afirmaciones.map(([titulo, cuerpo], i) => {
              const Icono = [BadgeCheck, ClipboardCheck, Calculator][i] ?? BadgeCheck;
              return (
                <li
                  key={titulo}
                  className="lpc-afirmacion group border border-[var(--lpc-line-dark)] p-6 transition-colors duration-300 sm:p-7"
                >
                  <Icono className="h-7 w-7 text-[var(--lpc-signal-on-dark)] transition-colors duration-300 group-hover:text-[var(--lpc-ink)]" strokeWidth={1.5} aria-hidden />
                  <h3 className="lpc-titulo mt-5 text-[1.125rem] text-[var(--lpc-on-dark)] transition-colors duration-300 group-hover:text-[var(--lpc-ink)]">{titulo}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[var(--lpc-on-dark-2)] transition-colors duration-300 group-hover:text-[var(--lpc-ink)]">{cuerpo}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ══════════ PIE MÍNIMO ══════════
          Los ÚNICOS enlaces de salida de la página, y son obligatorios por ley.
          No hay menú, no hay «ver más propiedades», no hay redes. */}
      <footer className="bg-[var(--lpc-dark)] pb-24 sm:pb-8">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-3 border-t border-[var(--lpc-line-dark)] px-5 py-7 text-xs text-[var(--lpc-on-dark-3)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="max-w-[62ch] leading-relaxed">
            {copy.pie.aviso}
            {rango.desde && rango.hasta ? (
              <>
                {' '}
                {copy.pie.inventario(casas.length, dinero(rango.desde), dinero(rango.hasta))}
              </>
            ) : null}
          </p>
          {/* `prefetch={false}` en los dos: son los únicos enlaces de salida de
              la página y casi nadie los pulsa. Con el prefetch por defecto,
              cada visita pagada descargaría además el bundle de dos páginas del
              sitio que no va a ver — coste de LCP a cambio de nada. */}
          <nav className="flex shrink-0 gap-5">
            <Link
              href={copy.legal.privacidadHref}
              prefetch={false}
              className="underline underline-offset-2 hover:text-[var(--lpc-on-dark-2)]"
            >
              {copy.legal.privacidad}
            </Link>
            <Link
              href={copy.legal.terminosHref}
              prefetch={false}
              className="underline underline-offset-2 hover:text-[var(--lpc-on-dark-2)]"
            >
              {copy.legal.terminos}
            </Link>
          </nav>
        </div>
      </footer>

      <BarraCasas
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        totalCasas={casas.length}
        locale={copy.locale}
      />
    </div>
  );
}
