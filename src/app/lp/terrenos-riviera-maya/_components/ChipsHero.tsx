'use client';

import type { FiltroDef } from '../../_components/v2/filtros';
import { useSeleccionFiltros } from '../../_components/v2/useFiltros';

// ============================================================
// Chips del hero: ciudad y plazo desde el primer pliegue (brief 30-oct-2026:
// «que el visitante elija cómo quiere pagar antes de bajar»).
//
// No filtran aquí: mandan el filtro al catálogo por el evento compartido y
// bajan hasta él. Comparten estado con la barra pegajosa y el formulario, así
// que un chip elegido arriba aparece elegido abajo.
// ============================================================

export default function ChipsHero({ defs }: { defs: FiltroDef[] }) {
  const { seleccion, alternar } = useSeleccionFiltros();
  return (
    <div className="flex flex-col gap-4">
      {defs.map((def) => (
        <div key={def.id} role="group" aria-label={def.etiqueta} className="flex items-baseline gap-5">
          <span className="w-[5.5ch] shrink-0 text-[0.8125rem] text-[var(--lpv-fg-3)]">{def.etiqueta}</span>
          <div className="lpt2-fila-chips -mx-5 flex gap-6 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            {def.opciones.map((o) => (
              <button
                key={o.valor}
                type="button"
                aria-pressed={seleccion[def.id] === o.valor}
                onClick={() => alternar(def.id, o.valor, true)}
                className="lpt2-chip"
              >
                {o.etiqueta} <span className="opacity-55">{o.total}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
