import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  TIPOS_DEPTO,
  getInventario,
  resumenInventario,
  ubicaciones,
} from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero } from '../_components/format';
import { ChipsHero } from '../_components/v2/ChipsUbicacion';
import FormInventario from '../_components/v2/FormInventario';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import { FORM, PIE_AVISO, QUE_RECIBES } from './_copy';
import '../_components/v2/tokens.css';
import './lpd-theme.css';

// ============================================================
// Landing de pago: DEPARTAMENTOS EN LA RIVIERA MAYA.
//
// Lectura del brief: comprador premium o inversionista que teclea
// «departamentos en venta en Tulum / Playa del Carmen». Referencia de
// conversión: la ficha editorial de inmobiliaria de lujo (Luxury Presence,
// Sotheby's): foto a sangre, serif grande, aire, un acento. Página oscura
// completa; retícula de revista con una lámina de apertura y el resto en
// columna; carrusel por ficha.
//
// Reglas heredadas de la familia: toda cifra sale del inventario; ningún
// nombre de desarrollo llega al DOM; cero urgencia inventada.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Departamentos en venta en la Riviera Maya | Precios y enganche publicados',
  description:
    'Departamentos publicados hoy en Playa del Carmen, Tulum y Puerto Morelos con precio cerrado, enganche y disponibilidad. Elige la ciudad y recibe la ficha completa por correo.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

const display = localFont({
  src: [
    { path: '../../../fonts/cormorant-garamond-latin.woff2', weight: '400 600', style: 'normal' },
    { path: '../../../fonts/cormorant-garamond-latin-italic.woff2', weight: '400 500', style: 'italic' },
  ],
  declarations: [{ prop: 'font-family', value: 'Cormorant Garamond' }],
  variable: '--font-lpd-display',
  display: 'swap',
});

const CIUDADES = ['Playa del Carmen', 'Tulum', 'Puerto Morelos'] as const;

