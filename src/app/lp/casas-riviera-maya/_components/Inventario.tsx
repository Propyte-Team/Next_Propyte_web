'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight } from '@/lib/icons';
import type { CasaLanding } from '@/lib/supabase/lp-casas';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero, m2, mxn } from '../../_components/format';
import { ANCLA_INVENTARIO, ChipsUbicacion, useFiltroUbicacion } from '../../_components/v2/ChipsUbicacion';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import FormCasas from './FormCasas';
import { COPY, type CopyCasas, type LocaleCasas } from '../_copy';

/**
 * Dos casas del mismo desarrollo pueden traer la MISMA galería (la portada
 * heredada). En la cuadrícula se leen como la misma casa dos veces. No se
 * inventa nada: cuando la primera foto ya se usó, la galería de la siguiente
 * arranca en otra foto del mismo juego (el carrusel sigue teniendo todas).
 */
function sinPortadasRepetidas(casas: CasaLanding[]): Map<string, string[]> {
  const usadas = new Set<string>();
  const resultado = new Map<string, string[]>();
  for (const casa of casas) {
    let fotos = casa.imagenes;
    const libre = fotos.findIndex((f) => !usadas.has(f));
    if (libre > 0) fotos = [...fotos.slice(libre), ...fotos.slice(0, libre)];
    if (fotos[0]) usadas.add(fotos[0]);
    resultado.set(casa.id, fotos);
  }
  return resultado;
}

/** El filtro de ubicación de la familia v2 trabaja sobre `PropiedadLanding`. */
function comoPropiedad(c: CasaLanding): PropiedadLanding {
  return {
    ...c,
    tipo: 'Casa',
    estado: '',
    precioM2Mxn: null,
    mesesOpciones: [],
    estadoComercial: c.preventa ? 'preventa' : 'disponible',
    vista: null,
    frenteAlMar: false,
    creditos: { infonavit: false, fovissste: false, hipotecario: false, directo: false },
    mensualidadMxn: null,
    amueblado: false,
    equipado: false,
    descuentoPct: null,
    desarrolloId: null,
  };
}

// ============================================================
// Cuadrícula de inventario + formulario de cierre.
//
// Van en el MISMO componente porque comparten un estado que es el eje de la
// página: pulsar «Me interesa» en una tarjeta deja esa casa elegida en el
// formulario de abajo y lleva el foco hasta él. Separarlos obligaría a un
// contexto o a subir el estado a la página entera, que dejaría de ser server
// component por una interacción de dos nodos.
//
// LA CUADRÍCULA NO ENLAZA A NINGUNA FICHA. Ni a /propiedades/[slug], ni a un
// modal, ni a una galería. Es la decisión más importante de la página y va
// contra el instinto de todo el mundo: la campaña tiene UN objetivo, y cada
// enlace que sale de aquí es un visitante pagado que se fue a navegar el sitio
// y no volvió al formulario. Las tarjetas informan y convierten; no navegan.
//
// EL ORDEN ES ASCENDENTE POR PRECIO y viene resuelto del data layer. La
// primera tarjeta que ve alguien que llegó por «casas en venta en Playa del
// Carmen» es la de entrada más accesible del inventario.
// ============================================================

/**
 * Chip de dato ausente. Regla 3 del data layer: ninguna cifra se estima en
 * silencio. Un guion se lee como «no aplica» y un vacío como error de la
 * página; esto se lee como lo que es — un dato que el asesor confirma.
 */
function Gate({ copy }: { copy: CopyCasas }) {
  return (
    <span className="lpc-etiqueta inline-block border-b border-dotted border-[var(--lpc-ink-3)] pb-px text-[var(--lpc-ink-3)]">
      {copy.inventario.confirmar}
    </span>
  );
}

/**
 * Línea de specs en texto, sin iconos.
 *
 * Deliberado: una fila de pictogramas de cama, regadera y coche es el lenguaje
 * del portal inmobiliario, y esta página está construida en el registro
 * opuesto —lámina de revista de arquitectura—. El texto separado por puntos
 * medios además se lee entero de un vistazo y no depende de que el visitante
 * descifre un icono de 14 px.
 */
