import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  TIPOS_TERRENO,
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
import './lpt2-theme.css';

// ============================================================
// Landing de pago: TERRENOS RESIDENCIALES EN LA RIVIERA MAYA.
//
// Lectura del brief: tráfico pagado de Google que teclea «terrenos
// residenciales Riviera Maya / Playa del Carmen / Tulum». Referencia de
// conversión: la landing de suelo guiada por el número (mensualidad y precio
// por m² por delante), un solo objetivo, formulario a la vista en el primer
// pliegue y al cierre. Página clara, lista de fichas técnicas (no cuadrícula
// de tarjetas), calculadora de mensualidad sobre el esquema declarado.
//
// Reglas heredadas de la familia: toda cifra sale del inventario; ningún
// nombre de desarrollo llega al DOM; cero urgencia inventada; donde no hay
// esquema declarado no hay mensualidad, y se dice.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Terrenos residenciales en la Riviera Maya | Precio por m² y plan de pagos',
  description:
    'Terrenos residenciales publicados hoy en Playa del Carmen, Tulum y Cancún con precio cerrado, precio por m², enganche y plazos. Filtra por ciudad y recibe la ficha completa por correo.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

const display = localFont({
  src: '../../../fonts/manrope-latin.woff2',
  weight: '400 800',
  style: 'normal',
  declarations: [{ prop: 'font-family', value: 'Manrope' }],
  variable: '--font-lpt2-display',
  display: 'swap',
});

export default async function LandingTerrenosRivieraMaya() {
  const lotes = await getInventario({ tipos: TIPOS_TERRENO });
  const resumen = resumenInventario(lotes);
  const ciudades = ubicaciones(lotes, 'ciudad');
  const opciones = lotes.map((l) => ({ slug: l.slug, titulo: l.titulo }));
  const portada = lotes.find((l) => l.imagen) ?? null;
  const mensajeWa = FORM.whatsappGenerico;

  if (lotes.length === 0) {
    return (
      <div className={`lpv lpt2-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpv-display text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] font-bold leading-tight tracking-[-0.02em]">
            Ahora mismo no tenemos terrenos publicados en la Riviera Maya.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[52px] items-center bg-[var(--lpv-accent)] px-7 text-sm font-semibold text-[var(--lpv-on-accent)]"
          >
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`lpv lpt2-root ${display.variable}`}>
      {/* ══ HERO: titular + chips de ciudad + imagen ancha + formulario ══ */}
      <section id="hero" className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-accent)]">
                Inventario publicado hoy
              </p>
              <h1 className="lpv-display mt-5 text-[clamp(2.25rem,1.4rem+4vw,4.5rem)] font-bold leading-[1.0] tracking-[-0.035em] text-[var(--lpv-fg)]">
                {resumen.total} terrenos residenciales en la Riviera Maya
                {resumen.desde ? (
                  <span className="block text-[var(--lpv-fg-3)]">desde {dineroCompacto(resumen.desde)}</span>
                ) : null}
              </h1>
              <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
                Precio por metro cuadrado, enganche y plazos de cada lote. Elige la ciudad y te mandamos la ficha.
              </p>

              <div className="mt-8">
                <ChipsHero ubicaciones={ciudades} tono="claro" />
              </div>

              {portada && (
                <figure className="relative mt-10 aspect-[21/9] w-full overflow-hidden bg-[var(--lpv-bg-2)]">
                  <Image
                    src={portada.imagen as string}
                    alt={`${portada.titulo}, ${ubicacionCorta(portada)}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 58vw, 92vw"
                    className="object-cover"
                  />
                </figure>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <FormInventario
                  source="lp_terrenos_rm"
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

      {/* ══ FICHAS TÉCNICAS + MENSUALIDAD + CIERRE ══ */}
      <Catalogo lotes={lotes} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ ANTES DE FIRMAR: tres pasos en línea ══ */}
      <section className="border-b border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="lpv-display max-w-[20ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.02em]">
            Antes de firmar
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {PASOS.map((paso, i) => (
              <li
                key={paso.titulo}
                className="relative border-l-2 border-[var(--lpv-accent)] pl-5 md:border-l-0 md:border-t-2 md:pl-0 md:pt-5"
              >
                <span className="lpt2-mono text-[2rem] font-medium leading-none text-[var(--lpv-accent)]">
                  {String(i + 1).padStart(2, '0')}
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
            ? `Inventario publicado: ${resumen.total} terrenos de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
      />

      <BarraMovil
        etiqueta={`Ver precios de los ${resumen.total}`}
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_terrenos_rm_barra_movil"
      />
    </div>
  );
}
