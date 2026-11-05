'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import PropertyCard from '@/components/ui/PropertyCard';
import type { Property } from '@/types/property';
import {
  nearestSheetState,
  nextSheetState,
  sheetSnapHeights,
  type SheetState,
} from './sheetSnap';

interface MobileBottomSheetProps {
  properties: Property[];
}

/** Fallback si `--mobile-header-height` aún no se publicó (ver MobileHeader). */
const DEFAULT_HEADER_PX = 122;

/** Movimiento (px) por debajo del cual un gesto cuenta como toque, no arrastre. */
const TAP_SLOP_PX = 6;

function readViewport() {
  const viewportH = window.innerHeight;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    '--mobile-header-height',
  );
  const headerH = parseFloat(raw) || DEFAULT_HEADER_PX;
  return { viewportH, headerH };
}

export default function MobileBottomSheet({ properties }: MobileBottomSheetProps) {
  const [state, setState] = useState<SheetState>('peek');
  const [snaps, setSnaps] = useState(() => sheetSnapHeights(0, DEFAULT_HEADER_PX));
  // Alto en px durante el drag (null = no se está arrastrando). Independiente
  // de `state` para que el drag no lleve la transición CSS (se vería con lag).
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const snapsRef = useRef(snaps);
  const stateRef = useRef(state);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    currentHeight: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    snapsRef.current = snaps;
  }, [snaps]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Alturas en px calculadas con el viewport real (en iOS `vh` ≠ `innerHeight`
  // cuando la barra del navegador está visible) y con la cabecera fija.
  useEffect(() => {
    function recompute() {
      const { viewportH, headerH } = readViewport();
      setSnaps(sheetSnapHeights(viewportH, headerH));
    }
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    window.visualViewport?.addEventListener('resize', recompute);
    // La cabecera publica su alto con ResizeObserver; reintenta tras pintar.
    const raf = requestAnimationFrame(recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
      window.visualViewport?.removeEventListener('resize', recompute);
    };
  }, []);

  // Chrome en iOS interpreta un arrastre hacia abajo con la página en el tope
  // como «jalar para recargar». Mientras la hoja esté montada se desactiva ese
  // gesto a nivel de documento.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overscrollBehaviorY;
    const prevBody = document.body.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    return () => {
      html.style.overscrollBehaviorY = prevHtml;
      document.body.style.overscrollBehaviorY = prevBody;
    };
  }, []);

  const finishDrag = useCallback((commit: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragHeight(null);
    if (!commit) return;
    if (!drag.moved) {
      // Toque en la barra: avanza al siguiente estado.
      setState(nextSheetState(stateRef.current));
      return;
    }
    setState(nearestSheetState(drag.currentHeight, snapsRef.current));
  }, []);

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    // Alto real en pantalla: no depende de qué unidad usó el CSS.
    const startHeight = sheetRef.current?.getBoundingClientRect().height ?? 0;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startHeight,
      currentHeight: startHeight,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const delta = drag.startY - e.clientY;
    if (!drag.moved && Math.abs(delta) < TAP_SLOP_PX) return;
    drag.moved = true;
    const { peek, full } = snapsRef.current;
    const next = Math.min(full, Math.max(peek, drag.startHeight + delta));
    drag.currentHeight = next;
    setDragHeight(next);
  }, []);

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId !== e.pointerId) return;
      finishDrag(true);
    },
    [finishDrag],
  );

  // Gesto cancelado por el navegador (p. ej. iOS toma el control): se vuelve al
  // estado de antes sin dejar la hoja «a medias» ni el drag colgado.
  const handlePointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId !== e.pointerId) return;
      const drag = dragRef.current;
      if (drag.moved) finishDrag(true);
      else finishDrag(false);
    },
    [finishDrag],
  );

  // Teclado / lector de pantalla: `click` sin puntero (detail === 0). Los clics
  // generados por un toque ya se manejaron en pointerup.
  const handleKeyboardClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.detail !== 0) return;
    setState(nextSheetState(stateRef.current));
  }, []);

  const height = dragHeight ?? snaps[state];
  const dragging = dragHeight !== null;

  return (
    <div
      ref={sheetRef}
      data-testid="mobile-bottom-sheet"
      data-sheet-state={state}
      className={`fixed bottom-0 left-0 right-0 flex flex-col bg-white/92 backdrop-blur-md rounded-t-3xl shadow-xl border-t border-[rgba(11,28,30,0.06)] z-20 ${
        dragging ? '' : 'transition-[height] duration-300'
      }`}
      style={{ height }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: 'none' }}
        className="flex shrink-0 justify-center items-center w-full min-h-[48px] select-none cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={handleKeyboardClick}
          aria-label="Expandir o contraer la lista de propiedades"
          className="w-10 h-1 bg-propyte-brand/40 rounded-full cursor-pointer"
        />
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4"
        style={{
          touchAction: 'pan-y',
          // Con la hoja replegada solo asoma el filo de la primera tarjeta: sin
          // scroll interno para que el gesto vaya a la barra y no a la lista.
          overflowY: state === 'peek' && !dragging ? 'hidden' : 'auto',
        }}
      >
        <div className="space-y-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}
