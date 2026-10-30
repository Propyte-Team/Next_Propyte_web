import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { MessageCircle } from '@/lib/icons';
import {
  TIPOS_CASA,
  getInventario,
  resumenInventario,
  type PropiedadLanding,
} from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero, m2 } from '../_components/format';
import FormInventario from '../_components/v2/FormInventario';
import GaleriaFicha from '../_components/v2/GaleriaFicha';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { ESTADO_TEXTO, ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import { FORM, PASOS, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpm-theme.css';

// ============================================================
// Landing de pago: CASAS EN MÉRIDA.
//
// Lectura del brief: familia mexicana que compra primera o segunda casa en
// Mérida, ticket más bajo que la Riviera. Referencia de conversión: la ficha
// de un solo inmueble con formulario al lado (Compass / Redfin listing
// detail), porque hoy el Hub publica UNA casa en Mérida. La página se
// construye para que una sola casa se lea completa y honesta, y para que con
// dos o más aparezca el listado sin tocar nada.
//
// Reglas heredadas de la familia: toda cifra sale del inventario; ningún
// nombre de desarrollo llega al DOM; cero urgencia inventada; nada sobre
// colegios, seguridad o plusvalía que el dato no respalde.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Casas en venta en Mérida | Precio y enganche publicados',
  description:
    'Casas publicadas hoy en Mérida con precio cerrado, enganche y disponibilidad. Recibe la ficha completa por correo y habla con un asesor por WhatsApp.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

const display = localFont({
  src: '../../../fonts/sora-latin.woff2',
  weight: '300 700',
  style: 'normal',
  declarations: [{ prop: 'font-family', value: 'Sora' }],
  variable: '--font-lpm-display',
  display: 'swap',
});

/** Celdas de la ficha. Solo las que tienen dato: nunca un guion. */
function celdasFicha(casa: PropiedadLanding): { etiqueta: string; valor: string }[] {
  const celdas: { etiqueta: string; valor: string }[] = [];
  if (casa.recamaras) celdas.push({ etiqueta: 'Recámaras', valor: String(casa.recamaras) });
  if (casa.banos) celdas.push({ etiqueta: 'Baños', valor: String(casa.banos) });
  if (casa.m2Construidos) celdas.push({ etiqueta: 'Construcción', valor: m2(casa.m2Construidos) });
  if (casa.m2Terreno) celdas.push({ etiqueta: 'Terreno', valor: m2(casa.m2Terreno) });
  if (casa.enganchePct) celdas.push({ etiqueta: 'Enganche', valor: `${casa.enganchePct}%` });
  celdas.push({ etiqueta: 'Estado', valor: ESTADO_TEXTO[casa.estadoComercial] });
  return celdas;
}

/** Párrafo compuesto SOLO con los campos presentes. */
function descripcionFicha(casa: PropiedadLanding): string {
  const partes: string[] = ['Casa'];
  if (casa.recamaras) partes.push(`de ${casa.recamaras} recámaras`);
  partes.push(`en ${ubicacionCorta(casa)}`);
  if (casa.m2Construidos && casa.m2Terreno) {
    partes.push(`, con ${m2(casa.m2Construidos)} de construcción sobre ${m2(casa.m2Terreno)} de terreno`);
  } else if (casa.m2Construidos) {
    partes.push(`, con ${m2(casa.m2Construidos)} de construcción`);
  } else if (casa.m2Terreno) {
    partes.push(`, sobre ${m2(casa.m2Terreno)} de terreno`);
  }
  return `${partes.join(' ').replace(/ ,/g, ',')}.`;
}

export default async function LandingCasasMerida() {
  const casas = await getInventario({ tipos: TIPOS_CASA, ciudades: ['Mérida'] });
  const resumen = resumenInventario(casas);
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));
  const principal = casas[0] ?? null;
  const mensajeWa = FORM.whatsappGenerico;
  const hrefWa = `https://wa.me/${FALLBACK_WHATSAPP}?${new URLSearchParams({ text: mensajeWa }).toString()}`;

  if (!principal) {
    return (
      <div className={`lpv lpm-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpv-display text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em]">
            Ahora mismo no tenemos casas publicadas en Mérida.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a
            href={hrefWa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[52px] items-center rounded-[var(--lpv-r-control)] bg-[var(--lpv-accent)] px-7 text-sm font-semibold text-[var(--lpv-on-accent)]"
          >
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const una = casas.length === 1;
  const subtitulo = (() => {
    const partes: string[] = [];
    if (una && principal.precio) partes.push(dinero(principal.precio));
    else if (resumen.desde) partes.push(`Desde ${dinero(resumen.desde)}`);
    if (resumen.engancheMinimoPct) {
      partes.push(
        una ? `con enganche del ${resumen.engancheMinimoPct}%` : `con enganche desde ${resumen.engancheMinimoPct}%`,
      );
    }
    return partes.length > 0 ? `${partes.join(' ')}. Precio cerrado y disponibilidad verificada.` : 'Precio cerrado, enganche y disponibilidad verificada.';
  })();

  return (
    <div className={`lpv lpm-root ${display.variable}`}>
      {/* ══ HERO: titular, subtítulo, dos CTA, galería de la casa, formulario ══ */}
      <section id="hero" className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 className="lpv-display text-[clamp(2.25rem,1.4rem+3.6vw,4.25rem)] font-semibold leading-[1.0] tracking-[-0.035em] text-[var(--lpv-fg)]">
                {una ? `Casa en venta en Mérida, ${principal.zona ?? 'Yucatán'}` : `${resumen.total} casas en venta en Mérida`}
              </h1>
              <p className="mt-5 max-w-[50ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
                {subtitulo}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#solicitar"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[var(--lpv-r-control)] bg-[var(--lpv-accent)] px-7 text-sm font-semibold text-[var(--lpv-on-accent)] transition-opacity duration-200 hover:opacity-90 active:translate-y-px"
                >
                  Recibir la ficha
                </a>
                <a
                  href={hrefWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[var(--lpv-r-control)] border border-[var(--lpv-line-2)] px-6 text-sm font-medium text-[var(--lpv-fg)] transition-colors duration-200 hover:border-[var(--lpv-fg)] active:translate-y-px"
                >
                  <MessageCircle className="h-4 w-4" style={{ color: 'var(--lpv-wa)' }} aria-hidden />
                  Escribir por WhatsApp
                </a>
              </div>

              {/* Galería de la casa principal: la prueba de que existe, en el
                  primer pliegue. Carrusel nativo, diez fotos como máximo. */}
              <div className="mt-9">
                <GaleriaFicha
                  imagenes={principal.imagenes}
                  alt={`${principal.titulo}, ${ubicacionCorta(principal)}`}
                  aspecto="aspect-[16/9]"
                  sizes="(min-width: 1024px) 58vw, 92vw"
                  prioridad
                  tope={10}
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <FormInventario
                  source="lp_casas_merida"
                  variante="hero"
                  copy={FORM}
                  opciones={opciones}
                  telefonoWhatsApp={FALLBACK_WHATSAPP}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FICHA: cuadrícula de dos columnas, cada dato en su celda ══ */}
      <section className="border-t border-[var(--lpv-line)] bg-[var(--lpv-bg)]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="text-sm text-[var(--lpv-fg-3)]">{ubicacionCorta(principal)}</p>
              <h2 className="lpv-display mt-2 text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
                {principal.titulo}
              </h2>
              {principal.precio && (
                <p className="lpv-display lpv-cifra mt-5 text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] font-semibold leading-none tracking-[-0.02em]">
                  {dinero(principal.precio)}
                </p>
              )}
              <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
                {descripcionFicha(principal)}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 lg:col-span-7">
              {celdasFicha(principal).map((celda) => (
                <div key={celda.etiqueta} className="lpm-celda p-5">
                  <dt className="text-[0.8125rem] text-[var(--lpv-fg-3)]">{celda.etiqueta}</dt>
                  <dd className="lpv-display lpv-cifra mt-2 text-[clamp(1.5rem,1.2rem+1.2vw,2.125rem)] font-semibold leading-none tracking-[-0.02em]">
                    {celda.valor}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ══ LISTADO (si hay varias) u OTRA OPCIÓN (si hay una) + CIERRE ══ */}
      <Catalogo casas={casas} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ TRES PASOS EN UNA FILA, con regla superior y sin cajas ══ */}
      <section className="bg-[var(--lpv-bg)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="lpv-display max-w-[20ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            Lo que pasa después de dejar tus datos
          </h2>
          <ol className="mt-10 grid gap-10 border-t border-[var(--lpv-line-2)] pt-8 md:grid-cols-3 md:gap-8">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="flex gap-5 md:block">
                <span className="lpv-display lpv-cifra shrink-0 text-[3rem] font-light leading-none text-[var(--lpv-accent)] md:text-[4rem]">
                  {i + 1}
                </span>
                <div className="md:mt-5">
                  <h3 className="text-[1.0625rem] font-medium leading-snug">{paso.titulo}</h3>
                  <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-[var(--lpv-fg-2)]">{paso.cuerpo}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <div className="border-t border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <FaqAcordeon faqs={FAQ_COMPRA_Y_FINANCIAMIENTO} />
        </div>
      </div>

      <PieLegal
        aviso={PIE_AVISO}
        inventario={
          una && principal.precio
            ? `Inventario publicado: 1 casa en ${dinero(principal.precio)}.`
            : resumen.desde && resumen.hasta
              ? `Inventario publicado: ${resumen.total} casas de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
              : null
        }
      />

      <BarraMovil
        etiqueta="Ver precio y enganche"
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_casas_merida_barra_movil"
      />
    </div>
  );
}
