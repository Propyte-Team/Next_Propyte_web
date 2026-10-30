'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Bath, Bed, Calendar, ChevronLeft, ChevronRight, Eye, Home, Key, Maximize, Waves } from '@/lib/icons';
import type { PropiedadLanding, Ubicacion } from '@/lib/supabase/lp-inventario';
import { claveUbicacion, ubicaciones } from '@/lib/supabase/lp-inventario';
import { dinero, dineroCompacto, m2 } from '../../_components/format';
import type { FiltroDef } from '../../_components/v2/filtros';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ANCLA_INVENTARIO } from '../../_components/v2/ChipsUbicacion';
import { useFiltros } from '../../_components/v2/useFiltros';
import { ESTADO_TEXTO, plural, ubicacionCorta } from '../../_components/v2/util';
import { FORM } from '../_copy';

// ============================================================
// Capitulos por ciudad + formulario en linea.
//
// Un capitulo = la ciudad enorme en serif, una linea con el conteo y el
// «desde», y un riel horizontal de laminas verticales. El pie de cada lamina
// va DEBAJO de la foto, como en una revista: la foto no carga texto encima.
//
// FILTROS (30-oct-2026): los capitulos se arman aqui a partir de lo visible.
// La portada, los chips del formulario y esta cuadricula comparten el mismo
// estado por evento (`useFiltros`). Un capitulo sin propiedades no se pinta;
// si no queda nada, un aviso con «quitar filtros» en vez de una pagina vacia.
//
// Capitulos y formulario viven en el mismo componente porque comparten el
// estado que es el eje de la pagina: «Me interesa» en una lamina deja ese
// departamento elegido abajo y baja hasta el formulario.
// ============================================================

export interface Capitulo {
  ubicacion: Ubicacion;
  propiedades: PropiedadLanding[];
}

/**
 * Caracteristicas grandes con icono, como pidio el brief: lo que tiene cada
 * departamento de un vistazo. Solo datos existentes; lo que falta no sale.
 */
