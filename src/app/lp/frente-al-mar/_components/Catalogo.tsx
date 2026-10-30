'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { ubicacionDe, ubicaciones } from '@/lib/supabase/lp-inventario';
import { Bath, Bed, Eye, KeySquare, Maximize } from '@/lib/icons';
import { dinero, m2 } from '../../_components/format';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import type { FiltroDef } from '../../_components/v2/filtros';
import { useFiltros } from '../../_components/v2/useFiltros';
import { ESTADO_TEXTO, ubicacionCorta } from '../../_components/v2/util';
import IndiceCiudades from './IndiceCiudades';
import { FORM, VISTA_TEXTO } from '../_copy';

// ============================================================
// Las propiedades, una por pantalla, y el formulario como última pantalla.
//
// Cada `section` mide una pantalla completa y es un punto de snap. La
// galería de la propiedad llena la pantalla; el dato va encima, abajo a la
// izquierda, y la única zona clicable es la píldora «Me interesa», para que
// las flechas de la galería sigan recibiendo el clic.
//
// LOS FILTROS MANDAN SOBRE LAS PANTALLAS (30-oct-2026). El mismo estado que
// mueve los chips del formulario y de la portada decide qué pantallas
// existen. Si lo elegido no deja ninguna, hay una pantalla que lo dice y
// ofrece quitar los filtros: un filtro sin salida es un visitante que se fue.
//
// LAS CARACTERÍSTICAS VAN EN GRANDE, CON ICONO. Recámaras, baños, metros,
// vista y entrega, cada una como una cifra grande sobre la foto. Solo lo que
// el Hub declara: lo que falta no se pinta, no se estima.
//
// Pulsar la píldora deja la propiedad elegida en el formulario y baja hasta
// él. Es el mismo contrato que en la landing de casas: informar y convertir,
// no navegar.
// ============================================================

function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Caracteristica {
  icono: typeof Bed;
  valor: string;
  etiqueta: string;
}

/** Las cifras grandes de una pantalla. Gate por dato: null no se pinta. */
function caracteristicas(p: PropiedadLanding): Caracteristica[] {
  const lista: Caracteristica[] = [];
  if (p.recamaras) {
    lista.push({ icono: Bed, valor: String(p.recamaras), etiqueta: p.recamaras === 1 ? 'recámara' : 'recámaras' });
  }
  if (p.banos) {
    lista.push({ icono: Bath, valor: String(p.banos), etiqueta: p.banos === 1 ? 'baño' : 'baños' });
  }
  if (p.m2Construidos) {
    lista.push({ icono: Maximize, valor: m2(p.m2Construidos), etiqueta: 'construidos' });
  }
  if (p.vista) {
    lista.push({ icono: Eye, valor: VISTA_TEXTO[p.vista] ?? p.vista, etiqueta: 'vista declarada' });
  }
  if (p.estadoComercial === 'entrega_inmediata') {
    lista.push({ icono: KeySquare, valor: 'Inmediata', etiqueta: p.entrega ? p.entrega.toLowerCase() : 'entrega' });
  } else if (p.entrega) {
    lista.push({ icono: KeySquare, valor: p.entrega, etiqueta: ESTADO_TEXTO[p.estadoComercial].toLowerCase() });
  } else if (p.estadoComercial === 'preventa') {
    lista.push({ icono: KeySquare, valor: 'Preventa', etiqueta: 'entrega' });
  }
  return lista;
}

