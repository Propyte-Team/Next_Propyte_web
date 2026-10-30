'use client';

import { ArrowDown } from '@/lib/icons';
import type { FiltroDef } from '../../_components/v2/filtros';
import { emitirFiltro, useSeleccionFiltros } from '../../_components/v2/useFiltros';

// ============================================================
// Acceso temprano al filtro desde la portada: las ciudades con inventario
// como chips y un botón que baja a la primera pantalla. Pulsar una ciudad
// filtra las pantallas (el Catálogo escucha el mismo evento) y baja.
//
// Es el gancho de retención que pidió el brief del 30-oct-2026: quien llega
// elige dónde antes de ver nada, y lo que ve después ya es suyo.
// ============================================================

function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ChipsPortada({
  ubicacion,
  total,
  etiquetaTodas,
}: {
  ubicacion: FiltroDef | null;
  total: number;
  /** Texto del botón que baja sin filtrar, p. ej. «Ver las 9». */
  etiquetaTodas: string;
}) {
  const { seleccion } = useSeleccionFiltros();

  function bajar() {
    document
      .getElementById('inventario')
      ?.scrollIntoView({ behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth', block: 'start' });
  }

  const chip =
    'inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.9375rem] leading-none transition-colors duration-200 active:translate-y-px';

  return (
    <div role="group" aria-label="Elegir ciudad" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          emitirFiltro('ubicacion', null);
          bajar();
        }}
        className={`${chip} border-[var(--lpv-accent)] bg-[var(--lpv-accent)] font-medium text-[var(--lpv-on-accent)] hover:opacity-90`}
      >
        {etiquetaTodas}
        <ArrowDown className="h-4 w-4" aria-hidden />
      </button>
      {ubicacion?.opciones.map((o) => {
        const activo = seleccion.ubicacion === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => emitirFiltro('ubicacion', o.valor, true)}
            className={`${chip} ${
              activo
                ? 'border-white bg-white text-[var(--lpv-bg)]'
                : 'border-white/45 bg-[rgb(11_22_32/0.35)] text-white backdrop-blur-sm hover:border-white'
            }`}
          >
            {o.etiqueta}
            <span className="lpv-cifra opacity-60">{o.total}</span>
          </button>
        );
      })}
    </div>
  );
}
