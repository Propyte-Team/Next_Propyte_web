'use client';

import { useState } from 'react';
import { ChevronDown } from '@/lib/icons';
import type { Faq } from './FaqAcordeon';

// ============================================================
// Preguntas frecuentes con categorías, como la página /es/faq del sitio
// (ejemplo del brief del 30-oct-2026): chips «Todas · Compra ·
// Financiamiento» y filas en acordeón con chevron.
//
// Los textos vienen de `faqs.ts`; aquí solo se agrupan. El acordeón es
// `<details>` nativo; el estado de la categoría es lo único que vive en
// React.
// ============================================================

export interface CategoriaFaq {
  nombre: string;
  faqs: Faq[];
}

export default function FaqCategorias({
  categorias,
  titulo = 'Preguntas frecuentes',
  tono = 'claro',
  className = '',
}: {
  categorias: CategoriaFaq[];
  titulo?: string;
  tono?: 'claro' | 'oscuro';
  className?: string;
}) {
  const [activa, setActiva] = useState<string>('__todas__');
  const visibles =
    activa === '__todas__'
      ? categorias.flatMap((c) => c.faqs)
      : (categorias.find((c) => c.nombre === activa)?.faqs ?? []);

  const oscuro = tono === 'oscuro';
  const fg = oscuro ? 'text-[var(--lpv-panel-fg)]' : 'text-[var(--lpv-fg)]';
  const fg2 = oscuro ? 'text-[var(--lpv-panel-fg-2)]' : 'text-[var(--lpv-fg-2)]';
  const fg3 = oscuro ? 'text-[var(--lpv-panel-fg-3)]' : 'text-[var(--lpv-fg-3)]';
  const linea = oscuro ? 'border-[var(--lpv-panel-line)] divide-[var(--lpv-panel-line)]' : 'border-[var(--lpv-line)] divide-[var(--lpv-line)]';

  const chip = (activo: boolean) =>
    `inline-flex min-h-[36px] cursor-pointer items-center rounded-full px-4 text-[0.8125rem] transition-colors duration-200 ${
      activo
        ? oscuro
          ? 'bg-[var(--lpv-panel-fg)] text-[var(--lpv-panel-bg)]'
          : 'bg-[var(--lpv-fg)] text-[var(--lpv-bg)]'
        : oscuro
          ? 'bg-[rgb(255_255_255/0.08)] text-[var(--lpv-panel-fg-2)] hover:bg-[rgb(255_255_255/0.14)]'
          : 'bg-[var(--lpv-bg-2)] text-[var(--lpv-fg-2)] hover:bg-[var(--lpv-line)]'
    }`;

  return (
    <section aria-labelledby="faq-titulo" className={className}>
      {titulo && (
        <h2 id="faq-titulo" className={`lpv-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] ${fg}`}>
          {titulo}
        </h2>
      )}
      <div role="group" aria-label="Categoría de preguntas" className="mt-6 flex flex-wrap gap-2">
        <button type="button" aria-pressed={activa === '__todas__'} onClick={() => setActiva('__todas__')} className={chip(activa === '__todas__')}>
          Todas
        </button>
        {categorias.map((c) => (
          <button key={c.nombre} type="button" aria-pressed={activa === c.nombre} onClick={() => setActiva(c.nombre)} className={chip(activa === c.nombre)}>
            {c.nombre}
          </button>
        ))}
      </div>
      <div className={`mt-6 divide-y border-y ${linea}`}>
        {visibles.map((f) => (
          <details key={f.q} className="group">
            <summary className={`flex min-h-[56px] items-center justify-between gap-6 py-4 text-left text-[1.0625rem] font-medium leading-snug ${fg}`}>
              {f.q}
              <ChevronDown className={`lpv-chevron h-5 w-5 shrink-0 ${fg3}`} aria-hidden />
            </summary>
            <p className={`max-w-[64ch] pb-5 text-[0.9375rem] leading-relaxed ${fg2}`}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
