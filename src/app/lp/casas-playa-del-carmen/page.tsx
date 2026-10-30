import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  TIPOS_CASA,
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
import { FORM, PASOS, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpx-theme.css';

// ============================================================
// Landing de pago: CASAS EN PLAYA DEL CARMEN.
//
// Lectura del brief: tráfico pagado de México que teclea «casas en venta en
// Playa del Carmen». Referencia de conversión: el listado de portal (Redfin,
// Zillow): filtros de ubicación visibles desde el primer pliegue, fotos y
// precio por delante, un solo formulario repetido arriba y al cierre. Página
// clara, retícula de tres, ficha con carrusel.
//
// Reglas heredadas de la familia: toda cifra sale del inventario; ningún
// nombre de desarrollo llega al DOM; cero urgencia inventada.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Casas en venta en Playa del Carmen | Precios y enganche publicados',
  description:
    'Casas publicadas hoy en Playa del Carmen con precio cerrado, enganche y disponibilidad. Filtra por zona y recibe la ficha completa por correo.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

const display = localFont({
  src: '../../../fonts/outfit-latin.woff2',
  weight: '300 700',
  style: 'normal',
  declarations: [{ prop: 'font-family', value: 'Outfit' }],
  variable: '--font-lpx-display',
  display: 'swap',
});

export default async function LandingCasasPlayaDelCarmen() {
  const casas = await getInventario({ tipos: TIPOS_CASA, ciudades: ['Playa del Carmen'] });
  const resumen = resumenInventario(casas);
  const zonas = ubicaciones(casas, 'zona');
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));
  const mosaico = casas.filter((c) => c.imagen).slice(0, 4);
  const mensajeWa = FORM.whatsappGenerico;

  if (casas.length === 0) {
    return (
      <div className={`lpv lpx-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpv-display text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em]">
            Ahora mismo no tenemos casas publicadas en Playa del Carmen.
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
    <div className={`lpv lpx-root ${display.variable}`}>
      {/* ══ HERO: titular + chips de zona + formulario, todo en el primer pliegue ══ */}
      <section id="hero" className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-accent)]">
                Inventario publicado hoy
              </p>
              <h1 className="lpv-display mt-5 text-[clamp(2.25rem,1.4rem+4vw,4.5rem)] font-semibold leading-[1.0] tracking-[-0.035em] text-[var(--lpv-fg)]">
                {resumen.total} casas en venta en Playa del Carmen
                {resumen.desde ? (
                  <span className="block text-[var(--lpv-fg-3)]">desde {dineroCompacto(resumen.desde)}</span>
                ) : null}
              </h1>
              <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
                Precio cerrado, enganche y disponibilidad de cada casa. Elige la zona y te mandamos la ficha completa.
              </p>

              <div className="mt-8">
                <ChipsHero ubicaciones={zonas} tono="claro" />
              </div>

              {/* Mosaico 2fr 1fr 1fr: cuatro fotos reales, la primera grande.
                  Es la prueba de que hay VARIAS casas, en el primer pliegue
                  de escritorio y justo debajo del titular en móvil. */}
              {mosaico.length > 0 && (
                <div className="mt-10 grid grid-cols-3 grid-rows-2 gap-2 sm:gap-3">
                  {mosaico.map((casa, i) => (
                    <figure
                      key={casa.id}
                      className={`relative overflow-hidden rounded-[var(--lpv-r)] bg-[var(--lpv-bg-2)] ${
                        i === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-[4/3]'
                      }`}
                    >
                      <Image
                        src={casa.imagen as string}
                        alt={`${casa.titulo}, ${ubicacionCorta(casa)}`}
                        fill
                        priority={i === 0}
                        sizes={i === 0 ? '(min-width: 1024px) 38vw, 62vw' : '(min-width: 1024px) 19vw, 31vw'}
                        className="object-cover"
                      />
                    </figure>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <FormInventario
                  source="lp_casas_pdc"
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

      {/* ══ INVENTARIO FILTRABLE + CIERRE ══ */}
      <Catalogo casas={casas} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ CÓMO FUNCIONA: tres pasos en línea, no tres tarjetas iguales ══ */}
      <section className="border-b border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="lpv-display max-w-[20ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            Lo que pasa después de dejar tus datos
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="relative border-l-2 border-[var(--lpv-accent)] pl-5 md:border-l-0 md:border-t-2 md:pl-0 md:pt-5">
                <span className="lpv-display lpv-cifra text-[2rem] font-semibold leading-none text-[var(--lpv-accent)]">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-[1.0625rem] font-medium leading-snug">{paso.titulo}</h3>
                <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-[var(--lpv-fg-2)]">{paso.cuerpo}</p>
              </li>
            ))}
          </ol>
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
            ? `Inventario publicado: ${resumen.total} casas de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
      />

      <BarraMovil
        etiqueta={`Ver precios de las ${resumen.total}`}
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_casas_pdc_barra_movil"
      />
    </div>
  );
}
