'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropiedadLanding, Ubicacion } from '@/lib/supabase/lp-inventario';
import { ubicacionDe, ubicaciones } from '@/lib/supabase/lp-inventario';

// ============================================================
// Filtro por ubicación: chips en el primer pliegue Y sobre la cuadrícula.
//
// Lo pidió el brief de cambios: «botones de cada lugar más visibles desde la
// primera parte, no tener que bajar para ver en dónde se encuentran, y que
// puedan ser un filtro». El hero y la cuadrícula son componentes distintos
// (el hero es servidor, la cuadrícula es cliente), así que el filtro viaja por
// un evento del DOM en vez de por contexto: `ChipsHero` lo dispara, y
// `useFiltroUbicacion` lo escucha y hace scroll a la cuadrícula.
//
// `todas` existe siempre: un filtro sin salida convierte a un visitante que
// eligió mal en un visitante que se fue.
// ============================================================

const EVENTO = 'lpv:ubicacion';
export const ANCLA_INVENTARIO = 'inventario';

export const TODAS = '__todas__';

export function useFiltroUbicacion(
  propiedades: PropiedadLanding[],
  nivel: 'ciudad' | 'zona' = 'ciudad',
) {
  const [activa, setActiva] = useState<string>(TODAS);
  const lista = useMemo(() => ubicaciones(propiedades, nivel), [propiedades, nivel]);
  const visibles = useMemo(
    () => (activa === TODAS ? propiedades : propiedades.filter((p) => ubicacionDe(p, nivel) === activa)),
    [propiedades, activa, nivel],
  );

  useEffect(() => {
    function onEvento(e: Event) {
      const clave = (e as CustomEvent<string>).detail;
      setActiva(clave || TODAS);
      // `block: 'start'` con `scroll-mt` en la sección: el filtro queda a la
      // vista justo bajo el borde superior, no enterrado bajo la barra móvil.
      document.getElementById(ANCLA_INVENTARIO)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.addEventListener(EVENTO, onEvento);
    return () => window.removeEventListener(EVENTO, onEvento);
  }, []);

  return { activa, setActiva, visibles, ubicaciones: lista };
}

export function emitirUbicacion(clave: string) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: clave }));
}

function claseChip(activo: boolean, tono: 'claro' | 'oscuro') {
  const base =
    'inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-[var(--lpv-r-control)] border px-3.5 text-[0.8125rem] leading-none transition-colors duration-200 active:translate-y-px';
  if (tono === 'oscuro') {
    return `${base} ${
      activo
        ? 'border-[var(--lpv-panel-fg)] bg-[var(--lpv-panel-fg)] text-[var(--lpv-panel-bg)]'
        : 'border-[var(--lpv-panel-line)] text-[var(--lpv-panel-fg)] hover:border-[var(--lpv-panel-fg-2)]'
    }`;
  }
  return `${base} ${
    activo
      ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
      : 'border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-fg)]'
  }`;
}

/**
 * Chips controlados. `conteo` imprime cuántas hay en cada ubicación: es el
 * único dato de «escasez» que se publica, y es verificable.
 */
export function ChipsUbicacion({
  ubicaciones: lista,
  activa,
  onChange,
  etiquetaTodas = 'Todas',
  tono = 'claro',
  conteo = true,
  ariaLabel = 'Filtrar por ubicación',
}: {
  ubicaciones: Ubicacion[];
  activa: string;
  onChange: (clave: string) => void;
  etiquetaTodas?: string;
  tono?: 'claro' | 'oscuro';
  conteo?: boolean;
  ariaLabel?: string;
}) {
  const total = lista.reduce((s, u) => s + u.total, 0);
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={activa === TODAS}
        onClick={() => onChange(TODAS)}
        className={claseChip(activa === TODAS, tono)}
      >
        {etiquetaTodas}
        {conteo && <span className="lpv-cifra opacity-60">{total}</span>}
      </button>
      {lista.map((u) => (
        <button
          key={u.clave}
          type="button"
          aria-pressed={activa === u.clave}
          onClick={() => onChange(u.clave)}
          className={claseChip(activa === u.clave, tono)}
        >
          {u.nombre}
          {conteo && <span className="lpv-cifra opacity-60">{u.total}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Chips del hero: no filtran aquí, mandan el filtro a la cuadrícula y bajan.
 * Son botones y no anclas porque el destino es un estado, no solo un sitio.
 */
export function ChipsHero({
  ubicaciones: lista,
  tono = 'oscuro',
  conteo = true,
  etiquetaTodas,
}: {
  ubicaciones: Ubicacion[];
  tono?: 'claro' | 'oscuro';
  conteo?: boolean;
  /** Si viene, se añade un chip «todas» al frente. */
  etiquetaTodas?: string;
}) {
  const ir = useCallback((clave: string) => emitirUbicacion(clave), []);
  return (
    <div role="group" aria-label="Ver inventario por ubicación" className="flex flex-wrap gap-2">
      {etiquetaTodas && (
        <button type="button" onClick={() => ir(TODAS)} className={claseChip(false, tono)}>
          {etiquetaTodas}
          {conteo && (
            <span className="lpv-cifra opacity-60">{lista.reduce((s, u) => s + u.total, 0)}</span>
          )}
        </button>
      )}
      {lista.map((u) => (
        <button key={u.clave} type="button" onClick={() => ir(u.clave)} className={claseChip(false, tono)}>
          {u.nombre}
          {conteo && <span className="lpv-cifra opacity-60">{u.total}</span>}
        </button>
      ))}
    </div>
  );
}
