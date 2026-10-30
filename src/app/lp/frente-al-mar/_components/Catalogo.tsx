'use client';

import { useCallback, useRef, useState } from 'react';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { ubicacionDe } from '@/lib/supabase/lp-inventario';
import { dinero } from '../../_components/format';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { FORM, VISTA_TEXTO } from '../_copy';

// ============================================================
// Las propiedades, una por pantalla, y el formulario como última pantalla.
//
// Cada `section` mide una pantalla completa y es un punto de snap. La
// galería de la propiedad llena la pantalla; el dato va encima, abajo a la
// izquierda, y la única zona clicable es la píldora «Me interesa», para que
// las flechas de la galería sigan recibiendo el clic.
//
// Pulsar la píldora deja la propiedad elegida en el formulario y baja hasta
// él. Es el mismo contrato que en la landing de casas: informar y convertir,
// no navegar.
// ============================================================

function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Catalogo({
  propiedades,
  telefonoWhatsApp,
}: {
  propiedades: PropiedadLanding[];
  telefonoWhatsApp: string;
}) {
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLElement>(null);
  const opciones = propiedades.map((p) => ({ slug: p.slug, titulo: p.titulo }));
  const total = propiedades.length;

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({
      behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  // `data-ciudad` solo en la PRIMERA pantalla de cada ciudad: es el destino
  // del índice y lo que el observador usa para marcar la ciudad activa.
  const vistas = new Set<string>();

  return (
    <>
      {propiedades.map((p, i) => {
        const ciudad = ubicacionDe(p, 'ciudad');
        const esPrimeraDeCiudad = !vistas.has(ciudad);
        vistas.add(ciudad);
        const detalle = specsVivienda(p);
        const esElegida = elegida === p.slug;
        const vista = p.vista ? (VISTA_TEXTO[p.vista] ?? p.vista) : null;

        return (
          <section
            key={p.id}
            data-ciudad={ciudad}
            data-pantalla-ciudad={esPrimeraDeCiudad ? 'si' : undefined}
            aria-label={p.titulo}
            className="lpo-pantalla relative min-h-[100svh] overflow-hidden bg-[var(--lpv-bg-2)]"
          >
            <GaleriaFicha
              imagenes={p.imagenes}
              alt={`${p.titulo}, ${ubicacionCorta(p)}`}
              aspecto="h-[100svh]"
              sizes="100vw"
              prioridad={i < 1}
              tope={6}
              className="!rounded-none"
            />
            <div className="lpo-velo pointer-events-none absolute inset-0" aria-hidden="true" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 pb-24 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8 sm:pb-10 lg:pr-48">
              <div className="min-w-0">
                <p className="lpo-sobre-foto text-[0.9375rem] text-white/80">
                  {ubicacionCorta(p)}
                  {vista ? ` · ${vista}` : ''}
                  {p.estadoComercial !== 'disponible' ? ` · ${ESTADO_TEXTO[p.estadoComercial]}` : ''}
                </p>
                <h2 className="lpo-display lpo-sobre-foto mt-2 max-w-[20ch] text-[clamp(1.75rem,1.2rem+2.4vw,3.5rem)]">
                  {p.titulo}
                </h2>
                <p className="lpo-display lpo-sobre-foto mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,3rem)] text-[var(--lpv-accent)]">
                  {p.precio ? dinero(p.precio) : 'Precio por confirmar'}
                </p>
                {detalle.length > 0 && (
                  <p className="lpo-sobre-foto mt-2 text-[0.9375rem] text-white/85">{detalle.join(' · ')}</p>
                )}
                <p className="lpo-sobre-foto mt-1 text-[0.9375rem] text-white/70">
                  {p.enganchePct ? `Enganche ${p.enganchePct}%` : 'Enganche por confirmar con el desarrollador'}
                </p>
              </div>

              {/* Única zona clicable del texto. */}
              <button
                type="button"
                onClick={() => elegir(p.slug)}
                aria-pressed={esElegida}
                className={`pointer-events-auto inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full px-6 text-[0.9375rem] font-medium transition-opacity hover:opacity-90 active:translate-y-px ${
                  esElegida
                    ? 'bg-white text-[var(--lpv-bg)]'
                    : 'bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
                }`}
              >
                {esElegida ? 'Elegida' : 'Me interesa'}
              </button>
            </div>
          </section>
        );
      })}

      {/* ══ ÚLTIMA PANTALLA: el formulario, directo sobre el fondo ══ */}
      <section
        id="solicitar"
        ref={anclaForm}
        className="lpo-pantalla relative min-h-[100svh] scroll-mt-0 bg-[var(--lpv-bg)] text-[var(--lpv-fg)]"
      >
        <div className="mx-auto grid min-h-[100svh] max-w-[96rem] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-16 lg:pr-48">
          <div className="lg:col-span-5">
            <h2 className="lpo-display text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
              Te mandamos la información completa de {total === 1 ? 'la propiedad' : `las ${total}`}.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
              Precio cerrado en su moneda de venta, enganche y esquema de cada desarrollador, qué
              incluye la entrega y cuáles siguen disponibles hoy.
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <FormInventario
              source="lp_frente_mar"
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
      </section>
    </>
  );
}