function Specs({ p }: { p: PropiedadLanding }) {
  const items: { icono: typeof Bed; valor: string; etiqueta: string; clave: string }[] = [];
  if (p.recamaras) items.push({ clave: 'rec', icono: Bed, valor: String(p.recamaras), etiqueta: p.recamaras === 1 ? 'recámara' : 'recámaras' });
  if (p.banos) items.push({ clave: 'ban', icono: Bath, valor: String(p.banos), etiqueta: p.banos === 1 ? 'baño' : 'baños' });
  if (p.m2Construidos) items.push({ clave: 'm2', icono: Maximize, valor: m2(p.m2Construidos), etiqueta: 'construidos' });
  if (p.vista) items.push({ clave: 'vista', icono: p.frenteAlMar ? Waves : Eye, valor: p.vista, etiqueta: 'vista' });
  if (p.estadoComercial !== 'disponible') {
    items.push({
      clave: 'estado',
      icono: p.estadoComercial === 'preventa' ? Calendar : Key,
      valor: ESTADO_TEXTO[p.estadoComercial],
      etiqueta: 'entrega',
    });
  }
  if (p.entrega) items.push({ clave: 'entrega', icono: Home, valor: p.entrega, etiqueta: 'se entrega' });
  if (items.length === 0) return null;
  return (
    <ul className="lpd-specs mt-4 grid grid-cols-2 gap-x-4 gap-y-3" aria-label="Características">
      {items.map(({ clave, icono: Icono, valor, etiqueta }) => (
        <li key={clave} className="flex items-center gap-2.5">
          <Icono className="h-5 w-5 shrink-0 text-[var(--lpv-accent)]" aria-hidden />
          <span className="min-w-0 leading-none">
            <span className="lpd-serif block truncate text-[1.25rem] text-[var(--lpv-fg)]">{valor}</span>
            <span className="mt-1 block text-[0.6875rem] text-[var(--lpv-fg-2)]">{etiqueta}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Riel({
  capitulo,
  elegida,
  onElegir,
  prioridad,
}: {
  capitulo: Capitulo;
  elegida: string | null;
  onElegir: (slug: string) => void;
  prioridad: boolean;
}) {
  const pista = useRef<HTMLUListElement>(null);
  const { ubicacion, propiedades } = capitulo;
  const desde = propiedades[0]?.precio ?? null;

  const desplazar = useCallback((dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const paso = Math.min(el.clientWidth * 0.8, 3 * 22 * 16);
    el.scrollBy({ left: dir * paso, behavior: 'smooth' });
  }, []);

  return (
    <section id={ubicacion.clave} aria-labelledby={`cap-${ubicacion.clave}`} className="scroll-mt-6 border-t border-[var(--lpv-line)]">
      <div className="mx-auto max-w-[96rem] px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <h2 id={`cap-${ubicacion.clave}`} className="lpd-serif text-[clamp(3rem,1.6rem+6vw,7rem)] text-[var(--lpv-fg)]">
            {ubicacion.nombre}
          </h2>
          <div className="flex items-center gap-5 pb-2 sm:pb-4">
            <p className="text-[0.9375rem] text-[var(--lpv-fg-2)]">
              {plural(propiedades.length, 'departamento', 'departamentos')}
              {desde ? ` · desde ${dineroCompacto(desde)}` : ''}
            </p>
            {propiedades.length > 2 && (
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => desplazar(-1)}
                  aria-label={`Anteriores en ${ubicacion.nombre}`}
                  className="lpd-flecha h-10 w-10 items-center justify-center border border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-fg)]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => desplazar(1)}
                  aria-label={`Siguientes en ${ubicacion.nombre}`}
                  className="lpd-flecha h-10 w-10 items-center justify-center border border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-fg)]"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ul
        ref={pista}
        className="lpd-riel mx-auto mt-8 flex max-w-[96rem] gap-5 overflow-x-auto px-5 pb-14 sm:px-8 sm:pb-20"
        aria-label={`Departamentos en ${ubicacion.nombre}`}
      >
        {propiedades.map((p, i) => {
          const esElegida = elegida === p.slug;
          return (
            <li key={p.id} className="lpd-lamina w-[min(80vw,22rem)] shrink-0">
              <GaleriaFicha
                imagenes={p.imagenes}
                alt={`${p.titulo}, ${ubicacionCorta(p)}`}
                aspecto="aspect-[4/5]"
                sizes="(min-width: 640px) 22rem, 80vw"
                prioridad={prioridad && i < 2}
                tope={6}
                className="!rounded-none"
              />
              <div className="mt-4">
                <p className="lpd-serif text-[1.5rem] text-[var(--lpv-fg)]">
                  {p.precio ? dinero(p.precio) : 'Precio por confirmar'}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[0.9375rem] leading-snug text-[var(--lpv-fg)]">{p.titulo}</p>
                <p className="mt-1 text-[0.8125rem] text-[var(--lpv-fg-2)]">{ubicacionCorta(p)}</p>
                <Specs p={p} />
                <p className="mt-3 text-[0.8125rem] text-[var(--lpv-fg-2)]">
                  {p.enganchePct ? (
                    <>Enganche {p.enganchePct}%</>
                  ) : (
                    <span className="border-b border-dotted border-[var(--lpv-fg-3)] text-[var(--lpv-fg-3)]">
                      Enganche por confirmar
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => onElegir(p.slug)}
                  aria-pressed={esElegida}
                  className="lpd-enlace mt-3 text-[0.9375rem]"
                >
                  {esElegida ? 'Elegido' : 'Me interesa'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Catalogo({
  todos,
  defs,
  telefonoWhatsApp,
}: {
  todos: PropiedadLanding[];
  defs: FiltroDef[];
  telefonoWhatsApp: string;
}) {
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const { visibles, activos, limpiar } = useFiltros(todos, defs);

  // Las opciones del formulario siguen el filtro: lo elegido arriba es lo
  // que se puede marcar abajo. Si la elegida sale del filtro, se suelta.
  const opciones = visibles.map((p) => ({ slug: p.slug, titulo: p.titulo }));
  const elegidaVisible = elegida && visibles.some((p) => p.slug === elegida) ? elegida : null;

  // Capitulos: una ciudad por capitulo, de mas a menos inventario. Dentro de
  // cada uno el orden es el del inventario (precio ascendente).
  const capitulos = useMemo<Capitulo[]>(
    () =>
      ubicaciones(visibles, 'ciudad').map((u) => ({
        ubicacion: u,
        propiedades: visibles.filter((p) => claveUbicacion(p.ciudad) === u.clave),
      })),
    [visibles],
  );

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <div id={ANCLA_INVENTARIO} className="scroll-mt-4">
        {activos > 0 && (
          <div className="mx-auto flex max-w-[96rem] flex-wrap items-baseline justify-between gap-3 px-5 pt-8 sm:px-8">
            <p aria-live="polite" className="text-[0.9375rem] text-[var(--lpv-fg-2)]">
              {visibles.length === 0
                ? 'Ninguno coincide con todo lo que elegiste.'
                : `${plural(visibles.length, 'departamento coincide', 'departamentos coinciden')} con lo que elegiste.`}
            </p>
            <button type="button" onClick={limpiar} className="lpd-enlace text-[0.9375rem]">
              Quitar filtros
            </button>
          </div>
        )}

        {capitulos.map((c, i) => (
          <Riel key={c.ubicacion.clave} capitulo={c} elegida={elegidaVisible} onElegir={elegir} prioridad={i === 0} />
        ))}

        {visibles.length === 0 && (
          <div className="mx-auto max-w-[96rem] border-t border-[var(--lpv-line)] px-5 py-16 sm:px-8 sm:py-24">
            <p className="lpd-serif max-w-[22ch] text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] text-[var(--lpv-fg)]">
              Con ese presupuesto no hay nada publicado en esa ciudad.
            </p>
            <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">
              Quita un filtro, o mándanos el formulario y te decimos qué hay cerca de lo que buscas.
            </p>
          </div>
        )}
      </div>

      <section id="solicitar" ref={anclaForm} className="scroll-mt-6 pb-28 sm:pb-0">
        <div className="mx-auto max-w-[34rem] px-5 py-16 sm:px-0 sm:py-24">
          <h2 className="lpd-serif text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] text-[var(--lpv-fg)]">
            {activos > 0 && visibles.length > 0
              ? `Te mandamos la información completa de ${visibles.length === 1 ? 'ese' : `esos ${visibles.length}`}.`
              : `Te mandamos la información completa de los ${todos.length}.`}
          </h2>
          <div className="mt-10">
            <FormInventario
              source="lp_deptos_rm"
              variante="cierre"
              copy={FORM}
              opciones={opciones}
              seleccion={elegidaVisible}
              onSeleccion={setElegida}
              filtros={defs}
              propiedades={todos}
              telefonoWhatsApp={telefonoWhatsApp}
              className="!p-0"
            />
          </div>
        </div>
      </section>
    </>
  );
}
