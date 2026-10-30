'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from '@/lib/icons';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero, mxn } from '../../_components/format';
import { ANCLA_INVENTARIO, ChipsUbicacion, useFiltroUbicacion } from '../../_components/v2/ChipsUbicacion';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { CIERRE_PUNTOS, FORM, VISTA_TEXTO } from '../_copy';

// ============================================================
// Rail horizontal de fichas + formulario de cierre.
//
// RAIL Y NO CUADRÍCULA: el inventario frente al mar es corto (hoy nueve) y
// son propiedades de ticket alto. Una ficha grande que se recorre de lado,
// como una galería, le da a cada una el espacio que en una retícula de tres
// no tiene. Snap nativo: el navegador hace el gesto; aquí solo van las
// flechas para el ratón. En móvil el rail se conserva (una ficha por
// pantalla, 88vw) porque el gesto lateral es el natural en táctil.
//
// Comparte estado con el formulario de abajo: «Me interesa» en una ficha la
// deja elegida y baja al formulario. LA FICHA NO ENLAZA A NADA.
// ============================================================

export default function Catalogo({
  propiedades,
  telefonoWhatsApp,
}: {
  propiedades: PropiedadLanding[];
  telefonoWhatsApp: string;
}) {
  const { activa, setActiva, visibles, ubicaciones } = useFiltroUbicacion(propiedades, 'ciudad');
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLUListElement>(null);
  const opciones = propiedades.map((p) => ({ slug: p.slug, titulo: p.titulo }));

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const desplazar = useCallback((direccion: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const ficha = el.querySelector<HTMLElement>('li');
    const paso = ficha ? ficha.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: direccion * paso, behavior: 'smooth' });
  }, []);

  const botonRail =
    'hidden h-11 w-11 items-center justify-center rounded-[var(--lpv-r-control)] border border-[var(--lpv-line-2)] text-[var(--lpv-fg)] transition-colors duration-200 hover:border-[var(--lpv-accent)] hover:text-[var(--lpv-accent)] active:translate-y-px md:inline-flex';

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="scroll-mt-2 bg-[var(--lpv-bg)]">
        <div className="lpo-filtros border-b border-[var(--lpv-line)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <ChipsUbicacion
              ubicaciones={ubicaciones}
              activa={activa}
              onChange={setActiva}
              etiquetaTodas="Toda la costa"
              tono="oscuro"
            />
            <p className="lpv-cifra text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
              {plural(visibles.length, 'propiedad', 'propiedades')}
            </p>
          </div>
        </div>

        <div className="py-10 sm:py-14">
          {visibles.length === 0 ? (
            <p className="mx-auto max-w-7xl px-5 py-16 text-center text-[var(--lpv-fg-2)] sm:px-8">
              No hay propiedades frente al mar publicadas en esa ciudad ahora mismo. Elige otra o pide que te avisemos.
            </p>
          ) : (
            <>
              <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
                <h2 className="lpv-display lpo-titular text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] leading-[1.08] text-[var(--lpv-fg)]">
                  Las propiedades, una por una
                </h2>
                <div className="flex gap-2">
                  <button type="button" onClick={() => desplazar(-1)} aria-label="Anterior" className={botonRail}>
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button type="button" onClick={() => desplazar(1)} aria-label="Siguiente" className={botonRail}>
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>

              {/* El rail sangra hasta el borde derecho de la ventana: el
                  recorte de la última ficha visible es la pista de que hay
                  más, sin un rótulo que lo diga. */}
              <ul
                ref={rail}
                className="lpo-rail mt-8 flex gap-6 overflow-x-auto px-5 pb-2 sm:px-8 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]"
              >
                {visibles.map((p, i) => {
                  const detalle = specsVivienda(p);
                  const esElegida = elegida === p.slug;
                  const tipoVista = [p.tipo, p.vista ? VISTA_TEXTO[p.vista] ?? p.vista : null]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li
                      key={p.id}
                      className="lpo-ficha flex w-[min(88vw,32rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--lpv-r)] border border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]"
                    >
                      <GaleriaFicha
                        imagenes={p.imagenes}
                        alt={`${p.titulo}, ${ubicacionCorta(p)}`}
                        aspecto="aspect-[3/2]"
                        sizes="(min-width: 640px) 32rem, 88vw"
                        prioridad={i < 2}
                        className="!rounded-none"
                      />
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-start justify-between gap-3">
                          <p className="lpv-display lpo-titular lpv-cifra text-[1.75rem] leading-none text-[var(--lpv-fg)]">
                            {p.precio ? dinero(p.precio) : 'Precio por confirmar'}
                          </p>
                          <span className="shrink-0 rounded-[var(--lpv-r-control)] border border-[var(--lpv-line)] px-2.5 py-1 text-[0.6875rem] text-[var(--lpv-fg-2)]">
                            {ESTADO_TEXTO[p.estadoComercial]}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--lpv-accent)]">{tipoVista}</p>
                        <p className="mt-1 text-sm text-[var(--lpv-fg-3)]">{ubicacionCorta(p)}</p>
                        <h3 className="mt-3 text-[1.0625rem] font-medium leading-snug text-[var(--lpv-fg)]">
                          {p.titulo}
                        </h3>
                        {detalle.length > 0 && (
                          <p className="lpv-cifra mt-3 text-sm leading-relaxed text-[var(--lpv-fg-2)]">
                            {detalle.join(' · ')}
                          </p>
                        )}
                        <p className="mt-3 text-[0.8125rem] text-[var(--lpv-fg-2)]">
                          Enganche{' '}
                          {p.enganchePct ? (
                            <span className="lpv-cifra font-medium text-[var(--lpv-fg)]">
                              {p.enganchePct}%{p.engancheMxn ? ` · ${mxn(p.engancheMxn)}` : ''}
                            </span>
                          ) : (
                            <span className="border-b border-dotted border-[var(--lpv-fg-3)] text-[var(--lpv-fg-3)]">
                              por confirmar
                            </span>
                          )}
                        </p>
                        <div className="mt-auto pt-6">
                          <button
                            type="button"
                            onClick={() => elegir(p.slug)}
                            aria-pressed={esElegida}
                            className={`inline-flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[var(--lpv-r-control)] border px-5 text-sm font-medium transition-colors duration-200 active:translate-y-px ${
                              esElegida
                                ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
                                : 'border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-accent)] hover:bg-[var(--lpv-accent)] hover:text-[var(--lpv-on-accent)]'
                            }`}
                          >
                            {esElegida ? 'Elegida, completa tus datos' : 'Me interesa'}
                            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {/* Separador final para que la última ficha pueda alinearse al
                    inicio del rail sin quedar pegada al borde. */}
                <li aria-hidden className="w-px shrink-0" />
              </ul>
            </>
          )}
        </div>
      </section>

      <section
        id="solicitar"
        ref={anclaForm}
        className="scroll-mt-4 border-t border-[var(--lpv-line)] bg-[var(--lpv-bg)] pb-28 pt-16 text-[var(--lpv-fg)] sm:pb-24 sm:pt-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div>
            <h2 className="lpv-display lpo-titular text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] leading-[1.02]">
              Te mandamos la información completa de las {propiedades.length}.
            </h2>
            <ul className="mt-10 max-w-[52ch] divide-y divide-[var(--lpv-line)] border-y border-[var(--lpv-line)]">
              {CIERRE_PUNTOS.map(([titulo, detalle]) => (
                <li key={titulo} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <span className="text-sm font-medium text-[var(--lpv-fg)]">{titulo}</span>
                  <span className="text-sm leading-relaxed text-[var(--lpv-fg-2)]">{detalle}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <FormInventario
              source="lp_frente_mar"
              variante="cierre"
              copy={FORM}
              opciones={opciones}
              seleccion={elegida}
              onSeleccion={setElegida}
              telefonoWhatsApp={telefonoWhatsApp}
              className="border border-[var(--lpv-panel-line)]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
