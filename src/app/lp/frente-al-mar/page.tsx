import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  VISTAS_MAR,
  claveUbicacion,
  getInventario,
  resumenInventario,
  ubicaciones,
} from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero, dineroCompacto } from '../_components/format';
import { ChipsHero } from '../_components/v2/ChipsUbicacion';
import FormInventario from '../_components/v2/FormInventario';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import Costa, { type TramoCosta } from './_components/Costa';
import { FORM, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpo-theme.css';

// ============================================================
// Landing de pago: PROPIEDADES FRENTE AL MAR, SUR DE MÉXICO.
//
// Lectura del brief: comprador de segunda residencia o inversionista que
// teclea «propiedades frente al mar». Referencia de conversión: el listado
// cinematográfico de lujo (Sotheby's International Realty, JamesEdition):
// foto a sangre en el hero, rail horizontal de propiedades, interfaz oscura
// y calmada con un solo acento. Página OSCURA bloqueada.
//
// EL FILTRO ES EL TIPO DE VISTA, NO LA CIUDAD. Entra toda unidad publicada
// cuyo `view_type` sea «Mar» o «Mar lateral», sea villa o departamento y esté
// en Quintana Roo o en Yucatán. La vista es la que declara el desarrollador y
// el pie lo dice.
//
// Reglas heredadas de la familia: toda cifra sale del inventario; ningún
// nombre de desarrollo llega al DOM; cero urgencia inventada.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Propiedades frente al mar en el sur de México | Precios publicados',
  description:
    'Villas y departamentos frente al mar publicados hoy en Playa del Carmen, Cancún y la costa de Yucatán, con precio cerrado, enganche y disponibilidad.',
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

export default async function LandingFrenteAlMar() {
  const propiedades = await getInventario({ vistas: VISTAS_MAR });
  const resumen = resumenInventario(propiedades);
  const ciudades = ubicaciones(propiedades, 'ciudad');
  const opciones = propiedades.map((p) => ({ slug: p.slug, titulo: p.titulo }));
  const portada = propiedades.find((p) => p.imagen) ?? null;
  const mensajeWa = FORM.whatsappGenerico;

  // Tramos de costa: una columna por ciudad con sus zonas, derivado del
  // inventario. El estado acompaña porque la página cruza dos.
  const tramos: TramoCosta[] = ciudades.map((c) => {
    const delTramo = propiedades.filter((p) => claveUbicacion(p.ciudad) === c.clave);
    const zonas = [...new Set(delTramo.map((p) => p.zona).filter((z): z is string => !!z && z !== c.nombre))];
    return {
      clave: c.clave,
      ciudad: c.nombre,
      estado: delTramo[0]?.estado ?? '',
      total: c.total,
      zonas,
    };
  });

  if (propiedades.length === 0) {
    return (
      <div className={`lpv lpo-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpv-display lpo-titular text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] leading-tight">
            Ahora mismo no tenemos propiedades frente al mar publicadas.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
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

  const cifras = [
    { t: 'Disponibles', v: String(resumen.total) },
    { t: 'Desde', v: resumen.desde ? dineroCompacto(resumen.desde) : 'por confirmar' },
    { t: 'Hasta', v: resumen.hasta ? dineroCompacto(resumen.hasta) : 'por confirmar' },
  ];

  return (
    <div className={`lpv lpo-root ${display.variable}`}>
      {/* ══ HERO: foto a sangre, texto abajo a la izquierda, chips de ciudad ══ */}
      <section id="hero" className="relative isolate min-h-[100svh] overflow-hidden bg-[var(--lpv-bg)]">
        {portada?.imagen && (
          <Image
            src={portada.imagen}
            alt={`${portada.titulo}, ${ubicacionCorta(portada)}`}
            fill
            priority
            sizes="(min-width: 2048px) 2048px, 100vw"
            className="object-cover"
          />
        )}
        {/* Degradado, no capa plana: la foto conserva su cielo arriba y cede
            legibilidad abajo, donde vive el texto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[var(--lpv-bg)] via-[rgb(11_22_32/0.55)] to-[rgb(11_22_32/0.1)]"
        />
        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-14 pt-24 sm:px-8 lg:pb-20">
          <h1 className="lpv-display lpo-titular max-w-[18ch] text-[clamp(2.25rem,1.4rem+4.2vw,5rem)] leading-[0.98] text-[var(--lpv-fg)]">
            {resumen.total} propiedades frente al mar en el sur de México
          </h1>
          <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
            Villas y departamentos con vista al mar, con precio cerrado, enganche y disponibilidad de cada uno.
          </p>
          <div className="mt-8">
            <ChipsHero ubicaciones={ciudades} tono="oscuro" etiquetaTodas="Toda la costa" />
          </div>
        </div>
      </section>

      {/* ══ CIFRAS + FORMULARIO: la banda que sigue al hero ══ */}
      <section className="border-b border-[var(--lpv-line)] bg-[var(--lpv-bg)]">
        <div className="mx-auto grid max-w-7xl gap-x-14 gap-y-10 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <dl className="grid grid-cols-3 gap-x-6 border-t border-[var(--lpv-line-2)] pt-6">
              {cifras.map((c) => (
                <div key={c.t}>
                  <dt className="text-[0.8125rem] text-[var(--lpv-fg-3)]">{c.t}</dt>
                  <dd className="lpv-display lpo-titular lpv-cifra mt-2 text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-none text-[var(--lpv-fg)]">
                    {c.v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 max-w-[52ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
              Cada propiedad de abajo está publicada, aprobada y con precio vigente en nuestro sistema. La vista al mar es la que declara el desarrollador para esa unidad, y la ficha lo dice en cada caso.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-8">
              <FormInventario
                source="lp_frente_mar"
                variante="hero"
                copy={FORM}
                opciones={opciones}
                telefonoWhatsApp={FALLBACK_WHATSAPP}
                className="border border-[var(--lpv-panel-line)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ RAIL DE PROPIEDADES + CIERRE ══ */}
      <Catalogo propiedades={propiedades} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ LA COSTA, CIUDAD POR CIUDAD: informa y filtra ══ */}
      <section className="border-y border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="lpv-display lpo-titular max-w-[22ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] leading-[1.08] text-[var(--lpv-fg)]">
            Dónde está el inventario frente al mar
          </h2>
          <div className="mt-10">
            <Costa tramos={tramos} />
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <FaqAcordeon faqs={FAQ_COMPRA_Y_FINANCIAMIENTO} />
      </div>

      <PieLegal
        aviso={PIE_AVISO}
        inventario={
          resumen.desde && resumen.hasta
            ? `Inventario publicado: ${resumen.total} propiedades de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
        tono="oscuro"
      />

      <BarraMovil
        etiqueta={`Ver precios de las ${resumen.total}`}
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_frente_mar_barra_movil"
      />
    </div>
  );
}
