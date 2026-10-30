import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  VISTAS_MAR,
  getInventario,
  resumenInventario,
  ubicaciones,
} from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero, dineroCompacto } from '../_components/format';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import IndiceCiudades from './_components/IndiceCiudades';
import { FORM, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpo-theme.css';

// ============================================================
// Landing de pago: PROPIEDADES FRENTE AL MAR (segunda versión, 30-oct-2026).
//
// La primera versión era un riel de tarjetas; esta es una HISTORIA A PANTALLA
// COMPLETA: la portada, luego una propiedad por pantalla con su foto a sangre
// y su precio encima, y al final el formulario, también a pantalla completa.
// El scroll salta de una a otra (snap por proximidad). En escritorio un
// índice fijo con las ciudades permite saltar; en móvil se desliza.
//
// Reglas heredadas: toda cifra sale del inventario; ningún nombre de
// desarrollo llega al DOM; cero urgencia inventada. La vista al mar es la que
// declara el desarrollador en el Hub (`view_type`).
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Propiedades frente al mar en el sur de México | Precios publicados',
  description:
    'Villas y departamentos con vista al mar en Quintana Roo y Yucatán, con precio cerrado, enganche y disponibilidad. Una propiedad por pantalla; recibe la ficha completa por correo.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

const display = localFont({
  src: '../../../fonts/bricolage-grotesque-latin.woff2',
  weight: '300 800',
  style: 'normal',
  declarations: [
    { prop: 'font-family', value: 'Bricolage Grotesque' },
    { prop: 'font-stretch', value: '75% 100%' },
  ],
  variable: '--font-lpo-display',
  display: 'swap',
});

/** «Quintana Roo y Yucatán», «Quintana Roo», o «la costa» si el Hub no declara estado. */
function nombrarEstados(propiedades: { estado: string }[]): string {
  const estados = [...new Set(propiedades.map((p) => p.estado).filter(Boolean))];
  if (estados.length === 0) return 'la costa';
  if (estados.length === 1) return estados[0];
  return `${estados.slice(0, -1).join(', ')} y ${estados[estados.length - 1]}`;
}

export default async function LandingFrenteAlMar() {
  const propiedades = await getInventario({ vistas: VISTAS_MAR });
  const resumen = resumenInventario(propiedades);
  const ciudades = ubicaciones(propiedades, 'ciudad');
  const mensajeWa = FORM.whatsappGenerico;

  if (propiedades.length === 0) {
    return (
      <div className={`lpv lpo-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpo-display text-[clamp(2rem,1.3rem+2.5vw,3.25rem)]">
            Ahora mismo no tenemos propiedades frente al mar publicadas.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[52px] items-center rounded-full bg-[var(--lpv-accent)] px-7 text-sm font-medium text-[var(--lpv-on-accent)]"
          >
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Portada: la propiedad con más fotos propias. Empates, por precio.
  const portada = [...propiedades].sort((a, b) => b.imagenes.length - a.imagenes.length)[0];
  const estados = nombrarEstados(propiedades);

  return (
    <div className={`lpv lpo-root ${display.variable}`}>
      {/* ══ PANTALLA 0: la portada ══ */}
      <section
        id="hero"
        className="lpo-pantalla relative isolate min-h-[100svh] overflow-hidden bg-[var(--lpv-bg-2)]"
      >
        {portada.imagen && (
          <Image
            src={portada.imagen}
            alt={`${portada.titulo}, ${ubicacionCorta(portada)}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="lpo-velo absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-[96rem] flex-col justify-end px-5 pb-12 pt-28 text-white sm:px-8 sm:pb-16 lg:pr-48">
          <h1 className="lpo-display lpo-sobre-foto text-[clamp(4rem,1.5rem+11vw,11rem)]">
            Frente al mar
          </h1>
          <p className="lpo-display-ligero lpo-sobre-foto mt-5 max-w-[36ch] text-[clamp(1.25rem,1rem+1.5vw,2.25rem)] text-white/90">
            {resumen.total} {resumen.total === 1 ? 'propiedad' : 'propiedades'} en {estados}
            {resumen.desde ? `, desde ${dineroCompacto(resumen.desde)}` : ''}.
          </p>
        </div>
      </section>

      {/* ══ PANTALLAS 1..n y el formulario ══ */}
      <Catalogo propiedades={propiedades} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* Índice fijo de ciudades, solo escritorio. */}
      <IndiceCiudades ciudades={ciudades} />

      {/* ══ PREGUNTAS, fuera del snap ══ */}
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <FaqAcordeon faqs={FAQ_COMPRA_Y_FINANCIAMIENTO} titulo="Lo que preguntan antes de comprar" />
      </div>

      <PieLegal
        tono="oscuro"
        aviso={PIE_AVISO}
        inventario={
          resumen.desde && resumen.hasta
            ? `Inventario publicado: ${resumen.total} propiedades de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
      />

      <BarraMovil
        etiqueta="Recibir la información"
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_frente_mar_barra_movil"
      />
    </div>
  );
}
