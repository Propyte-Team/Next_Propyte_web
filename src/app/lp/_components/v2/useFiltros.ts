'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { ANCLA_INVENTARIO } from './ChipsUbicacion';
import { filtrar, type FiltroDef, type IdFiltro, type Seleccion } from './filtros';

// ============================================================
// Estado de filtros compartido entre componentes cliente que no se conocen
// (el formulario del hero, la cuadrícula, los chips del hero). Cada uno
// guarda su propia copia y todas se sincronizan por un evento del DOM, como
// ya hacía `useFiltroUbicacion`. Sin contexto ni store: tres copias de un
// objeto de seis claves no justifican una dependencia.
//
// `elegir()` es idempotente: quien emite también escucha, y recibir el propio
// evento deja el estado igual.
// ============================================================

const EVENTO = 'lpv:filtro';
const EVENTO_UBICACION = 'lpv:ubicacion';

interface DetalleFiltro {
  id: IdFiltro;
  valor: string | null;
  /** Si viene, baja a la cuadrícula (chips del hero). */
  scroll?: boolean;
}

export function emitirFiltro(id: IdFiltro, valor: string | null, scroll = false) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DetalleFiltro>(EVENTO, { detail: { id, valor, scroll } }));
}

/** Solo el estado: para el formulario, que no necesita la lista filtrada. */
export function useSeleccionFiltros() {
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  // Copia síncrona para decidir el «alternar» sin efectos dentro del updater
  // (que en desarrollo corre dos veces).
  const ultima = useRef<Seleccion>({});
  useEffect(() => {
    ultima.current = seleccion;
  }, [seleccion]);

  useEffect(() => {
    function onFiltro(e: Event) {
      const { id, valor, scroll } = (e as CustomEvent<DetalleFiltro>).detail;
      setSeleccion((s) => (s[id] === (valor ?? undefined) ? s : { ...s, [id]: valor ?? undefined }));
      if (scroll) {
        document.getElementById(ANCLA_INVENTARIO)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    function onUbicacion(e: Event) {
      const clave = (e as CustomEvent<string>).detail;
      const valor = clave && clave !== '__todas__' ? clave : null;
      setSeleccion((s) => (s.ubicacion === (valor ?? undefined) ? s : { ...s, ubicacion: valor ?? undefined }));
    }
    window.addEventListener(EVENTO, onFiltro);
    window.addEventListener(EVENTO_UBICACION, onUbicacion);
    return () => {
      window.removeEventListener(EVENTO, onFiltro);
      window.removeEventListener(EVENTO_UBICACION, onUbicacion);
    };
  }, []);

  const elegir = useCallback((id: IdFiltro, valor: string | null, scroll = false) => {
    setSeleccion((s) => ({ ...s, [id]: valor ?? undefined }));
    emitirFiltro(id, valor, scroll);
  }, []);

  /** Alterna: volver a elegir lo activo lo quita. */
  const alternar = useCallback((id: IdFiltro, valor: string, scroll = false) => {
    const siguiente = ultima.current[id] === valor ? null : valor;
    setSeleccion((s) => ({ ...s, [id]: siguiente ?? undefined }));
    emitirFiltro(id, siguiente, scroll);
  }, []);

  const limpiar = useCallback(() => {
    for (const id of Object.keys(ultima.current) as IdFiltro[]) emitirFiltro(id, null);
    setSeleccion({});
  }, []);

  return { seleccion, elegir, alternar, limpiar };
}

/** Estado + lista filtrada: para la cuadrícula. */
export function useFiltros(propiedades: PropiedadLanding[], defs: FiltroDef[]) {
  const estado = useSeleccionFiltros();
  const visibles = useMemo(
    () => filtrar(propiedades, estado.seleccion, defs),
    [propiedades, estado.seleccion, defs],
  );
  const activos = useMemo(
    () => defs.filter((d) => estado.seleccion[d.id]).length,
    [defs, estado.seleccion],
  );
  return { ...estado, visibles, activos, defs };
}
