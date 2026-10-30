'use client';

import { useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { Bath, Bed, Clock, KeyRound, Ruler, Waves } from '@/lib/icons';
import { dinero, m2 } from '../../_components/format';
import { ANCLA_INVENTARIO } from '../../_components/v2/ChipsUbicacion';
import type { FiltroDef } from '../../_components/v2/filtros';
import { useFiltros } from '../../_components/v2/useFiltros';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, ubicacionCorta } from '../../_components/v2/util';
import { FORM } from '../_copy';

// ============================================================
// Las casas, una por una, y el formulario.
//
// LA FICHA ES LA FOTO (referencia: Alexander Millett). Nada de tarjeta con
// borde, título debajo y botón: la foto ocupa toda la celda, el precio y el
// nombre van encima en blanco, y las características van SIEMPRE visibles,
// en grande y con icono (lo pidió Luis el 30-oct-2026: que se vea qué tiene
// cada casa sin pasar el cursor). La retícula alterna anchos 7/5 y 5/7 para
// que dos fotos juntas no se lean como dos tarjetas iguales.
//
// EL MISMO FILTRO EN TRES SITIOS: los chips del hero, la barra de zonas de
// aquí y los chips del formulario comparten estado por evento (`useFiltros`).
// Lo que el visitante elige acota la cuadrícula y viaja en el lead.
//
// Pulsar una ficha la deja elegida en el formulario y baja hasta él.
// ============================================================

const ANCHOS: [string, string] = ['lg:col-span-7', 'lg:col-span-5'];

/** Una característica con icono sobre la foto. Solo se pinta si hay dato. */
function Dato({ icono: Icono, children }: { icono: typeof Bed; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icono className="h-[1.125em] w-[1.125em] shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
      {children}
    </span>
  );
}

