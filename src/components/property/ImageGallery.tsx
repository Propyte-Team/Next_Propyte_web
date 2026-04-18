'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Camera, Move3D, Play } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { PropertyMedia } from '@/types/property';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  media?: PropertyMedia;
}

export default function ImageGallery({ images, alt, media }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const t = useTranslations('property');
  const locale = useLocale();

  const prev = useCallback(() => setCurrent(i => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setCurrent(i => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  return (
    <>
      {/* Zillow-style mosaic grid */}
      <div className="relative rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightbox(true)}>
        {images.length >= 3 ? (
          <div className="grid grid-cols-2 gap-1 h-[280px] md:h-[420px]">
            <div className="relative row-span-2">
              <Image
                src={images[0]}
                alt={`${alt} - 1`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover hover:brightness-95 transition-all"
                priority
              />
            </div>
            <div className="relative">
              <Image
                src={images[1]}
                alt={`${alt} - 2`}
                fill
                sizes="25vw"
                className="object-cover hover:brightness-95 transition-all"
              />
            </div>
            <div className="relative">
              <Image
                src={images[2]}
                alt={`${alt} - 3`}
                fill
                sizes="25vw"
                className="object-cover hover:brightness-95 transition-all"
              />
              {images.length > 3 && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition-colors">
                  <span className="text-white font-bold text-lg">+{images.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative aspect-[16/9]">
            <Image src={images[0]} alt={`${alt} - 1`} fill sizes="100vw" className="object-cover" priority />
          </div>
        )}

        {/* Action pills */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {media?.virtualTour && (
            <a
              href="#virtual-tour"
              onClick={(e) => { e.stopPropagation(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-[#2C2C2C] text-sm font-semibold rounded-lg shadow-md backdrop-blur-sm transition-colors"
            >
              <Move3D size={14} className="text-[#5CE0D2]" />
              {locale === 'es' ? 'Tour 360°' : '360° Tour'}
            </a>
          )}
          {media?.video && (
            <a
              href="#video"
              onClick={(e) => { e.stopPropagation(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-[#2C2C2C] text-sm font-semibold rounded-lg shadow-md backdrop-blur-sm transition-colors"
            >
              <Play size={14} className="text-[#F5A623]" fill="#F5A623" />
              Video
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-[#2C2C2C] text-sm font-semibold rounded-lg shadow-md backdrop-blur-sm transition-colors"
          >
            <Camera size={14} />
            {t('photoCount', { count: images.length })}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setLightbox(false)}>
          <div className="flex items-center justify-between px-4 py-3 text-white" onClick={e => e.stopPropagation()}>
            <span className="text-sm font-medium">{current + 1} / {images.length}</span>
            <button onClick={() => setLightbox(false)} className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center" aria-label="Close">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
            <div className="relative w-full h-full max-w-[90vw] max-h-[80vh]">
              <Image src={images[current]} alt={`${alt} - ${current + 1}`} fill sizes="90vw" className="object-contain" />
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white" aria-label="Previous">
                <ChevronLeft size={28} />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white" aria-label="Next">
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div className="flex justify-center gap-2 px-4 py-4 overflow-x-auto" onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative w-16 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                <Image src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
