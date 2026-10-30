'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from '@/lib/icons';

// ============================================================
// Galería de una ficha: carrusel de fotos con scroll-snap nativo.
//
// Lo pidió el brief («agregar fichas de fotos para cada casa», «fichas con
// fotografías en carrusel de cada lote»). Scroll-snap y no una librería: el
// navegador hace el gesto táctil, el teclado y el snap; aquí solo se añaden
// las flechas para el ratón y el contador.
//
// SOLO LA PRIMERA FOTO SE CARGA CON PRIORIDAD NORMAL. Las demás llevan
// `loading="lazy"` y entran cuando el visitante desliza; una cuadrícula de
// diez fichas con 40 fotos cada una no puede pedir 400 imágenes al cargar.
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
}: {
  imagenes: string[];
  alt: string;
  aspecto?: string;
  sizes: string;
  prioridad?: boolean;
  tope?: number;
  className?: string;
  sinFoto?: string;
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

  if (fotos.length === 0) {
    return (
      <div className={`relative ${aspecto} w-full overflow-hidden rounded-[var(--lpv-r)] bg-[var(--lpv-bg-2)] ${className}`}>
        <div className="flex h-full items-center justify-center">
          <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-fg-3)]">{sinFoto}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`group/galeria relative ${aspecto} w-full overflow-hidden rounded-[var(--lpv-r)] bg-[var(--lpv-bg-2)] ${className}`}>
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

      {fotos.length > 1 && (
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
            className="lpv-cifra absolute bottom-2 right-2 rounded-full bg-[rgb(10_10_12/0.6)] px-2 py-1 text-[0.6875rem] text-white"
          >
            {indice + 1} / {fotos.length}
          </span>
        </>
      )}
    </div>
  );
}