export default function Catalogo({
  casas,
  filtros,
  telefonoWhatsApp,
  fotoFormulario,
}: {
  casas: PropiedadLanding[];
  filtros: FiltroDef[];
  telefonoWhatsApp: string;
  fotoFormulario: { src: string; alt: string } | null;
}) {
  const { seleccion, elegir: elegirFiltro, visibles, activos, limpiar } = useFiltros(casas, filtros);
  const zonas = filtros.find((f) => f.id === 'ubicacion')?.opciones ?? [];
  const zonaActiva = seleccion.ubicacion ?? null;
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));

  function elegir(slug: string) {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="scroll-mt-2 bg-white">
        {/* Barra de filtros: una línea de texto, sin caja. */}
        <div className="lpx-filtros border-b border-[var(--lpv-line)]">
          <div className="lpx-filtros-fila mx-auto flex max-w-[96rem] items-center gap-2 overflow-x-auto px-5 py-3 sm:flex-wrap sm:overflow-visible sm:px-8">
            <button
              type="button"
              aria-pressed={zonaActiva === null}
              onClick={() => elegirFiltro('ubicacion', null)}
              className="lpx-chip inline-flex min-h-[38px] shrink-0 items-center rounded-full px-4 text-[0.875rem]"
            >
              Todas
            </button>
            {zonas.map((u) => (
              <button
                key={u.valor}
                type="button"
                aria-pressed={zonaActiva === u.valor}
                onClick={() => elegirFiltro('ubicacion', zonaActiva === u.valor ? null : u.valor)}
                className="lpx-chip inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-full px-4 text-[0.875rem]"
              >
                {u.etiqueta}
                <span className="opacity-55">{u.total}</span>
              </button>
            ))}
            <p className="ml-auto shrink-0 whitespace-nowrap text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
              {plural(visibles.length, 'casa', 'casas')}
              {activos > (zonaActiva ? 1 : 0) && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={limpiar}
                    className="cursor-pointer underline underline-offset-2 hover:text-[var(--lpv-fg)]"
                  >
                    Quitar filtros
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="mx-auto max-w-[96rem] px-5 py-24 sm:px-8">
            <p className="text-[var(--lpv-fg-2)]">
              Ninguna casa publicada cumple todo lo que elegiste. Quita un filtro o pide la información y te decimos qué hay cerca.
            </p>
            <button
              type="button"
              onClick={limpiar}
              className="lpx-chip mt-6 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-5 text-[0.875rem]"
            >
              Ver todas las casas
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-1 lg:grid-cols-12">
            {visibles.map((casa, i) => {
              const esElegida = elegida === casa.slug;
              // Pares 7/5, 5/7, 7/5… El impar final ocupa el ancho entero.
              const esUltimoImpar = i === visibles.length - 1 && visibles.length % 2 === 1;
              const ancho = esUltimoImpar ? 'lg:col-span-12' : ANCHOS[(Math.floor(i / 2) + i) % 2];
              return (
                <li key={casa.id} className={`lpx-ficha group relative ${ancho}`}>
                  <GaleriaFicha
                    imagenes={casa.imagenes}
                    alt={`${casa.titulo}, ${ubicacionCorta(casa)}`}
                    aspecto={esUltimoImpar ? 'aspect-[21/9]' : 'aspect-[4/3] lg:aspect-[3/2]'}
                    sizes={esUltimoImpar ? '100vw' : '(min-width: 1024px) 58vw, 100vw'}
                    prioridad={i < 2}
                    tope={10}
                    className="!rounded-none"
                  />
                  {/* Velo y texto. `pointer-events-none` para que las flechas
                      de la galería sigan recibiendo el clic. */}
                  <div className="lpx-velo pointer-events-none absolute inset-0" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                    <p className="lpx-sobre-foto text-[0.8125rem] text-white/80">{ubicacionCorta(casa)}</p>
                    <h3 className="lpx-display lpx-sobre-foto mt-1.5 max-w-[30ch] text-[clamp(1.25rem,1rem+1vw,1.875rem)]">
                      {casa.titulo}
                    </h3>
                    {/* Las características, grandes y con icono, siempre a la vista. */}
                    <p className="lpx-specs lpx-sobre-foto mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[clamp(0.9375rem,0.85rem+0.4vw,1.125rem)] text-white">
                      {casa.recamaras ? <Dato icono={Bed}>{casa.recamaras} rec</Dato> : null}
                      {casa.banos ? <Dato icono={Bath}>{casa.banos} {casa.banos === 1 ? 'baño' : 'baños'}</Dato> : null}
                      {casa.m2Construidos ? <Dato icono={Ruler}>{m2(casa.m2Construidos)}</Dato> : null}
                      {casa.alberca ? <Dato icono={Waves}>Alberca</Dato> : null}
                      {casa.estadoComercial === 'entrega_inmediata' ? (
                        <Dato icono={KeyRound}>{ESTADO_TEXTO.entrega_inmediata}</Dato>
                      ) : casa.estadoComercial === 'preventa' ? (
                        <Dato icono={Clock}>{ESTADO_TEXTO.preventa}</Dato>
                      ) : null}
                      {casa.enganchePct ? <span>Enganche {casa.enganchePct}%</span> : null}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <p className="lpx-display lpx-sobre-foto text-[clamp(1.375rem,1rem+1.4vw,2.25rem)]">
                        {casa.precio ? dinero(casa.precio) : 'Precio por confirmar'}
                      </p>
                      <span
                        className={`lpx-sobre-foto inline-block shrink-0 rounded-full border px-3.5 py-1.5 text-[0.8125rem] ${
                          esElegida ? 'border-white bg-white text-[#111] [text-shadow:none]' : 'border-white/60 text-white'
                        }`}
                      >
                        {esElegida ? 'Elegida' : 'Quiero esta casa'}
                      </span>
                    </div>
                  </div>
                  {/* El botón cubre la ficha entera salvo la franja de la
                      galería, que se queda para deslizar fotos. */}
                  <button
                    type="button"
                    onClick={() => elegir(casa.slug)}
                    aria-pressed={esElegida}
                    aria-label={`Quiero esta casa: ${casa.titulo}`}
                    className="absolute inset-x-0 bottom-0 top-1/2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ══ FORMULARIO: foto a la izquierda, campos a la derecha, todo claro ══ */}
      <section id="solicitar" ref={anclaForm} className="scroll-mt-4 border-t border-[var(--lpv-line)] bg-white pb-28 sm:pb-0">
        <div className="grid lg:grid-cols-12">
          {fotoFormulario && (
            <figure className="relative hidden min-h-[40rem] lg:col-span-5 lg:block">
              <Image
                src={fotoFormulario.src}
                alt={fotoFormulario.alt}
                fill
                sizes="(min-width: 1024px) 42vw, 0px"
                className="object-cover"
              />
            </figure>
          )}
          <div className="lg:col-span-7">
            <div className="mx-auto max-w-[44rem] px-5 py-14 sm:px-12 sm:py-20">
              <FormInventario
                source="lp_casas_pdc"
                variante="cierre"
                copy={FORM}
                opciones={opciones}
                seleccion={elegida}
                onSeleccion={setElegida}
                filtros={filtros}
                propiedades={casas}
                telefonoWhatsApp={telefonoWhatsApp}
                className="!p-0"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
