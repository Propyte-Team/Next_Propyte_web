'use client';

import { ArrowRight } from '@/lib/icons';
import { emitirUbicacion } from '../../_components/v2/ChipsUbicacion';
import { plural } from '../../_components/v2/util';

// ============================================================
// Mapa de costa sin mapa: una columna por ciudad con inventario, con sus
// zonas. Cada columna es un botón que manda el filtro a la cuadrícula y baja
// hasta ella, así que el bloque informa y filtra a la vez.
// ============================================================

export interface TramoCosta {
  clave: string;
  ciudad: string;
  estado: string;
  total: number;
  zonas: string[];
}

export default function Costa({ tramos }: { tramos: TramoCosta[] }) {
  return (
    <ul className="grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-[var(--lpv-line)]">
      {tramos.map((t) => (
        <li key={t.clave} className="md:px-8 md:first:pl-0 md:last:pr-0">
          <button
            type="button"
            onClick={() => emitirUbicacion(t.clave)}
            className="lpo-costa group block w-full text-left text-[var(--lpv-fg)] hover:text-[var(--lpv-accent)] active:translate-y-px"
          >
            <span className="block text-[0.8125rem] text-[var(--lpv-fg-3)]">{t.estado}</span>
            <span className="lpv-display lpo-titular mt-1 block text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] leading-[1.02]">
              {t.ciudad}
            </span>
            <span className="lpv-cifra mt-3 block text-sm text-[var(--lpv-fg-2)]">
              {plural(t.total, 'propiedad', 'propiedades')}
              {t.zonas.length > 0 ? `, en ${t.zonas.join(', ')}` : ''}
            </span>
            <span className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--lpv-fg-2)] group-hover:text-[var(--lpv-accent)]">
              Ver inventario
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
