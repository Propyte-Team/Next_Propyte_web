import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import {
  TIPOS_DEPTO,
  claveUbicacion,
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
import Catalogo, { type Capitulo } from './_components/Catalogo';
import { FORM, PIE_AVISO } from './_copy';
import '../_components/v2/tokens.css';
import './lpd-theme.css';

// ============================================================
// Landing de pago: DEPARTAMENTOS EN LA RIVIERA MAYA (segunda version).
//
// Logica: REVISTA POR CAPITULOS. La portada no pone texto sobre foto: a la
// izquierda el titular en serif y un indice de ciudades como tabla de
// contenido; a la derecha una lamina vertical con su pie debajo. Despues, un
// capitulo por ciudad (nombre enorme, riel de laminas), una foto panoramica
// muda y el formulario en linea. Es deliberadamente distinta de la landing
// de casas (foto a sangre con el precio encima): cada landing tiene su
// propia logica.
//
// Reglas heredadas: toda cifra sale del inventario; ningun nombre de
// desarrollo llega al DOM; cero urgencia inventada.
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
  const mensajeWa = FORM.whatsappGenerico;

  if (departamentos.length === 0) {
    return (
      <div className={`lpv lpd-root ${display.variable} min-h-[70vh]`}>
        <div className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <h1 className="lpd-serif text-[clamp(2.25rem,1.5rem+3vw,4rem)] text-[var(--lpv-fg)]">
            Ahora mismo no tenemos departamentos publicados en la Riviera Maya.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
            Escríbenos y te avisamos en cuanto entre inventario, con los números completos.
          </p>
          <a href={`https://wa.me/${FALLBACK_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="lpd-boton mt-9">
            Avísenme por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Capitulos: una ciudad por capitulo, de mas a menos inventario. Dentro de
  // cada uno el orden es el del inventario (precio ascendente).
  const capitulos: Capitulo[] = ubicaciones(departamentos, 'ciudad').map((u) => ({
    ubicacion: u,
    propiedades: departamentos.filter((p) => claveUbicacion(p.ciudad) === u.clave),
  }));

  // Lamina de portada: la unidad con mas fotos propias. La panoramica del
  // cierre es otra, de otra ciudad si la hay.
  const conFoto = [...departamentos].filter((p) => p.imagen).sort((a, b) => b.imagenes.length - a.imagenes.length);
  const portada = conFoto[0] ?? null;
  const panoramica = conFoto.find((p) => p.ciudad !== portada?.ciudad) ?? conFoto[1] ?? null;

  return (
    <div className={`lpv lpd-root ${display.variable}`}>
      {/* ══ PORTADA ══ */}
      <section id="hero" className="bg-[var(--lpv-bg)]">
        <div className="mx-auto grid min-h-[100svh] max-w-[96rem] content-center gap-10 px-5 pb-12 pt-24 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:pb-16">
          <div className="lg:col-span-7">
            <h1 className="text-[var(--lpv-fg)]">
              <span className="lpd-serif block text-[clamp(3.25rem,1.8rem+7vw,8rem)]">Departamentos</span>
              <span className="lpd-serif-italic block pb-1 text-[clamp(2rem,1.2rem+4vw,4.75rem)] text-[var(--lpv-accent)]">
                en la Riviera Maya
              </span>
            </h1>
            <p className="mt-6 max-w-[40ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
              {resumen.total} publicados hoy en {resumen.ciudades.length === 1 ? 'una ciudad' : `${resumen.ciudades.length} ciudades`}
              {resumen.desde ? `, desde ${dineroCompacto(resumen.desde)}` : ''}. Cada uno con su precio cerrado, su enganche y
              sus fotos.
            </p>

            {/* Indice de capitulos. */}
            <nav aria-label="Capítulos por ciudad" className="lpd-indice mt-10 max-w-[34rem]">
              {capitulos.map((c) => (
                <a key={c.ubicacion.clave} href={`#${c.ubicacion.clave}`}>
                  <span className="lpd-serif text-[clamp(1.75rem,1.2rem+2vw,2.75rem)]">{c.ubicacion.nombre}</span>
                  <span className="text-[0.9375rem] text-[var(--lpv-fg-2)]">
                    {c.propiedades.length} {c.propiedades.length === 1 ? 'departamento' : 'departamentos'}
                  </span>
                </a>
              ))}
            </nav>

            <a href="#solicitar" className="lpd-boton mt-8">
              Recibir precios
            </a>
          </div>

          {portada?.imagen && (
            <figure className="lg:col-span-5 lg:self-center">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--lpv-bg-2)]">
                <Image
                  src={portada.imagen}
                  alt={`${portada.titulo}, ${ubicacionCorta(portada)}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[0.875rem] text-[var(--lpv-fg-2)]">
                <span>{ubicacionCorta(portada)}</span>
                <span className="text-[var(--lpv-fg)]">{portada.precio ? dinero(portada.precio) : ''}</span>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* ══ CAPITULOS + FORMULARIO ══ */}
      <Catalogo capitulos={capitulos} todos={departamentos} telefonoWhatsApp={FALLBACK_WHATSAPP} />

      {/* ══ PANORAMICA MUDA ══
          Una foto sin texto entre el formulario y las preguntas: respiro
          entre la conversion y la lectura. */}
      {panoramica?.imagen && (
        <figure className="relative aspect-[21/9] w-full overflow-hidden bg-[var(--lpv-bg-2)]">
          <Image
            src={panoramica.imagen}
            alt={`${panoramica.titulo}, ${ubicacionCorta(panoramica)}`}
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover"
          />
        </figure>
      )}

      {/* ══ PREGUNTAS ══ */}
      <div className="mx-auto max-w-[44rem] px-5 py-16 sm:px-8 sm:py-24">
        <FaqAcordeon faqs={FAQ_COMPRA_Y_FINANCIAMIENTO} titulo="Lo que preguntan antes de comprar" />
      </div>

      <PieLegal
        tono="oscuro"
        aviso={PIE_AVISO}
        inventario={
          resumen.desde && resumen.hasta
            ? `Inventario publicado: ${resumen.total} departamentos de ${dinero(resumen.desde)} a ${dinero(resumen.hasta)}.`
            : null
        }
      />

      <BarraMovil
        etiqueta="Recibir precios"
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_deptos_rm_barra_movil"
      />
    </div>
  );
}