export default async function LandingDepartamentosRivieraMaya() {
  const departamentos = await getInventario({ tipos: TIPOS_DEPTO, ciudades: CIUDADES });
  const resumen = resumenInventario(departamentos);
  const ciudades = ubicaciones(departamentos, 'ciudad');
  const opciones = departamentos.map((d) => ({ slug: d.slug, titulo: d.titulo }));
  const conFoto = departamentos.filter((d) => d.imagen);
  const portada = conFoto[0] ?? null;
  // Segunda foto para la sección «qué recibes»: distinta de la portada, y de
  // otra ciudad si la hay, para que la página enseñe amplitud de inventario.
  const lamina = conFoto.find((d) => d.ciudad !== portada?.ciudad) ?? conFoto[1] ?? null;
  const mensajeWa = FORM.whatsappGenerico;

  if (departamentos.length === 0) {
    return (
      <div className={`lpv lpd-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpd-serif text-[clamp(2rem,1.5rem+2.4vw,3.25rem)] text-[var(--lpv-fg)]">
            Ahora mismo no tenemos departamentos publicados en la Riviera Maya.
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

  return (
    <div className={`lpv lpd-root ${display.variable}`}>
      {/* ══ HERO: foto a sangre, titular abajo a la izquierda, formulario a la derecha en escritorio ══ */}
      <section id="hero" className="relative isolate overflow-hidden bg-[var(--lpv-bg)]">
        {portada && (
          <Image
            src={portada.imagen as string}
            alt={`${portada.titulo}, ${ubicacionCorta(portada)}`}
            fill
            priority
            sizes="(min-width: 2048px) 2048px, 100vw"
            className="object-cover"
          />
        )}
        {/* Degradado de abajo hacia arriba: la foto conserva su luz arriba y
            cede legibilidad abajo, donde vive el texto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[var(--lpv-bg)] via-[rgb(17_17_16/0.72)] to-[rgb(17_17_16/0.18)]"
        />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-end px-5 pb-12 pt-28 sm:px-8 lg:pb-16 lg:pr-[30rem]">
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-accent)]">
            Inventario publicado hoy
          </p>
          {/* El tamano va en el h1, no solo en los spans: `max-w-[16ch]` se
              mide con la fuente del propio h1, y con la base de 16px el
              titular salia a una palabra por linea. */}
          <h1 className="lpd-serif mt-5 max-w-[16ch] text-[clamp(3rem,2rem+5vw,6rem)] text-[var(--lpv-fg)]">
            <span className="block">
              {resumen.total} departamentos en la Riviera Maya
            </span>
            <span className="lpd-serif-italic block pb-1 text-[clamp(2rem,1.4rem+3vw,3.75rem)] text-[var(--lpv-accent)]">
              con precio publicado
            </span>
          </h1>
          <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
            Playa del Carmen, Tulum y Puerto Morelos. Elige la ciudad y te mandamos la ficha completa de cada uno.
          </p>
          <div className="mt-8">
            <ChipsHero ubicaciones={ciudades} tono="oscuro" />
          </div>
        </div>

        {/* Formulario del primer pliegue: flotando a la derecha en escritorio. */}
        <div className="relative hidden lg:absolute lg:bottom-16 lg:right-8 lg:block lg:w-[26rem]">
          <FormInventario
            source="lp_deptos_rm"
            variante="hero"
            copy={FORM}
            opciones={opciones}
            telefonoWhatsApp={FALLBACK_WHATSAPP}
            className="border border-[var(--lpv-panel-line)] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]"
          />
        </div>
      </section>

      {/* En móvil y tableta el formulario va justo debajo del hero. En
          escritorio ya está dentro, así que aquí no se repite. */}
      <div className="bg-[var(--lpv-bg)] lg:hidden">
        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
          <FormInventario
            source="lp_deptos_rm"
            variante="hero"
            copy={FORM}
            opciones={opciones}
            telefonoWhatsApp={FALLBACK_WHATSAPP}
            className="border border-[var(--lpv-panel-line)]"
          />
        </div>
      </div>

      {/* ══ INVENTARIO EDITORIAL + CIERRE ══ */}
      <Catalogo departamentos={departamentos} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ QUÉ RECIBES: lámina a la izquierda, titular y cuatro líneas a la derecha ══ */}
      <section className="border-t border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-16">
          {lamina && (
            <figure className="relative aspect-[3/4] overflow-hidden rounded-[var(--lpv-r)] bg-[var(--lpv-bg)] lg:col-span-5">
              <Image
                src={lamina.imagen as string}
                alt={`${lamina.titulo}, ${ubicacionCorta(lamina)}`}
                fill
                sizes="(min-width: 1024px) 40vw, 92vw"
                className="object-cover"
              />
            </figure>
          )}
          <div className={lamina ? 'lg:col-span-7 lg:self-center' : 'lg:col-span-12'}>
            <h2 className="lpd-serif max-w-[16ch] text-[clamp(2.25rem,1.6rem+3vw,4rem)] text-[var(--lpv-fg)]">
              Lo que te llega por correo
            </h2>
            <ul className="mt-10 max-w-[56ch] divide-y divide-[var(--lpv-line)] border-y border-[var(--lpv-line)]">
              {QUE_RECIBES.map(([titulo, detalle]) => (
                <li key={titulo} className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <span className="lpd-serif text-[1.375rem] text-[var(--lpv-fg)]">{titulo}</span>
                  <span className="text-sm leading-relaxed text-[var(--lpv-fg-2)]">{detalle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <FaqAcordeon faqs={FAQ_COMPRA_Y_FINANCIAMIENTO} />
      </div>

      <PieLegal
        aviso={PIE_AVISO}
        inventario={
          resumen.desde && resumen.hasta
            ? `Inventario publicado: ${resumen.total} departamentos de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
        tono="oscuro"
      />

      <BarraMovil
        etiqueta={`Ver precios de los ${resumen.total}`}
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_deptos_rm_barra_movil"
      />
    </div>
  );
}
