import type { Metadata } from 'next';
import Image from 'next/image';
import localFont from 'next/font/local';
import { TIPOS_DEPTO, getInventario, resumenInventario, totalDesarrollos } from '@/lib/supabase/lp-inventario';
import { FALLBACK_WHATSAPP } from '@/lib/site-contact';
import { Calendar, CheckCircle, KeySquare, Tag } from '@/lib/icons';
import { dinero, dineroCompacto } from '../_components/format';
import FaqAcordeon from '../_components/v2/FaqAcordeon';
import BarraMovil from '../_components/v2/BarraMovil';
import PieLegal from '../_components/v2/PieLegal';
import { FAQ_COMPRA_Y_FINANCIAMIENTO } from '../_components/v2/faqs';
import { filtroEntrega, filtroPresupuesto, filtroRecamaras, filtroUbicacion, filtros } from '../_components/v2/filtros';
import { plural, ubicacionCorta } from '../_components/v2/util';
import Catalogo from './_components/Catalogo';
import FiltrosPortada from './_components/FiltrosPortada';
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
// GANCHO (30-oct-2026): la portada promete «esquemas de pago a tu medida» y
// pide presupuesto y ciudad. El indice de ciudades es el filtro; los chips
// de presupuesto tambien. Lo elegido mueve los capitulos, el formulario y el
// lead (ver `_components/v2/filtros.ts`).
//
// BRIEF DE COPY (30-oct-2026, tarde): titulo, subtitulo y badges vienen del
// brief, pero CADA CIFRA se sustituyo por la del Hub: el brief decia «20% de
// enganche» y el inventario declara desde 10%; decia «preventa con -8%» y el
// unico descuento vigente es otro; «lock-off» no existe en `v_units`. Lo
// que no se puede derivar del inventario no se imprime. Y el CTA no promete
// una descarga: el formulario no entrega un PDF, lo manda un asesor.
//
// Reglas heredadas: toda cifra sale del inventario; ningun nombre de
// desarrollo llega al DOM (el id solo se cuenta); cero urgencia inventada.
// ============================================================

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Departamentos en la Riviera Maya con esquemas de pago a tu medida | Precios y enganche publicados',
  description:
    'Unidades seleccionadas en Tulum, Playa del Carmen y Puerto Morelos con precio cerrado, enganche declarado y disponibilidad. Dinos presupuesto y ciudad y recibe la lista de precios.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

/** «Tulum, Playa del Carmen y Puerto Morelos»: lista en español. */
function listaY(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

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

  // Filtros con conteo real. Los cortes de presupuesto parten el inventario
  // de hoy (2.2 a 9.1 M MXN) en cuatro tramos con departamentos en todos;
  // una opcion vacia no se publica, un filtro con una sola opcion tampoco.
  const defs = filtros(
    filtroUbicacion(departamentos, 'ciudad', 'Ciudad'),
    filtroPresupuesto(departamentos, [3_000_000, 4_500_000, 6_000_000]),
    filtroRecamaras(departamentos),
    filtroEntrega(departamentos),
  );

  // Badges de la portada: solo los que tienen propiedades detras, con su
  // conteo. Son informativos; filtrar es cosa del indice y del formulario.
  const nInmediata = departamentos.filter((p) => p.estadoComercial === 'entrega_inmediata').length;
  const nPreventa = departamentos.filter((p) => p.estadoComercial === 'preventa').length;
  const nAmueblados = departamentos.filter((p) => p.amueblado || p.equipado).length;
  const nDescuento = departamentos.filter((p) => p.descuentoPct !== null).length;
  const badges = [
    { n: nInmediata, texto: 'Entrega inmediata', Icono: KeySquare },
    { n: nPreventa, texto: 'Preventa', Icono: Calendar },
    { n: nAmueblados, texto: 'Amueblado o equipado', Icono: CheckCircle },
    { n: nDescuento, texto: 'Con descuento vigente', Icono: Tag },
  ].filter((b) => b.n > 0);
  const desarrollos = totalDesarrollos(departamentos);

  // Lamina de portada: la unidad con mas fotos propias. La panoramica del
  // cierre es otra, de otra ciudad si la hay.
  const conFoto = [...departamentos].filter((p) => p.imagen).sort((a, b) => b.imagenes.length - a.imagenes.length);
  const portada = conFoto[0] ?? null;
  const panoramica = conFoto.find((p) => p.ciudad !== portada?.ciudad) ?? conFoto[1] ?? null;

  return (
    <div className={`lpv lpd-root ${display.variable}`}>
      {/* ══ PORTADA ══ */}
      <section id="hero" className="bg-[var(--lpv-bg)]">
        <div className="mx-auto grid min-h-[100svh] max-w-[96rem] content-center gap-10 px-5 pb-12 pt-24 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:pb-14">
          <div className="lg:col-span-7">
            <h1 className="text-[var(--lpv-fg)]">
              <span className="lpd-serif block text-[clamp(2.5rem,1.3rem+5vw,5.5rem)]">Departamentos en la Riviera Maya</span>
              <span className="lpd-serif-italic block pb-1 text-[clamp(1.75rem,1.1rem+3.2vw,4rem)] text-[var(--lpv-accent)]">
                con esquemas de pago a tu medida
              </span>
            </h1>
            <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
              Unidades seleccionadas en {listaY(resumen.ciudades)}
              {resumen.desde ? ` desde ${dineroCompacto(resumen.desde)}` : ''}.
              {resumen.engancheMinimoPct !== null ? ` Enganches desde el ${resumen.engancheMinimoPct}%.` : ''}
            </p>

            {badges.length > 0 && (
              <ul className="lpd-badges mt-5 flex flex-wrap gap-2" aria-label="Lo que hay en el inventario">
                {badges.map(({ n, texto, Icono }) => (
                  <li key={texto} className="lpd-badge">
                    <Icono className="h-3.5 w-3.5 text-[var(--lpv-accent)]" aria-hidden />
                    {texto}
                    <span className="lpv-cifra opacity-60">{n}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-[0.9375rem] text-[var(--lpv-fg-3)]">
              {plural(resumen.total, 'unidad disponible', 'unidades disponibles')}
              {desarrollos > 1 ? ` de ${plural(desarrollos, 'desarrollo', 'desarrollos')}` : ''}, revisadas antes de publicar.
            </p>

            {/* Presupuesto + indice de ciudades como filtro. */}
            <FiltrosPortada defs={defs} todos={departamentos} />

            <a href="#solicitar" className="lpd-boton mt-6">
              Recibir la lista de precios
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
      <Catalogo todos={departamentos} defs={defs} telefonoWhatsApp={FALLBACK_WHATSAPP} />

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
        etiqueta="Recibir la lista de precios"
        telefonoWhatsApp={FALLBACK_WHATSAPP}
        mensajeWhatsApp={mensajeWa}
        surface="lp_deptos_rm_barra_movil"
      />
    </div>
  );
}
