'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X } from '@/lib/icons';

/**
 * Galería de la ficha v3. Escritorio: mosaico de una foto grande y dos a la
 * derecha. Móvil: tira horizontal con ajuste por foto y contador. Cualquier
 * foto abre el visor: un <dialog> nativo (Esc y foco los resuelve el navegador)
 * con todas las fotos en columna, sin carrusel que obligue a pulsar flechas.
 */
export default function GalleryV3({ images, alt, badge }: { images: string[]; alt: string; badge?: React.ReactNode }) {
  const t = useTranslations('developmentDetailV3.gallery');
  const dialog = useRef<HTMLDialogElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  const open = (i: number) => {
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    d.querySelector<HTMLElement>(`[data-photo="${i}"]`)?.scrollIntoView({ block: 'start' });
  };

  const onStripScroll = () => {
    const el = strip.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.88));
    if (i !== current) setCurrent(Math.min(images.length - 1, Math.max(0, i)));
  };

  const side = images.slice(1, 3);

  return (
    <>
      {/* Escritorio */}
      <div className={`relative hidden md:grid gap-2 h-[clamp(420px,64vh,700px)] ${side.length ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-2' : 'grid-cols-1'}`}>
        <button type="button" onClick={() => open(0)} className={`group relative overflow-hidden rounded-md bg-[#D9E0E3] ${side.length ? 'row-span-2' : ''}`} aria-label={t('open', { n: 1, total: images.length })}>
          <Image src={images[0]} alt={alt} fill priority sizes="(max-width: 1024px) 66vw, 64vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]" />
        </button>
        {side.map((src, k) => (
          <button key={src} type="button" onClick={() => open(k + 1)} className={`group relative overflow-hidden rounded-md bg-[#D9E0E3] ${side.length === 1 ? 'row-span-2' : ''}`} aria-label={t('open', { n: k + 2, total: images.length })}>
            <Image src={src} alt="" fill sizes="33vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]" />
          </button>
        ))}
        {badge && <div className="absolute left-4 top-4 pointer-events-none">{badge}</div>}
        {images.length > 1 && (
          <button type="button" onClick={() => open(0)} className="absolute right-4 bottom-4 h-11 px-4 rounded-md bg-white text-[#13222C] text-[14px] font-semibold hover:bg-[#0F1923] hover:text-white transition-colors">
            {t('all', { count: images.length })}
          </button>
        )}
      </div>

      {/* Móvil */}
      <div className="md:hidden relative -mx-4">
        <div ref={strip} onScroll={onStripScroll} className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-4 [scrollbar-width:none]">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => open(i)} className="relative shrink-0 w-[88vw] aspect-[4/3] snap-center overflow-hidden rounded-md bg-[#D9E0E3]" aria-label={t('open', { n: i + 1, total: images.length })}>
              <Image src={src} alt={i === 0 ? alt : ''} fill priority={i === 0} sizes="88vw" className="object-cover" />
            </button>
          ))}
        </div>
        {badge && <div className="absolute left-7 top-3 pointer-events-none">{badge}</div>}
        {images.length > 1 && (
          <span className="absolute right-7 bottom-3 px-2 py-1 rounded bg-[#0F1923]/80 text-white text-[12px] font-semibold tabular-nums" aria-hidden="true">
            {current + 1} / {images.length}
          </span>
        )}
      </div>

      <dialog
        ref={dialog}
        aria-label={t('viewer', { name: alt })}
        className="m-0 p-0 w-screen h-[100dvh] max-w-none max-h-none bg-[#0F1923] text-white backdrop:bg-[#0F1923]"
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-10 py-4 bg-[#0F1923]">
          <p className="font-display text-[17px] lg:text-xl font-semibold tracking-[-0.015em] truncate pr-4">{alt}</p>
          <button type="button" onClick={() => dialog.current?.close()} className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-md border border-white/25 text-[14px] font-semibold hover:bg-white hover:text-[#0F1923] transition-colors">
            <X size={16} aria-hidden="true" /> {t('close')}
          </button>
        </div>
        <div className="px-4 lg:px-10 pb-10 flex flex-col gap-3 lg:gap-4 items-center">
          {images.map((src, i) => (
            <figure key={src} data-photo={i} className="w-full max-w-[1280px] scroll-mt-20">
              <div className="relative w-full aspect-[3/2] bg-white/5 rounded-md overflow-hidden">
                <Image src={src} alt={i === 0 ? alt : ''} fill loading="lazy" sizes="(max-width: 1280px) 100vw, 1280px" className="object-contain" />
              </div>
              <figcaption className="mt-2 text-[13px] text-white/60 tabular-nums">{i + 1} / {images.length}</figcaption>
            </figure>
          ))}
        </div>
      </dialog>
    </>
  );
}
