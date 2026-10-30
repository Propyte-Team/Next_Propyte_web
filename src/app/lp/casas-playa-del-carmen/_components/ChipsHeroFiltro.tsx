'use client';

import type { OpcionFiltro } from '../../_components/v2/filtros';
import { emitirFiltro } from '../../_components/v2/useFiltros';

// Chips de zona sobre la foto del hero. No filtran aquí: mandan el filtro de
// ubicación al catálogo y al formulario (mismo estado, por evento) y bajan.

export default function ChipsHeroFiltro({ opciones }: { opciones: OpcionFiltro[] }) {
  return (
    <div role="group" aria-label="Ver casas por zona" className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => emitirFiltro('ubicacion', o.valor, true)}
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 border px-3.5 text-[0.8125rem] leading-none transition-colors duration-200 active:translate-y-px"
        >
          {o.etiqueta}
          <span className="lpv-cifra opacity-60">{o.total}</span>
        </button>
      ))}
    </div>
  );
}
