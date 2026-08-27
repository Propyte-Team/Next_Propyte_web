'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from '@/lib/icons';
import type { CasaLanding } from '@/lib/supabase/lp-casas';
import { dinero, m2, mxn } from '../../_components/format';
import FormCasas from './FormCasas';

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
function Gate() {
  return (
    <span className="lpc-etiqueta inline-block border-b border-dotted border-[var(--lpc-ink-3)] pb-px text-[var(--lpc-ink-3)]">
      Confirmar
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
function specs(casa: CasaLanding): string[] {
  const partes: string[] = [];
  if (casa.recamaras) partes.push(`${casa.recamaras} rec`);
  if (casa.banos) partes.push(`${casa.banos} baños`);
  if (casa.m2Construidos) partes.push(`${m2(casa.m2Construidos)} const.`);
  if (casa.m2Terreno) partes.push(`${m2(casa.m2Terreno)} terreno`);
  if (casa.estacionamientos) partes.push(`${casa.estacionamientos} autos`);
  if (casa.alberca) partes.push('Alberca');
  return partes;
}

export default function Inventario({
  casas,
  telefonoWhatsApp,
}: {
  casas: CasaLanding[];
  telefonoWhatsApp: string;
}) {
  const [casaSeleccionada, setCasaSeleccionada] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);

  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));

  const elegir = useCallback((slug: string) => {
    setCasaSeleccionada(slug);
    // `scrollIntoView` y no `location.hash`: el hash deja la URL sucia y, si el
    // visitante recarga, aterriza en el formulario sin haber visto el hero.
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <section id="inventario" className="lpc-regla bg-[var(--lpc-paper)]">
        <div className="mx-auto max-w-[92rem] px-5 py-16 sm:px-8 sm:py-24">
          <header className="max-w-[62ch]">
            <p className="lpc-etiqueta text-[var(--lpc-signal)]">
              Inventario · {casas.length} casas disponibles
            </p>
            <h2 className="lpc-titulo mt-4 text-[clamp(1.75rem,1.3rem+2vw,3rem)] text-[var(--lpc-ink)]">
              Estas son las casas. No son ejemplos.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--lpc-ink-2)]">
              Cada una está publicada, aprobada y con precio vigente en nuestro sistema. Si una se
              vende, desaparece de esta página en la siguiente actualización — no la dejamos puesta
              para que la llamada empiece con una decepción.
            </p>
          </header>

          <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {casas.map((casa, i) => {
              const detalle = specs(casa);
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
                      {casa.preventa ? 'Preventa' : 'Entrega inmediata'}
                    </span>
                  </div>

                  <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden bg-[var(--lpc-paper-2)]">
                    {casa.imagen ? (
                      <Image
                        src={casa.imagen}
                        alt={`${casa.titulo} — ${casa.ciudad}`}
                        fill
                        // Tres columnas en escritorio, dos en tableta, una en
                        // móvil. Sin esto Next sirve la imagen para el ancho
                        // completo del viewport en las tres.
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                        className="lpc-foto object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="lpc-etiqueta text-[var(--lpc-ink-3)]">Sin fotografía</span>
                      </div>
                    )}
                  </div>

                  <p className="lpc-etiqueta mt-4 text-[var(--lpc-ink-3)]">
                    {casa.zona ? `${casa.zona} · ${casa.ciudad}` : casa.ciudad}
                  </p>

                  <h3 className="lpc-titulo mt-2 text-[1.0625rem] text-[var(--lpc-ink)]">
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
                      {casa.precio ? dinero(casa.precio) : <Gate />}
                    </p>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--lpc-ink-2)]">
                      Enganche{' '}
                      {casa.enganchePct ? (
                        <span className="lpc-cifra text-[var(--lpc-ink)]">
                          {casa.enganchePct}%
                          {casa.engancheMxn ? ` · ${mxn(casa.engancheMxn)}` : ''}
                        </span>
                      ) : (
                        <Gate />
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
                      {elegida ? 'Elegida — completa tus datos' : 'Quiero esta casa'}
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
            <p className="lpc-etiqueta text-[var(--lpc-signal-on-dark)]">Último paso</p>
            <h2 className="lpc-display mt-4 text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] text-[var(--lpc-on-dark)]">
              Te mandamos los números completos de las {casas.length}.
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--lpc-on-dark-2)]">
              No es un catálogo de fotos. Es el precio de cada casa, el enganche que pide cada
              desarrollador, qué incluye la entrega y cuáles siguen disponibles hoy.
            </p>

            <ul className="mt-10 max-w-[52ch] divide-y divide-[var(--lpc-line-dark)] border-y border-[var(--lpc-line-dark)]">
              {[
                ['Precio cerrado', 'De cada una de las casas, en su moneda de venta.'],
                ['Enganche y esquema', 'Lo que pide cada desarrollador para apartar.'],
                ['Qué incluye', 'Equipada, llave en mano o en obra — dicho sin adornos.'],
                ['Disponibilidad', 'Cuáles siguen libres al día de tu solicitud.'],
              ].map(([titulo, detalle]) => (
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
            />
          </div>
        </div>
      </section>
    </>
  );
}
