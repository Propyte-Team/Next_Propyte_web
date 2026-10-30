'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from '@/lib/icons';

// ============================================================
// Galería de una ficha: carrusel de fotos con scroll-snap nativo.
//
// Lo pidió el brief («agregar fichas de fotos para cada casa», «fichas con
// fotografías en carrusel de cada lote»). Scroll-snap y no una librería: el
// navegador hace el gesto táctil, el teclado y el snap; aquí solo se añaden
// las flechas para el ratón y el contador.
//
// DOS DISPOSICIONES DE CONTROLES:
//   · `encima`  (por defecto): flechas redondas sobre la foto y contador en
//     la esquina. Para fichas donde la foto es toda la tarjeta.
//   · `abajo`: una fila bajo la foto con el pie opcional a la izquierda y
//     flechas + contador «01 / 06» a la derecha, como el ejemplo del brief
//     del 30-oct-2026. Para fichas con texto debajo de la imagen.
//
// SOLO LA PRIMERA FOTO SE CARGA CON PRIORIDAD NORMAL. Las demás llevan
// `loading="lazy"` y entran cuando el visitante desliza.
//
// `tope` recorta la galería: el Hub tiene unidades con 366 fotos y nadie va a
// deslizar 366 veces en una tarjeta.
// ============================================================

export default function GaleriaFicha({
  imagenes,
  alt,
  aspecto = 'aspect-[4/3]',
  sizes,
  prioridad = false,
  tope = 12,
  className = '',
  sinFoto = 'Sin fotografía',
  controles = 'encima',
  pie,
}: {
  imagenes: string[];
  alt: string;
  aspecto?: string;
  sizes: string;
  prioridad?: boolean;
  tope?: number;
  className?: string;
  sinFoto?: string;
  controles?: 'encima' | 'abajo';
  /** Texto a la izquierda de la fila de controles (solo `abajo`). */
  pie?: string;
}) {
  const fotos = imagenes.slice(0, tope);
  const pista = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  // El índice sigue al scroll real (gesto táctil incluido), no al clic.
  useEffect(() => {
    const el = pista.current;
    if (!el || fotos.length < 2) return;
    let marco = 0;
    function onScroll() {
      cancelAnimationFrame(marco);
      marco = requestAnimationFrame(() => {
        if (!el) return;
        setIndice(Math.round(el.scrollLeft / el.clientWidth));
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(marco);
    };
  }, [fotos.length]);

  const ir = useCallback(
    (delta: number) => {
      const el = pista.current;
      if (!el) return;
      const destino = Math.max(0, Math.min(fotos.length - 1, indice + delta));
      el.scrollTo({ left: destino * el.clientWidth, behavior: 'smooth' });
    },
    [fotos.length, indice],
  );

  const dosDigitos = (n: number) => String(n).padStart(2, '0');

  if (fotos.length === 0) {
    return (
      <div className={`relative ${aspecto} w-full overflow-hidden rounded-[var(--lpv-r)] bg-[var(--lpv-bg-2)] ${className}`}>
        <div className="flex h-full items-center justify-center">
          <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-fg-3)]">{sinFoto}</span>
        </div>
      </div>
    );
  }

  const caja = (
    <div className={`group/galeria relative ${aspecto} w-full overflow-hidden rounded-[var(--lpv-r)] bg-[var(--lpv-bg-2)] ${controles === 'abajo' ? '' : className}`}>
      <div
        ref={pista}
        className="lpv-galeria flex h-full w-full overflow-x-auto"
        aria-roledescription="carrusel"
        aria-label={alt}
      >
        {fotos.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt}, foto ${i + 1}`}
              fill
              sizes={sizes}
              priority={prioridad && i === 0}
              loading={i === 0 && prioridad ? undefined : 'lazy'}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {controles === 'encima' && fotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(-1)}
            disabled={indice === 0}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(10_10_12/0.55)] text-white opacity-0 transition-opacity duration-200 hover:bg-[rgb(10_10_12/0.8)] focus-visible:opacity-100 disabled:opacity-0 group-hover/galeria:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => ir(1)}
            disabled={indice >= fotos.length - 1}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(10_10_12/0.55)] text-white opacity-0 transition-opacity duration-200 hover:bg-[rgb(10_10_12/0.8)] focus-visible:opacity-100 disabled:opacity-0 group-hover/galeria:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <span
            aria-live="polite"
            className="lpv-cifra lpv-galeria-contador absolute bottom-2 right-2 rounded-full bg-[rgb(10_10_12/0.6)] px-2 py-1 text-[0.6875rem] text-white"
          >
            {indice + 1} / {fotos.length}
          </span>
        </>
      )}
    </div>
  );

  if (controles !== 'abajo') return caja;

  return (
    <div className={className}>
      {caja}
      <div className="lpv-galeria-pie mt-3 flex items-center justify-between gap-4">
        <span className="min-w-0 truncate text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-fg-3)]">
          {pie ?? ''}
        </span>
        {fotos.length > 1 && (
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => ir(-1)}
              disabled={indice === 0}
              aria-label="Foto anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lpv-line-2)] text-[var(--lpv-fg)] transition-colors hover:bg-[var(--lpv-fg)] hover:text-[var(--lpv-bg)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--lpv-fg)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span aria-live="polite" className="lpv-cifra text-[0.75rem] tracking-[0.08em] text-[var(--lpv-fg)]">
              {dosDigitos(indice + 1)}
              <span className="text-[var(--lpv-fg-3)]"> / {dosDigitos(fotos.length)}</span>
            </span>
            <button
              type="button"
              onClick={() => ir(1)}
              disabled={indice >= fotos.length - 1}
              aria-label="Foto siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lpv-line-2)] text-[var(--lpv-fg)] transition-colors hover:bg-[var(--lpv-fg)] hover:text-[var(--lpv-bg)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--lpv-fg)]"
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
