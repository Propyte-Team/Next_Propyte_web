'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero } from '../../_components/format';
import { ANCLA_INVENTARIO, TODAS, useFiltroUbicacion } from '../../_components/v2/ChipsUbicacion';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { FORM } from '../_copy';

// ============================================================
// Las casas, una por una, y el formulario.
//
// LA FICHA ES LA FOTO (referencia: Alexander Millett). Nada de tarjeta con
// borde, título debajo y botón: la foto ocupa toda la celda, el precio y el
// nombre van encima en blanco, y las características aparecen al pasar el
// cursor (siempre visibles en táctil). La retícula alterna anchos 7/5 y 5/7
// para que dos fotos juntas no se lean como dos tarjetas iguales.
//
// Pulsar una ficha la deja elegida en el formulario y baja hasta él.
// ============================================================

const ANCHOS: [string, string] = ['lg:col-span-7', 'lg:col-span-5'];

export default function Catalogo({
  casas,
  telefonoWhatsApp,
  fotoFormulario,
}: {
  casas: PropiedadLanding[];
  telefonoWhatsApp: string;
  fotoFormulario: { src: string; alt: string } | null;
}) {
  const { activa, setActiva, visibles, ubicaciones } = useFiltroUbicacion(casas, 'zona');
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="scroll-mt-2 bg-white">
        {/* Barra de filtros: una línea de texto, sin caja. */}
        <div className="lpx-filtros border-b border-[var(--lpv-line)]">
          <div className="lpx-filtros-fila mx-auto flex max-w-[96rem] items-center gap-2 overflow-x-auto px-5 py-3 sm:flex-wrap sm:overflow-visible sm:px-8">
            <button
              type="button"
              aria-pressed={activa === TODAS}
              onClick={() => setActiva(TODAS)}
              className="lpx-chip inline-flex min-h-[38px] shrink-0 items-center rounded-full px-4 text-[0.875rem]"
            >
              Todas
            </button>
            {ubicaciones.map((u) => (
              <button
                key={u.clave}
                type="button"
                aria-pressed={activa === u.clave}
                onClick={() => setActiva(u.clave)}
                className="lpx-chip inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-full px-4 text-[0.875rem]"
              >
                {u.nombre}
                <span className="opacity-55">{u.total}</span>
              </button>
            ))}
            <p className="ml-auto shrink-0 whitespace-nowrap text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
              {plural(visibles.length, 'casa', 'casas')}
            </p>
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="mx-auto max-w-[96rem] px-5 py-24 text-[var(--lpv-fg-2)] sm:px-8">
            No hay casas publicadas en esa zona ahora mismo. Elige otra o pide que te avisemos.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-1 lg:grid-cols-12">
            {visibles.map((casa, i) => {
              const detalle = specsVivienda(casa);
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
                    <p className="lpx-sobre-foto text-[0.8125rem] text-white/80">
                      {ubicacionCorta(casa)}
                      {casa.estadoComercial !== 'disponible' ? ` · ${ESTADO_TEXTO[casa.estadoComercial]}` : ''}
                    </p>
                    <h3 className="lpx-display lpx-sobre-foto mt-1.5 max-w-[30ch] text-[clamp(1.25rem,1rem+1vw,1.875rem)]">
                      {casa.titulo}
                    </h3>
                    {detalle.length > 0 && (
                      <p className="lpx-specs lpx-sobre-foto mt-2 text-[0.875rem] text-white/85">
                        {detalle.join(' · ')}
                        {casa.enganchePct ? ` · enganche ${casa.enganchePct}%` : ''}
                      </p>
                    )}
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
