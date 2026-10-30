'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowRight } from '@/lib/icons';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero, mxn } from '../../_components/format';
import { ANCLA_INVENTARIO, ChipsUbicacion, useFiltroUbicacion } from '../../_components/v2/ChipsUbicacion';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { FORM } from '../_copy';

// ============================================================
// Retícula editorial filtrable + formulario de cierre.
//
// Comparten estado: «Me interesa» en una ficha la deja elegida en el
// formulario de abajo y lleva el foco hasta él.
//
// LA RETÍCULA NO ES UNIFORME. Seis columnas: la primera ficha visible ocupa
// cuatro (16:10, horizontal), las demás dos (4:5, vertical). Al cambiar el
// filtro, la primera del nuevo subconjunto es la grande. Es la composición
// de revista: una lámina de apertura y el resto en columna. Las fichas no
// enlazan a nada; informan y convierten.
// ============================================================

export default function Catalogo({
  departamentos,
  telefonoWhatsApp,
}: {
  departamentos: PropiedadLanding[];
  telefonoWhatsApp: string;
}) {
  const { activa, setActiva, visibles, ubicaciones } = useFiltroUbicacion(departamentos, 'ciudad');
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = departamentos.map((d) => ({ slug: d.slug, titulo: d.titulo }));

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="scroll-mt-2 bg-[var(--lpv-bg)]">
        <div className="lpd-filtros border-b border-[var(--lpv-line)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <ChipsUbicacion
              ubicaciones={ubicaciones}
              activa={activa}
              onChange={setActiva}
              etiquetaTodas="Toda la Riviera Maya"
              tono="oscuro"
            />
            <p className="lpv-cifra text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
              {plural(visibles.length, 'departamento', 'departamentos')}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
          {visibles.length === 0 ? (
            <p className="py-16 text-center text-[var(--lpv-fg-2)]">
              No hay departamentos publicados en esa ciudad ahora mismo. Elige otra o pide que te avisemos.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-6 md:gap-y-16">
              {visibles.map((depto, i) => {
                const detalle = specsVivienda(depto);
                const esElegida = elegida === depto.slug;
                const grande = i === 0;
                return (
                  <li
                    key={depto.id}
                    className={`lpd-ficha flex flex-col ${grande ? 'md:col-span-4' : 'md:col-span-2'}`}
                  >
                    <GaleriaFicha
                      imagenes={depto.imagenes}
                      alt={`${depto.titulo}, ${ubicacionCorta(depto)}`}
                      aspecto={grande ? 'aspect-[16/10]' : 'aspect-[4/5]'}
                      sizes={
                        grande
                          ? '(min-width: 1024px) 62vw, 92vw'
                          : '(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw'
                      }
                      prioridad={i < 2}
                    />
                    <div className="flex flex-1 flex-col pt-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <p
                          className={`lpd-serif text-[var(--lpv-fg)] ${
                            grande ? 'text-[clamp(2rem,1.5rem+2vw,3rem)]' : 'text-[1.875rem]'
                          }`}
                        >
                          {depto.precio ? dinero(depto.precio) : 'Precio por confirmar'}
                        </p>
                        <span className="lpd-estado shrink-0 rounded-[var(--lpv-r-control)] px-2 py-1 text-[0.6875rem] uppercase tracking-[0.1em]">
                          {ESTADO_TEXTO[depto.estadoComercial]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--lpv-fg-3)]">{ubicacionCorta(depto)}</p>
                      <h3 className="mt-1.5 text-[1.0625rem] leading-snug text-[var(--lpv-fg)]">
                        {depto.titulo}
                      </h3>
                      {detalle.length > 0 && (
                        <p className="lpv-cifra mt-3 text-sm leading-relaxed text-[var(--lpv-fg-2)]">
                          {detalle.join(' · ')}
                        </p>
                      )}
                      <p className="mt-2 text-[0.8125rem] text-[var(--lpv-fg-2)]">
                        Enganche{' '}
                        {depto.enganchePct ? (
                          <span className="lpv-cifra text-[var(--lpv-fg)]">
                            {depto.enganchePct}%{depto.engancheMxn ? ` · ${mxn(depto.engancheMxn)}` : ''}
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
                          onClick={() => elegir(depto.slug)}
                          aria-pressed={esElegida}
                          className={`inline-flex min-h-[48px] items-center justify-between gap-3 rounded-[var(--lpv-r-control)] border px-5 text-sm transition-colors duration-200 active:translate-y-px ${
                            grande ? 'w-full sm:w-auto sm:min-w-[16rem]' : 'w-full'
                          } ${
                            esElegida
                              ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
                              : 'border-[var(--lpv-accent)] text-[var(--lpv-accent)] hover:bg-[var(--lpv-accent)] hover:text-[var(--lpv-on-accent)]'
                          }`}
                        >
                          {esElegida ? 'Elegido, completa tus datos' : 'Me interesa'}
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

      <section
        id="solicitar"
        ref={anclaForm}
        className="scroll-mt-4 border-t border-[var(--lpv-line)] bg-[var(--lpv-bg)] pb-28 pt-16 text-[var(--lpv-fg)] sm:pb-24 sm:pt-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div>
            <h2 className="lpd-serif max-w-[18ch] text-[clamp(2.5rem,1.8rem+3.2vw,4.5rem)] text-[var(--lpv-fg)]">
              Te mandamos la información completa de los {departamentos.length}.
            </h2>
            <p className="mt-8 max-w-[48ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
              Precio de cada departamento, enganche, qué incluye la entrega y cuáles siguen disponibles hoy.
            </p>
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <FormInventario
              source="lp_deptos_rm"
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
