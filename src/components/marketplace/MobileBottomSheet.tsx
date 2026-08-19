'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import PropertyCard from '@/components/ui/PropertyCard';
import type { Property } from '@/types/property';

interface MobileBottomSheetProps {
  properties: Property[];
}

type SheetState = 'peek' | 'half' | 'full';

const PEEK_PX = 120;
const HALF_RATIO = 0.5;
const FULL_RATIO = 0.85;

const HEIGHT_CLASSES: Record<SheetState, string> = {
  peek: 'h-[120px]',
  half: 'h-[50vh]',
  full: 'h-[85vh]',
};

export default function MobileBottomSheet({ properties }: MobileBottomSheetProps) {
  const [state, setState] = useState<SheetState>('peek');
  // Alto en px durante el drag (null = no se está arrastrando, se usa la
  // clase Tailwind de `state`). Independiente de `state` para que el drag
  // no tenga el `transition-all` de por medio (se vería con lag).
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);

  function handleToggle() {
    if (state === 'peek') setState('half');
    else if (state === 'half') setState('full');
    else setState('peek');
  }

  const snapPx = useCallback(() => {
    const vh = window.innerHeight;
    return { peek: PEEK_PX, half: vh * HALF_RATIO, full: vh * FULL_RATIO };
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const { peek, half, full } = snapPx();
      const currentPx = state === 'peek' ? peek : state === 'half' ? half : full;
      dragStartRef.current = { y: e.clientY, height: currentPx };
      setDragHeight(currentPx);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [snapPx, state],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragStartRef.current) return;
      const { peek, full } = snapPx();
      const delta = dragStartRef.current.y - e.clientY;
      const next = Math.min(full, Math.max(peek, dragStartRef.current.height + delta));
      setDragHeight(next);
    },
    [snapPx],
  );

  const handlePointerUp = useCallback(() => {
    if (!dragStartRef.current) return;
    const { peek, half, full } = snapPx();
    const current = dragHeight ?? dragStartRef.current.height;
    const nearest = ([
      ['peek', Math.abs(current - peek)],
      ['half', Math.abs(current - half)],
      ['full', Math.abs(current - full)],
    ] as [SheetState, number][]).sort((a, b) => a[1] - b[1])[0][0];
    setState(nearest);
    dragStartRef.current = null;
    setDragHeight(null);
  }, [dragHeight, snapPx]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white/92 backdrop-blur-md rounded-t-3xl shadow-xl border-t border-[rgba(11,28,30,0.06)] z-20 ${
        dragHeight === null ? `transition-all duration-300 ${HEIGHT_CLASSES[state]}` : ''
      }`}
      style={dragHeight !== null ? { height: dragHeight } : undefined}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="flex justify-center items-center w-full min-h-[44px] py-3 select-none"
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Expandir o contraer la lista de propiedades"
          className="w-10 h-1 bg-propyte-brand/40 rounded-full cursor-pointer"
        />
      </div>
      <div
        className="overflow-y-auto px-4 pb-4"
        style={{ height: 'calc(100% - 28px)', touchAction: 'pan-y' }}
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
