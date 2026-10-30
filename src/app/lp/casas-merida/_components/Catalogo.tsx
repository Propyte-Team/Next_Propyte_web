'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowRight } from '@/lib/icons';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero, mxn } from '../../_components/format';
import { ANCLA_INVENTARIO, ChipsUbicacion, useFiltroUbicacion } from '../../_components/v2/ChipsUbicacion';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { CIERRE_PUNTOS, FORM, OTRA_OPCION } from '../_copy';

// ============================================================
// Listado filtrable + formulario de cierre.
//
// Con UNA casa publicada (el caso de hoy en Mérida) el listado no se pinta:
// la casa ya ocupa el hero y la ficha, y repetirla en una cuadrícula de uno
// se lee como inventario inflado. En su lugar va la sección «¿Buscas algo
// distinto?», que convierte la escasez en una promesa sostenible: búsqueda,
// no inventario. Con dos o más casas, la cuadrícula aparece sola.
//
// El formulario de cierre vive aquí porque comparte estado con las fichas:
// «Quiero esta casa» la deja elegida abajo y lleva el foco al formulario.
// ============================================================

export default function Catalogo({
  casas,
  telefonoWhatsApp,
}: {
  casas: PropiedadLanding[];
  telefonoWhatsApp: string;
}) {
  const { activa, setActiva, visibles, ubicaciones } = useFiltroUbicacion(casas, 'zona');
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));
  const varias = casas.length > 1;

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      {varias ? (
        <section id={ANCLA_INVENTARIO} className="scroll-mt-2 border-t border-[var(--lpv-line)] bg-[var(--lpv-bg)]">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="lpv-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
                Las {casas.length} casas publicadas en Mérida
              </h2>
              <p className="lpv-cifra text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
                {plural(visibles.length, 'casa', 'casas')}
              </p>
            </div>

            {ubicaciones.length > 1 && (
              <div className="mt-6">
                <ChipsUbicacion
                  ubicaciones={ubicaciones}
                  activa={activa}
                  onChange={setActiva}
                  etiquetaTodas="Toda Mérida"
                />
              </div>
            )}

            {visibles.length === 0 ? (
              <p className="py-16 text-center text-[var(--lpv-fg-2)]">
                No hay casas publicadas en esa zona ahora mismo. Elige otra o pide que te avisemos.
              </p>
            ) : (
              <ul className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                {visibles.map((casa) => {
                  const detalle = specsVivienda(casa);
                  const esElegida = elegida === casa.slug;
                  return (
                    <li
                      key={casa.id}
                      className="lpm-ficha grid overflow-hidden rounded-[var(--lpv-r)] border border-[var(--lpv-line)] bg-white sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
                    >
                      <GaleriaFicha
                        imagenes={casa.imagenes}
                        alt={`${casa.titulo}, ${ubicacionCorta(casa)}`}
                        aspecto="aspect-[4/3] sm:aspect-auto sm:h-full"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 92vw"
                        className="!rounded-none"
                      />
                      <div className="flex flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="lpv-display lpv-cifra text-[1.375rem] font-semibold leading-none tracking-[-0.02em]">
                            {casa.precio ? dinero(casa.precio) : 'Precio por confirmar'}
                          </p>
                          <span className="lpm-estado shrink-0 rounded-[var(--lpv-r-control)] px-2 py-1 text-[0.6875rem] font-medium">
                            {ESTADO_TEXTO[casa.estadoComercial]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--lpv-fg-3)]">{ubicacionCorta(casa)}</p>
                        <h3 className="mt-2 text-[1rem] font-medium leading-snug">{casa.titulo}</h3>
                        {detalle.length > 0 && (
                          <p className="lpv-cifra mt-3 text-sm leading-relaxed text-[var(--lpv-fg-2)]">
                            {detalle.join(' · ')}
                          </p>
                        )}
                        <p className="mt-3 text-[0.8125rem] text-[var(--lpv-fg-2)]">
                          Enganche{' '}
                          {casa.enganchePct ? (
                            <span className="lpv-cifra font-medium text-[var(--lpv-fg)]">
                              {casa.enganchePct}%{casa.engancheMxn ? ` · ${mxn(casa.engancheMxn)}` : ''}
                            </span>
                          ) : (
                            <span className="border-b border-dotted border-[var(--lpv-fg-3)] text-[var(--lpv-fg-3)]">
                              por confirmar
                            </span>
                          )}
                        </p>
                        <div className="mt-auto pt-5">
                          <button
                            type="button"
                            onClick={() => elegir(casa.slug)}
                            aria-pressed={esElegida}
                            className={`inline-flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[var(--lpv-r-control)] border px-4 text-sm font-medium transition-colors duration-200 active:translate-y-px ${
                              esElegida
                                ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
                                : 'border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-accent)] hover:bg-[var(--lpv-accent)] hover:text-[var(--lpv-on-accent)]'
                            }`}
                          >
                            {esElegida ? 'Elegida, completa tus datos' : 'Quiero esta casa'}
                            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <section id={ANCLA_INVENTARIO} className="scroll-mt-2 border-t border-[var(--lpv-line)] bg-[var(--lpv-bg)]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <h2 className="lpv-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
                  {OTRA_OPCION.titulo}
                </h2>
                <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
                  {OTRA_OPCION.cuerpo}
                </p>
              </div>
              <a
                href="#solicitar"
                className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[var(--lpv-r-control)] border border-[var(--lpv-line-2)] px-6 text-sm font-medium text-[var(--lpv-fg)] transition-colors duration-200 hover:border-[var(--lpv-accent)] hover:bg-[var(--lpv-accent)] hover:text-[var(--lpv-on-accent)] active:translate-y-px"
              >
                {OTRA_OPCION.cta}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            </div>
          </div>
        </section>
      )}

      <section
        id="solicitar"
        ref={anclaForm}
        className="scroll-mt-4 bg-[var(--lpv-panel-bg)] pb-28 pt-16 text-[var(--lpv-panel-fg)] sm:pb-24 sm:pt-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div>
            <h2 className="lpv-display text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              {varias ? `Te mandamos la ficha completa de las ${casas.length}.` : 'Te mandamos la ficha completa.'}
            </h2>
            <ul className="mt-10 max-w-[52ch] divide-y divide-[var(--lpv-panel-line)] border-y border-[var(--lpv-panel-line)]">
              {CIERRE_PUNTOS.map(([titulo, detalle]) => (
                <li key={titulo} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-panel-fg)]">
                    {titulo}
                  </span>
                  <span className="text-sm leading-relaxed text-[var(--lpv-panel-fg-2)]">{detalle}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <FormInventario
              source="lp_casas_merida"
              variante="cierre"
              copy={FORM}
              opciones={opciones}
              seleccion={elegida}
              onSeleccion={setElegida}
              telefonoWhatsApp={telefonoWhatsApp}
              className="border border-[var(--lpv-panel-line)] bg-[var(--lpv-panel-bg-2)]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
