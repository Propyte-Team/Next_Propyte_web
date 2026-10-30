'use client';

import { useEffect, useState } from 'react';
import type { Ubicacion } from '@/lib/supabase/lp-inventario';

// ============================================================
// Índice fijo de ciudades, solo escritorio.
//
// Una lista vertical en el borde derecho con las ciudades que tienen
// inventario. Pulsar una baja a la primera pantalla de esa ciudad. La ciudad
// activa se sigue con IntersectionObserver sobre las pantallas (atributo
// `data-ciudad`), nunca con un listener de scroll.
// ============================================================

function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function IndiceCiudades({ ciudades }: { ciudades: Ubicacion[] }) {
  const [activa, setActiva] = useState<string | null>(null);

  useEffect(() => {
    const pantallas = Array.from(document.querySelectorAll<HTMLElement>('[data-ciudad]'));
    if (pantallas.length === 0) return;
    const observer = new IntersectionObserver(
      (entradas) => {
        // La pantalla más visible manda; con 100svh cada una, suele ser una.
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiva((visible.target as HTMLElement).dataset.ciudad ?? null);
      },
      { threshold: [0.5] },
    );
    pantallas.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
    // Las pantallas cambian con los filtros: se vuelve a observar cuando
    // cambia la lista de ciudades visibles.
  }, [ciudades]);

  function ir(clave: string) {
    const destino = document.querySelector<HTMLElement>(`[data-ciudad="${clave}"]`);
    destino?.scrollIntoView({ behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth', block: 'start' });
  }

  if (ciudades.length < 2) return null;

  return (
    <nav
      aria-label="Ir a una ciudad"
      className="lpo-indice fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
    >
      {ciudades.map((c) => (
        <button
          key={c.clave}
          type="button"
          onClick={() => ir(c.clave)}
          aria-current={activa === c.clave ? 'true' : undefined}
          className="flex items-center gap-3 text-[0.8125rem]"
        >
          <span>
            {c.nombre}
            <span className="ml-1.5 opacity-60">{c.total}</span>
          </span>
          <span className="lpo-indice-marca" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}