export default function Catalogo({
  propiedades,
  filtros,
  telefonoWhatsApp,
}: {
  propiedades: PropiedadLanding[];
  filtros: FiltroDef[];
  telefonoWhatsApp: string;
}) {
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLElement>(null);
  const { visibles, activos, limpiar } = useFiltros(propiedades, filtros);
  const opciones = propiedades.map((p) => ({ slug: p.slug, titulo: p.titulo }));
  const total = propiedades.length;
  const ciudadesVisibles = useMemo(() => ubicaciones(visibles, 'ciudad'), [visibles]);

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
      {visibles.length === 0 && (
        <section
          id="inventario"
          aria-label="Sin coincidencias"
          className="lpo-pantalla relative flex min-h-[100svh] items-center bg-[var(--lpv-bg-2)]"
        >
          <div className="mx-auto w-full max-w-[96rem] px-5 py-20 sm:px-8 lg:pr-48">
            <h2 className="lpo-display max-w-[16ch] text-[clamp(2rem,1.3rem+3vw,4rem)]">
              Ninguna de las {total} cumple todo lo que elegiste.
            </h2>
            <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
              Quita un filtro para ver qué hay cerca, o pide la información y te decimos qué se acerca a lo
              que buscas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex min-h-[48px] items-center rounded-full bg-[var(--lpv-accent)] px-6 text-[0.9375rem] font-medium text-[var(--lpv-on-accent)] hover:opacity-90 active:translate-y-px"
              >
                Quitar los filtros
              </button>
              <button
                type="button"
                onClick={() =>
                  anclaForm.current?.scrollIntoView({
                    behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
                    block: 'start',
                  })
                }
                className="inline-flex min-h-[48px] items-center rounded-full border border-[var(--lpv-line-2)] px-6 text-[0.9375rem] hover:border-[var(--lpv-fg)] active:translate-y-px"
              >
                Pedir la información
              </button>
            </div>
          </div>
        </section>
      )}

      {visibles.map((p, i) => {
        const ciudad = ubicacionDe(p, 'ciudad');
        const esPrimeraDeCiudad = !vistas.has(ciudad);
        vistas.add(ciudad);
        const esElegida = elegida === p.slug;
        const cifras = caracteristicas(p);

        return (
          <section
            key={p.id}
            id={i === 0 ? 'inventario' : undefined}
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

            {/* Contador de pantalla: «3 de 9», arriba a la derecha. */}
            <p className="lpv-cifra lpo-sobre-foto pointer-events-none absolute right-5 top-4 text-[0.8125rem] text-white/75 sm:right-8 lg:right-48">
              {i + 1} de {visibles.length}
              {activos > 0 ? ` que coinciden` : ''}
            </p>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-6 p-5 pb-24 text-white sm:p-8 sm:pb-10 lg:pr-48">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="lpo-sobre-foto text-[0.9375rem] text-white/80">{ubicacionCorta(p)}</p>
                  <h2 className="lpo-display lpo-sobre-foto mt-2 max-w-[20ch] text-[clamp(1.625rem,1.1rem+2.2vw,3.25rem)]">
                    {p.titulo}
                  </h2>
                  <p className="lpo-display lpo-sobre-foto mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,3rem)] text-[var(--lpv-accent)]">
                    {p.precio ? dinero(p.precio) : 'Precio por confirmar'}
                  </p>
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

              {/* Las características, en grande y con icono. */}
              {cifras.length > 0 && (
                <ul className="lpo-cifras grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/20 pt-5 sm:flex sm:flex-wrap sm:gap-x-10">
                  {cifras.map((c) => (
                    <li key={c.etiqueta + c.valor} className="flex items-center gap-3">
                      <c.icono className="h-7 w-7 shrink-0 text-[var(--lpv-accent)] sm:h-8 sm:w-8" strokeWidth={1.5} aria-hidden />
                      <span className="min-w-0">
                        <span className="lpo-display lpo-sobre-foto block text-[clamp(1.375rem,1rem+1.4vw,2.125rem)] leading-none">
                          {c.valor}
                        </span>
                        <span className="lpo-sobre-foto mt-1 block text-[0.8125rem] text-white/75">{c.etiqueta}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      {/* Índice fijo de ciudades, solo escritorio. Sigue a las visibles. */}
      <IndiceCiudades ciudades={ciudadesVisibles} />

      {/* ══ ÚLTIMA PANTALLA: el formulario, directo sobre el fondo ══ */}
      <section
        id="solicitar"
        ref={anclaForm}
        className="lpo-pantalla relative min-h-[100svh] scroll-mt-0 bg-[var(--lpv-bg)] text-[var(--lpv-fg)]"
      >
        <div className="mx-auto grid min-h-[100svh] max-w-[96rem] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-16 lg:pr-48">
          <div className="lg:col-span-5">
            <h2 className="lpo-display text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
              Dinos qué buscas y te mandamos solo lo que encaja.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[1.0625rem] leading-relaxed text-[var(--lpv-fg-2)]">
              Ciudad, presupuesto y recámaras. Recibes precio cerrado en su moneda de venta, enganche y
              esquema de cada desarrollador, qué incluye la entrega y cuáles siguen disponibles hoy.
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
              filtros={filtros}
              propiedades={propiedades}
              telefonoWhatsApp={telefonoWhatsApp}
              className="!p-0"
            />
          </div>
        </div>
      </section>
    </>
  );
}
