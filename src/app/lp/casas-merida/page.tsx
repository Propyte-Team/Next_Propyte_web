import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import { TIPOS_CASA, getInventario } from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { dinero } from '../_components/format';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import { FORM, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpm-theme.css';

// ============================================================
// Landing de pago: CASAS EN MÉRIDA (segunda versión, 30-oct-2026).
//
// Lógica propia, distinta del resto de la familia: EL DOSSIER. El Hub publica
// hoy una sola casa en Mérida, y la página es su ficha completa en una vista:
// galería fija a la izquierda; precio, datos y formulario a la derecha.
// Después, todas las fotos en mosaico y las preguntas. Si entran más casas,
// aparecen como filas debajo del mosaico y se pueden elegir para el
// formulario; el dossier sigue siendo la primera.
//
// Reglas heredadas: toda cifra sale del inventario; ningún nombre de
// desarrollo llega al DOM; cero urgencia inventada.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Casas en venta en Mérida | Precio y enganche publicados',
  description:
    'Casa publicada hoy en Mérida con precio cerrado, enganche y disponibilidad. Recibe la ficha completa con planos por correo.',
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

export default async function LandingCasasMerida() {
  const casas = await getInventario({ tipos: TIPOS_CASA, ciudades: ['Mérida'] });
  const mensajeWa = FORM.whatsappGenerico;

  if (casas.length === 0) {
    return (
      <div className={`lpv lpm-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpm-display text-[clamp(2rem,1.3rem+2.5vw,3.25rem)]">
            Ahora mismo no tenemos casas publicadas en Mérida.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a
            href={`https://wa.me/${FALLBACK_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[52px] items-center rounded-full bg-[var(--lpv-accent)] px-7 text-sm font-medium text-white"
          >
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const principal = casas[0];
  const fotos = principal.imagenes;
  const desde = casas[0]?.precio ?? null;
  const hasta = casas[casas.length - 1]?.precio ?? null;

  return (
    <div className={`lpv lpm-root ${display.variable}`}>
      <Catalogo casas={casas} telefonoWhatsApp={FALLBACK_WHATSAPP}>
        {/* ══ MOSAICO: todas las fotos de la casa, sin rótulos ══ */}
        {fotos.length > 1 && (
          <section className="lpm-mosaico border-t border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
            <div className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 sm:py-24">
              <h2 className="lpm-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] text-[var(--lpv-fg)]">
                Las {fotos.length} fotos
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-1 md:grid-cols-3">
                {fotos.map((src, i) => (
                  <figure
                    key={src}
                    className={`relative overflow-hidden bg-[var(--lpv-bg)] ${
                      i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-[4/3]'
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${principal.titulo}, foto ${i + 1}`}
                      fill
                      loading="lazy"
                      sizes={
                        i === 0
                          ? '(min-width: 768px) 66vw, 100vw'
                          : '(min-width: 768px) 33vw, 50vw'
                      }
                      className="object-cover"
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}
      </Catalogo>

      {/* ══ PREGUNTAS ══ */}
      <div className="mx-auto max-w-[96rem] border-t border-[var(--lpv-line)] px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <h2 className="lpm-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] text-[var(--lpv-fg)] lg:col-span-4">
            Lo que preguntan antes de comprar
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
          desde && hasta
            ? casas.length === 1
              ? `Inventario publicado: 1 casa en ${ubicacionCorta(principal)}, ${dinero(desde)}.`
              : `Inventario publicado: ${casas.length} casas de ${dinero(desde)} a ${dinero(hasta)}.`
            : null
        }
      />

      <BarraMovil
        etiqueta="Recibir la ficha"
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_casas_merida_barra_movil"
        href="#solicitar"
      />
    </div>
  );
}
