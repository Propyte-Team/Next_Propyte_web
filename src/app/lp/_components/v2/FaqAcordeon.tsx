import { ChevronDown } from '@/lib/icons';

// ============================================================
// Preguntas frecuentes en acordeón nativo.
//
// `<details>/<summary>`: cero JavaScript, accesible por teclado, y el estado
// abierto/cerrado lo guarda el navegador. Lo pidió el brief («botón con
// flechitas para desplegar respuestas»). El chevron gira con CSS desde
// `tokens.css`.
//
// Las preguntas vienen de `faqs.ts`: son las de «compra» y «financiamiento»
// del sitio, no inventadas para la landing.
// ============================================================

export interface Faq {
  q: string;
  a: string;
}

export default function FaqAcordeon({
  faqs,
  titulo = 'Preguntas frecuentes',
  className = '',
}: {
  faqs: Faq[];
  titulo?: string;
  className?: string;
}) {
  return (
    <section aria-labelledby="faq-titulo" className={className}>
      <h2
        id="faq-titulo"
        className="lpv-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--lpv-fg)]"
      >
        {titulo}
      </h2>
      <div className="mt-6 divide-y divide-[var(--lpv-line)] border-y border-[var(--lpv-line)]">
        {faqs.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex min-h-[56px] items-center justify-between gap-6 py-4 text-left text-[1.0625rem] font-medium leading-snug text-[var(--lpv-fg)]">
              {f.q}
              <ChevronDown className="lpv-chevron h-5 w-5 shrink-0 text-[var(--lpv-fg-3)]" aria-hidden />
            </summary>
            <p className="max-w-[64ch] pb-5 text-[0.9375rem] leading-relaxed text-[var(--lpv-fg-2)]">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