function specs(casa: CasaLanding, copy: CopyCasas): string[] {
  const s = copy.inventario.specs;
  const partes: string[] = [];
  if (casa.recamaras) partes.push(`${casa.recamaras} ${s.recamaras}`);
  if (casa.banos) partes.push(`${casa.banos} ${s.banos}`);
  if (casa.m2Construidos) partes.push(`${m2(casa.m2Construidos)} ${s.construidos}`);
  if (casa.m2Terreno) partes.push(`${m2(casa.m2Terreno)} ${s.terreno}`);
  if (casa.estacionamientos) partes.push(`${casa.estacionamientos} ${s.estacionamientos}`);
  if (casa.alberca) partes.push(s.alberca);
  return partes;
}

export default function Inventario({
  casas,
  telefonoWhatsApp,
  locale = 'es',
}: {
  casas: CasaLanding[];
  telefonoWhatsApp: string;
  locale?: LocaleCasas;
}) {
  const copy = COPY[locale];
  const [casaSeleccionada, setCasaSeleccionada] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);

  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));
  const propiedades = useMemo(() => casas.map(comoPropiedad), [casas]);
  const { activa, setActiva, visibles, ubicaciones } = useFiltroUbicacion(propiedades, 'zona');
  const galerias = useMemo(() => sinPortadasRepetidas(casas), [casas]);
  const casasVisibles = casas.filter((c) => visibles.some((v) => v.id === c.id));

  const elegir = useCallback((slug: string) => {
    setCasaSeleccionada(slug);
    // `scrollIntoView` y no `location.hash`: el hash deja la URL sucia y, si el
    // visitante recarga, aterriza en el formulario sin haber visto el hero.
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="lpc-regla scroll-mt-2 bg-[var(--lpc-paper)]">
        <div className="mx-auto max-w-[92rem] px-5 py-16 sm:px-8 sm:py-24">
          <header className="max-w-[62ch]">
            <p className="lpc-etiqueta text-[var(--lpc-signal)]">
              {copy.inventario.etiqueta(casas.length)}
            </p>
            <h2 className="lpc-titulo mt-4 text-[clamp(1.75rem,1.3rem+2vw,3rem)] text-[var(--lpc-ink)]">
              {copy.inventario.titulo}
            </h2>
            {copy.inventario.cuerpo && (
              <p className="mt-5 text-base leading-relaxed text-[var(--lpc-ink-2)]">
                {copy.inventario.cuerpo}
              </p>
            )}
          </header>

          {/* Filtro por zona (brief de octubre-2026). Los mismos chips del
              hero, aquí como control real de la cuadrícula. */}
          {ubicaciones.length > 1 && (
            <div className="mt-8">
              <ChipsUbicacion
                ubicaciones={ubicaciones}
                activa={activa}
                onChange={setActiva}
                etiquetaTodas={copy.inventario.todas}
                tono="claro"
              />
            </div>
          )}

          <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {casasVisibles.map((casa, i) => {
              const detalle = specs(casa, copy);
              const elegida = casaSeleccionada === casa.slug;

              return (
                <li key={casa.id} className="lpc-ficha group flex flex-col">
                  {/* Filete + numeración: el recurso que convierte una tarjeta
                      en una lámina catalogada. */}
                  <div className="flex items-baseline justify-between border-t border-[var(--lpc-line-strong)] pt-3">
                    <span className="lpc-etiqueta lpc-cifra text-[var(--lpc-ink)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="lpc-etiqueta text-[var(--lpc-ink-3)]">
                      {casa.preventa
                        ? copy.inventario.preventa
                        : copy.inventario.entregaInmediata}
                    </span>
                  </div>

                  {/* Ficha de fotos (brief de octubre-2026): carrusel con
                      todas las fotos de la casa, no una sola imagen. */}
                  <GaleriaFicha
                    imagenes={galerias.get(casa.id) ?? casa.imagenes}
                    alt={copy.inventario.altFicha(casa.titulo, casa.ciudad)}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    sinFoto={copy.inventario.sinFoto}
                    controles="abajo"
                    pie={casa.zona ? `${casa.zona} · ${casa.ciudad}` : casa.ciudad}
                    className="mt-4 [&>div:first-child]:!rounded-none"
                  />

                  <h3 className="lpc-titulo mt-3 text-[1.0625rem] text-[var(--lpc-ink)]">
                    {casa.titulo}
                  </h3>

                  {detalle.length > 0 && (
                    <p className="lpc-cifra mt-2 text-sm leading-relaxed text-[var(--lpc-ink-2)]">
                      {detalle.join(' · ')}
                    </p>
                  )}

                  {/* El precio es la promesa del anuncio. Va con el peso
                      tipográfico más alto de la tarjeta y separado por regla. */}
                  <div className="mt-5 border-t border-[var(--lpc-line)] pt-4">
                    <p className="lpc-display lpc-cifra text-[1.5rem] text-[var(--lpc-ink)]">
                      {casa.precio ? dinero(casa.precio) : <Gate copy={copy} />}
                    </p>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--lpc-ink-2)]">
                      {copy.inventario.enganche}{' '}
                      {casa.enganchePct ? (
                        <span className="lpc-cifra text-[var(--lpc-ink)]">
                          {casa.enganchePct}%
                          {casa.engancheMxn ? ` · ${mxn(casa.engancheMxn)}` : ''}
                        </span>
                      ) : (
                        <Gate copy={copy} />
                      )}
                    </p>
                  </div>

                  {/* `mt-auto` en el envoltorio, no en el botón: las tarjetas
                      de una fila tienen títulos de distinto alto, y sin esto
                      los CTA quedan a alturas distintas y la retícula se
                      deshace. Va en un div para poder separar con `pt-6` sin
                      que un `mt-*` compita con el `mt-auto`. */}
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() => elegir(casa.slug)}
                      aria-pressed={elegida}
                      className={`inline-flex min-h-[52px] w-full items-center justify-between gap-3 border px-4 text-sm transition-colors duration-200 ${
                        elegida
                          ? 'border-[var(--lpc-ink)] bg-[var(--lpc-ink)] text-[var(--lpc-paper)]'
                          : 'border-[var(--lpc-line-strong)] text-[var(--lpc-ink)] hover:bg-[var(--lpc-ink)] hover:text-[var(--lpc-paper)]'
                      }`}
                    >
                      {elegida ? copy.inventario.elegida : copy.inventario.elegir}
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Formulario de cierre. `scroll-mt` para que el filete de la sección no
          quede tapado por la barra fija de móvil al hacer scroll programático. */}
      <section
        id="solicitar"
        ref={anclaForm}
        className="scroll-mt-4 bg-[var(--lpc-dark)] pb-28 pt-16 sm:pb-24 sm:pt-24"
      >
        <div className="mx-auto grid max-w-[92rem] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div className="lpc-invertido">
            <p className="lpc-etiqueta text-[var(--lpc-signal-on-dark)]">{copy.cierre.etiqueta}</p>
            <h2 className="lpc-display mt-4 text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] text-[var(--lpc-on-dark)]">
              {copy.cierre.titulo(casas.length)}
            </h2>
            {copy.cierre.cuerpo && (
              <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--lpc-on-dark-2)]">
                {copy.cierre.cuerpo}
              </p>
            )}

            <ul className="mt-10 max-w-[52ch] divide-y divide-[var(--lpc-line-dark)] border-y border-[var(--lpc-line-dark)]">
              {copy.cierre.puntos.map(([titulo, detalle]) => (
                <li key={titulo} className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <span className="lpc-etiqueta pt-1 text-[var(--lpc-on-dark)]">{titulo}</span>
                  <span className="text-sm leading-relaxed text-[var(--lpc-on-dark-2)]">
                    {detalle}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <FormCasas
              variante="cierre"
              casas={opciones}
              casaSeleccionada={casaSeleccionada}
              onCasaChange={setCasaSeleccionada}
              telefonoWhatsApp={telefonoWhatsApp}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </>
  );
}
