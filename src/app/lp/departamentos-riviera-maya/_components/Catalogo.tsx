'use client';

import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@/lib/icons';
import type { PropiedadLanding, Ubicacion } from '@/lib/supabase/lp-inventario';
import { dinero, dineroCompacto } from '../../_components/format';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { FORM } from '../_copy';

// ============================================================
// Capitulos por ciudad + formulario en linea.
//
// Un capitulo = la ciudad enorme en serif, una linea con el conteo y el
// «desde», y un riel horizontal de laminas verticales. El pie de cada lamina
// va DEBAJO de la foto, como en una revista: la foto no carga texto encima.
//
// Capitulos y formulario viven en el mismo componente porque comparten el
// estado que es el eje de la pagina: «Me interesa» en una lamina deja ese
// departamento elegido abajo y baja hasta el formulario.
// ============================================================

export interface Capitulo {
  ubicacion: Ubicacion;
  propiedades: PropiedadLanding[];
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
          const specs = specsVivienda(p);
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
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--lpv-fg-2)]">
                  {ubicacionCorta(p)}
                  {p.estadoComercial !== 'disponible' ? ` · ${ESTADO_TEXTO[p.estadoComercial]}` : ''}
                  {specs.length > 0 ? ` · ${specs.join(' · ')}` : ''}
                </p>
                <p className="mt-1 text-[0.8125rem] text-[var(--lpv-fg-2)]">
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
  capitulos,
  todos,
  telefonoWhatsApp,
}: {
  capitulos: Capitulo[];
  todos: PropiedadLanding[];
  telefonoWhatsApp: string;
}) {
  const [elegida, setElegida] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = todos.map((p) => ({ slug: p.slug, titulo: p.titulo }));

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      {capitulos.map((c, i) => (
        <Riel key={c.ubicacion.clave} capitulo={c} elegida={elegida} onElegir={elegir} prioridad={i === 0} />
      ))}

      <section id="solicitar" ref={anclaForm} className="scroll-mt-6 pb-28 sm:pb-0">
        <div className="mx-auto max-w-[34rem] px-5 py-16 sm:px-0 sm:py-24">
          <h2 className="lpd-serif text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] text-[var(--lpv-fg)]">
            Te mandamos la información completa de los {todos.length}.
          </h2>
          <div className="mt-10">
            <FormInventario
              source="lp_deptos_rm"
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
