'use client';

import { useId, useState, type ReactNode } from 'react';

// ============================================================
// Pasos como lista numerada dinámica (ejemplo del brief del 30-oct-2026):
// el paso activo se abre con su descripción; los demás se quedan en una
// línea con su número. Clic o foco cambian el activo. Sustituye a las tres
// filas estáticas de «Prueba de que existimos».
//
// El número usa el acento de la landing; el resto hereda los tokens `--lp-*`
// porque vive en la landing de lotes.
// ============================================================

export interface Paso {
  titulo: string;
  cuerpo: ReactNode;
}

export default function PasosDinamicos({ pasos }: { pasos: Paso[] }) {
  const [activo, setActivo] = useState(0);
  const uid = useId();

  return (
    <ol className="flex flex-col gap-2">
      {pasos.map((paso, i) => {
        const abierto = i === activo;
        return (
          <li key={paso.titulo}>
            <button
              type="button"
              aria-expanded={abierto}
              aria-controls={`${uid}-${i}`}
              onClick={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              className={`grid w-full grid-cols-[3rem_1fr] items-baseline gap-3 rounded-[var(--lp-r-media)] border px-5 py-4 text-left transition-colors duration-200 ${
                abierto
                  ? 'border-[var(--lp-accent)] bg-white'
                  : 'border-[var(--lp-line-soft)] bg-[var(--lp-paper-2)] hover:border-[var(--lp-line)]'
              }`}
            >
              <span className={`lp-display lp-num text-[1.5rem] italic leading-none ${abierto ? 'text-[var(--lp-accent)]' : 'text-[var(--lp-muted)]'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-base font-medium leading-snug text-[var(--lp-ink)]">{paso.titulo}</span>
              <span
                id={`${uid}-${i}`}
                className={`col-start-2 overflow-hidden text-sm leading-relaxed text-[var(--lp-ink-soft)] transition-[max-height,opacity,margin] duration-300 ease-out motion-reduce:transition-none ${
                  abierto ? 'mt-2 max-h-[20rem] opacity-100' : 'mt-0 max-h-0 opacity-0'
                }`}
              >
                {paso.cuerpo}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
