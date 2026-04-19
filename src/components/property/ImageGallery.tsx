'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  badgeTopLeft?: React.ReactNode;
}

/**
 * Hero gallery + thumbnail strip + fullscreen modal.
 * - Hero 16:9 with priority on first image
 * - Thumbnails row below (scroll-x mobile, 5-col grid md+)
 * - Click thumbnail → changes hero (no modal)
 * - Click hero → opens modal with swipe/keyboard nav (←/→, Esc)
 * - Photo count overlay "N / M"
 * - Tap targets ≥ 44×44 on thumbnails
 */
export default function ImageGallery({ images, alt, badgeTopLeft }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [modal, setModal] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const safeImages = images.filter(Boolean);
  const count = safeImages.length;

  const prev = useCallback(
    () => setCurrent((i) => (i === 0 ? count - 1 : i - 1)),
    [count],
  );
  const next = useCallback(
    () => setCurrent((i) => (i === count - 1 ? 0 : i + 1)),
    [count],
  );

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setModal(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modal, prev, next]);

  if (count === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
        <Camera size={60} strokeWidth={1} />
      </div>
    );
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
    touchStartX.current = null;
  };

  return (
    <>
      {/* Hero */}
      <button
        type="button"
        onClick={() => setModal(true)}
        className="relative block w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 group"
        aria-label={`${alt} — open gallery`}
      >
        <Image
          src={safeImages[current]}
          alt={`${alt} ${current + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition-opacity duration-200 group-hover:opacity-95"
          priority={current === 0}
        />
        {badgeTopLeft && (
          <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
            {badgeTopLeft}
          </div>
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/55 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
          <Camera size={12} />
          <span>{current + 1} / {count}</span>
        </div>
      </button>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="mt-3 -mx-4 md:mx-0">
          <div className="flex gap-2 px-4 md:px-0 md:grid md:grid-cols-5 overflow-x-auto no-scrollbar pb-1">
            {safeImages.slice(0, 8).map((src, i) => {
              const selected = i === current;
              return (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-current={selected}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`relative aspect-[4/3] min-w-[88px] md:min-w-0 min-h-[66px] rounded-xl overflow-hidden border-2 transition-all ${
                    selected
                      ? 'border-[#5CE0D2] ring-2 ring-[#5CE0D2]/30'
                      : 'border-transparent hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${alt} thumb ${i + 1}`}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                  {i === 7 && count > 8 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-sm font-bold">
                      +{count - 7}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — gallery`}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">{current + 1} / {count}</span>
            <button
              type="button"
              onClick={() => setModal(false)}
              className="w-11 h-11 hover:bg-white/10 rounded-full flex items-center justify-center"
              aria-label="Close gallery"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 relative">
            <div className="relative w-full h-full max-w-[92vw] max-h-[75vh]">
              <Image
                src={safeImages[current]}
                alt={`${alt} ${current + 1}`}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronRight size={26} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip inside modal */}
          {count > 1 && (
            <div className="flex justify-center gap-2 px-4 py-4 overflow-x-auto no-scrollbar">
              {safeImages.map((img, i) => (
                <button
                  key={`m-${img}-${i}`}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`relative w-16 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all min-w-[44px] min-h-[44px] ${
                    i === current ? 'border-[#5CE0D2]' : 'border-transparent opacity-55 hover:opacity-90'
                  }`}
                >
                  <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
