import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  TIPOS_TERRENO,
  getInventario,
  resumenInventario,
  type PropiedadLanding,
} from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { Banknote, FileCheck, Map } from '@/lib/icons';
import { dinero, mxn } from '../_components/format';
import { filtroPlazo, filtroPresupuesto, filtroUbicacion, filtros } from '../_components/v2/filtros';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import FormInventario from '../_components/v2/FormInventario';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import ChipsHero from './_components/ChipsHero';
import { FORM, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpt2-theme.css';

// ============================================================
// Landing de pago: TERRENOS EN LA RIVIERA MAYA (segunda versión, 30-oct-2026).
//
// Lógica: CATÁLOGO TÉCNICO. Quien compra suelo compara superficie, precio,
// precio por metro y plazo, así que la página es una tabla grande que se
// abre fila por fila, no una galería. Cuatro movimientos:
//
//   1. Hero tipográfico sobre blanco (brief del 30-oct-2026): «Invierte en
//      la Riviera Maya desde $X» con «Lotes residenciales» debajo, subtítulo
//      con ciudades, enganche y plazo reales, tres datos con filete (lotes,
//      documentación, financiamiento), ciudad y plazo como filtro, y el
//      FORMULARIO FIJO a la derecha del titular. La foto aérea va bajo el
//      texto, en la columna izquierda, sin nada encima.
//   2. El catálogo: un mapa con los puntos del inventario (el que pidió el
//      brief) y filas de ancho completo con la superficie como cifra
//      principal; cada una se abre con fotos y plan por plazo.
//   3. La línea de comercializadora, sola y grande.
//   4. El formulario sobre un bloque cobalto, y las preguntas.
//
// Reglas heredadas: toda cifra sale del inventario; ningún nombre de
// desarrollo llega al DOM; la mensualidad se calcula y se rotula como
// orientativa; cero urgencia inventada.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Terrenos residenciales en la Riviera Maya | Precio por m² y plan de pagos',
  description:
    'Terrenos y lotes residenciales publicados hoy en Playa del Carmen, Tulum y Cancún con superficie, precio por metro cuadrado y plazos declarados. Recibe precio, plano y plan de pagos por correo.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

// Archivo con eje de ancho: la misma familia de la v3 del home.
const display = localFont({
  src: '../../../fonts/archivo-latin.woff2',
  weight: '100 900',
  style: 'normal',
  declarations: [
    { prop: 'font-family', value: 'Archivo' },
    { prop: 'font-stretch', value: '62% 125%' },
  ],
  variable: '--font-lpt2-display',
  display: 'swap',
});

/**
 * Cortes de presupuesto que caen DENTRO del rango real de precios: así cada
 * rango tiene lotes y ninguno se publica vacío (`filtroPresupuesto` descarta
 * los que queden sin propiedades de todos modos).
 */
function cortesPresupuesto(lotes: PropiedadLanding[]): number[] {
  const montos = lotes.filter((l) => l.precio?.moneda === 'MXN').map((l) => l.precio!.monto);
  if (montos.length < 2) return [];
  const min = Math.min(...montos);
  const max = Math.max(...montos);
  const escalera = [500_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
  return escalera.filter((c) => c > min && c <= max).slice(0, 3);
}

/** «Tulum, Playa del Carmen y Cancún» a partir de las ciudades con inventario. */
function listaCiudades(ciudades: string[]): string {
  if (ciudades.length <= 1) return ciudades[0] ?? '';
  return `${ciudades.slice(0, -1).join(', ')} y ${ciudades[ciudades.length - 1]}`;
}

/**
 * Subtítulo del brief con las cifras del Hub en vez de las del borrador:
 * nada de «listos para escriturar» ni «sin intereses», que el inventario no
 * respalda. Cada tramo entra solo si su dato existe.
 */
function subtitulo(resumen: ReturnType<typeof resumenInventario>, mesesMax: number): string {
  const frases: string[] = [];
  if (resumen.ciudades.length > 0) frases.push(`Terrenos en ${listaCiudades(resumen.ciudades)}.`);
  const plan: string[] = [];
  if (resumen.engancheMinimoPct) plan.push(`enganches desde el ${resumen.engancheMinimoPct}%`);
  if (mesesMax > 0) plan.push(`hasta ${mesesMax} meses`);
  if (plan.length > 0) frases.push(`Planes de financiamiento con ${plan.join(' y ')}.`);
  return frases.join(' ');
}

export default async function LandingTerrenosRivieraMaya() {
  const lotes = await getInventario({ tipos: TIPOS_TERRENO });
  const resumen = resumenInventario(lotes);
  const mesesMax = Math.max(0, ...lotes.flatMap((l) => l.mesesOpciones));
  const mensajeWa = FORM.whatsappGenerico;

  // Tercer dato del hero: la mensualidad solo si algún desarrollador la
  // declara (hoy dos lotes); si no, el plazo máximo. Nunca una cifra calculada.
  const mensualidades = lotes.map((l) => l.mensualidadMxn).filter((m): m is number => m !== null);
  const datoFinanciamiento =
    mensualidades.length > 0
      ? `Mensualidades declaradas desde ${mxn(Math.min(...mensualidades))}`
      : mesesMax > 0
        ? `Planes hasta ${mesesMax} meses`
        : null;
  const datos = [
    { Icono: Map, texto: `${resumen.total} ${resumen.total === 1 ? 'lote disponible' : 'lotes disponibles'}` },
    { Icono: FileCheck, texto: 'Documentación revisada antes de publicar' },
    ...(datoFinanciamiento ? [{ Icono: Banknote, texto: datoFinanciamiento }] : []),
  ];
  const opciones = lotes.map((l) => ({ slug: l.slug, titulo: l.titulo }));

  // Filtros con conteo real. Ciudad y plazo van también en el hero; los tres
  // viven en la barra pegajosa del catálogo y en el formulario.
  const defs = filtros(
    filtroUbicacion(lotes, 'ciudad', 'Ciudad'),
    filtroPlazo(lotes),
    filtroPresupuesto(lotes, cortesPresupuesto(lotes)),
  );
  const defsHero = defs.filter((d) => d.id === 'ubicacion' || d.id === 'plazo');

  if (lotes.length === 0) {
    return (
      <div className={`lpv lpt2-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpt2-display text-[clamp(2rem,1.3rem+2.5vw,3.25rem)]">
            Ahora mismo no tenemos terrenos publicados en la Riviera Maya.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[52px] items-center rounded-full bg-[var(--lpv-fg)] px-7 text-sm font-medium text-white"
          >
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Banda aérea: el lote con más fotos propias, que suele ser el mejor
  // fotografiado desde el aire.
  const banda = [...lotes].filter((l) => l.imagen).sort((a, b) => b.imagenes.length - a.imagenes.length)[0] ?? null;

  return (
    <div className={`lpv lpt2-root ${display.variable}`}>
      {/* ══ 1 · HERO tipográfico con el formulario fijo a la derecha ══ */}
      <section id="hero" className="bg-white">
        {/* `minmax(0,1fr)` + `min-w-0`: la fila de chips desplazable no puede
            ensanchar la columna en móvil (desbordaba 230 px a 375). */}
        <div className="mx-auto grid max-w-[96rem] grid-cols-[minmax(0,1fr)] gap-10 px-5 pb-10 pt-24 sm:px-8 sm:pt-28 lg:grid-cols-12 lg:gap-12 lg:items-start">
          <div className="min-w-0 lg:col-span-7">
            <h1 className="lpt2-display text-[var(--lpv-fg)]">
              <span className="block text-[clamp(2.5rem,1.4rem+3.6vw,4.75rem)]">
                Invierte en la Riviera Maya
                {resumen.desde && (
                  <>
                    {' '}
                    desde <span className="whitespace-nowrap">{dinero(resumen.desde)}</span>
                  </>
                )}
              </span>
              <span className="lpt2-display-ligero mt-3 block text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] text-[var(--lpv-fg-2)]">
                Lotes residenciales
              </span>
            </h1>

            <p className="mt-6 max-w-[58ch] text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-relaxed text-[var(--lpv-fg-2)]">
              {subtitulo(resumen, mesesMax)}
            </p>

            {/* Tres datos con filete, no tres tarjetas. */}
            <ul className="mt-8 flex flex-col divide-y divide-[var(--lpv-line)] border-y border-[var(--lpv-line)] sm:flex-row sm:divide-x sm:divide-y-0">
              {datos.map(({ Icono, texto }) => (
                <li key={texto} className="flex items-center gap-3 py-3 sm:flex-1 sm:px-5 sm:first:pl-0 sm:last:pr-0">
                  <Icono className="h-5 w-5 shrink-0 text-[var(--lpv-accent)]" aria-hidden />
                  <span className="text-[0.9375rem] leading-snug text-[var(--lpv-fg)]">{texto}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <ChipsHero defs={defsHero} />
            </div>

            {/* Foto aérea, sin texto encima. */}
            {banda?.imagen && (
              <figure className="relative mt-10 aspect-[4/3] w-full overflow-hidden bg-[var(--lpv-bg-2)] sm:aspect-[16/9]">
                <Image
                  src={banda.imagen}
                  alt={`${banda.titulo}, ${ubicacionCorta(banda)}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                />
              </figure>
            )}
          </div>

          {/* El formulario acompaña al titular y se queda fijo mientras la
              columna izquierda baja hasta la foto. */}
          <div className="min-w-0 lg:col-span-5 lg:sticky lg:top-6 lg:self-start">
            <FormInventario
              source="lp_terrenos_rm"
              variante="hero"
              copy={FORM}
              opciones={opciones}
              telefonoWhatsApp={FALLBACK_WHATSAPP}
              filtros={defs}
              propiedades={lotes}
            />
          </div>
        </div>
      </section>

      {/* ══ 2 · CATÁLOGO + 3 · COMERCIALIZADORA + 4 · FORMULARIO ══ */}
      <Catalogo lotes={lotes} defs={defs} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ 5 · PREGUNTAS ══ */}
      <div className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <h2 className="lpt2-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] lg:col-span-4">
            Lo que preguntan antes de comprar un terreno
          </h2>
          <div className="lg:col-span-8 lg:col-start-5">
            <FaqAcordeon faqs={FAQ_COMPRA_Y_FINANCIAMIENTO} titulo="" className="[&>h2]:hidden [&>div]:mt-0" />
          </div>
        </div>
      </div>

      <PieLegal
        tono="claro"
        aviso={PIE_AVISO}
        inventario={
          resumen.desde && resumen.hasta
            ? `Inventario publicado: ${resumen.total} terrenos de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
      />

      <BarraMovil
        etiqueta="Recibir lista de precios y planos"
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_terrenos_rm_barra_movil"
      />
    </div>
  );
}
