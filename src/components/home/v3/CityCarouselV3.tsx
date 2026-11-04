'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from '@/lib/icons';
import { gsap, Draggable, SplitText, useGSAP, MOTION_OK, prefersReducedMotion } from '@/lib/gsap-client';
import type { HomeCity } from './types';

/**
 * "Lo más buscado, ciudad por ciudad": pestañas solo con texto (#8 de Lara),
 * carrusel arrastrable con inercia y ajuste a cada tarjeta, flechas y barra de
 * avance. Las tarjetas salen de v_developments (publicados).
 */
export default function CityCarouselV3({ cities }: { cities: HomeCity[] }) {
  const t = useTranslations('homeV3.carousel');
  const tStage = useTranslations('homeV3.stage');
  const locale = useLocale();
  const [cityIdx, setCityIdx] = useState(0);
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLSpanElement>(null);
  const prog = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const api = useRef<{ measure: () => void; slideBy: (d: number) => void } | null>(null);
  const city = cities[cityIdx];

  useGSAP(() => {
    const vp = viewport.current;
    const tr = track.current;
    if (!vp || !tr) return;
    let offsets: number[] = [0];
    let maxX = 0;
    const update = () => {
      const x = -Number(gsap.getProperty(tr, 'x'));
      const visible = maxX > 0 ? vp.clientWidth / tr.scrollWidth : 1;
      const ratio = maxX > 0 ? x / maxX : 0;
      if (prog.current) gsap.set(prog.current, { width: `${visible * 100}%`, left: `${ratio * (1 - visible) * 100}%` });
      setEdges((e) => {
        const next = { start: x <= 2, end: x >= maxX - 2 };
        return e.start === next.start && e.end === next.end ? e : next;
      });
    };
    const measure = () => {
      const cards = Array.from(tr.querySelectorAll<HTMLElement>('[data-card]'));
      maxX = Math.max(0, tr.scrollWidth - vp.clientWidth);
      offsets = cards.map((c) => Math.min(c.offsetLeft, maxX));
      if (!offsets.includes(maxX)) offsets.push(maxX);
      drag.applyBounds({ minX: -maxX, maxX: 0 });
      gsap.set(tr, { x: gsap.utils.clamp(-maxX, 0, Number(gsap.getProperty(tr, 'x'))) });
      update();
    };
    const nearest = () => {
      const x = -Number(gsap.getProperty(tr, 'x'));
      return offsets.reduce((best, o, i) => (Math.abs(o - x) < Math.abs(offsets[best] - x) ? i : best), 0);
    };
    const [drag] = Draggable.create(tr, {
      type: 'x', bounds: vp, inertia: true, edgeResistance: 0.85, dragResistance: 0.05,
      allowNativeTouchScrolling: true, zIndexBoost: false,
      snap: { x: (v: number) => -gsap.utils.snap(offsets, -v) },
      onDrag: update, onThrowUpdate: update,
      onPress() { gsap.killTweensOf(tr); },
    });
    api.current = {
      measure,
      slideBy: (d: number) => {
        const idx = gsap.utils.clamp(0, offsets.length - 1, nearest() + d);
        gsap.to(tr, { x: -offsets[idx], duration: prefersReducedMotion() ? 0 : 0.8, ease: 'power3.out', onUpdate: update, onComplete: () => drag.update() });
      },
    };
    measure();
    window.addEventListener('resize', measure);

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const h2 = root.current?.querySelector('h2');
      if (h2) {
        SplitText.create(h2, {
          type: 'lines,words', mask: 'lines', autoSplit: true,
          onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: h2, start: 'top 88%', once: true } }),
        });
      }
      gsap.fromTo(tr.querySelectorAll('[data-ph]'), { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: vp, start: 'top 85%', once: true },
      });
    });
    return () => { window.removeEventListener('resize', measure); drag.kill(); mm.revert(); };
  }, { scope: root });

  // Al cambiar de ciudad: tarjetas nuevas entran desde un lado, la línea bajo la pestaña se desliza.
  useGSAP(() => {
    const tab = root.current?.querySelector<HTMLElement>('[role=tab][aria-selected="true"]');
    if (tab && ink.current) gsap.to(ink.current, { x: tab.offsetLeft, width: tab.offsetWidth, duration: prefersReducedMotion() ? 0 : 0.5, ease: 'power3.inOut' });
    if (track.current) gsap.set(track.current, { x: 0 });
    api.current?.measure();
    if (!prefersReducedMotion() && track.current) {
      gsap.fromTo(track.current.querySelectorAll('[data-card]'), { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' });
    }
  }, { scope: root, dependencies: [cityIdx] });

  if (!city) return null;

  return (
    <section ref={root} aria-labelledby="home-carousel-title" className="py-[72px] lg:py-32 pl-4 lg:pl-10 overflow-hidden">
      <div className="lg:flex lg:items-end lg:justify-between gap-8 pr-4 lg:pr-10">
        <h2 id="home-carousel-title" className="font-display text-[36px] lg:text-[clamp(34px,4.2vw,60px)] leading-[1.02] font-semibold tracking-[-0.035em] max-w-[620px] text-balance">
          {t('title')}
        </h2>
        <div className="flex items-center gap-3 mt-6 lg:mt-0">
          <div role="tablist" aria-label={t('citiesAria')} className="relative flex gap-2 lg:gap-7 overflow-x-auto lg:overflow-visible [scrollbar-width:none]">
            <span ref={ink} aria-hidden="true" className="hidden lg:block absolute left-0 bottom-0 h-0.5 bg-[#0F1923] w-0" />
            {cities.map((c, i) => (
              <button
                key={c.key}
                role="tab"
                aria-selected={i === cityIdx}
                onClick={() => setCityIdx(i)}
                className={`shrink-0 whitespace-nowrap text-sm lg:text-base font-medium px-3.5 py-2 lg:px-0 lg:pt-0 lg:pb-2.5 rounded-full lg:rounded-none border lg:border-0 transition-colors ${
                  i === cityIdx ? 'bg-[#0F1923] text-white border-[#0F1923] lg:bg-transparent lg:text-[#13222C]' : 'text-[#5B6B74] border-black/10'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex gap-2.5 ml-3">
            <button type="button" onClick={() => api.current?.slideBy(-1)} disabled={edges.start} aria-label={t('prev')} className="w-[52px] h-[52px] rounded-full border border-black/10 inline-flex items-center justify-center enabled:hover:bg-[#0F1923] enabled:hover:text-white disabled:opacity-35 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => api.current?.slideBy(1)} disabled={edges.end} aria-label={t('next')} className="w-[52px] h-[52px] rounded-full border border-black/10 inline-flex items-center justify-center enabled:hover:bg-[#0F1923] enabled:hover:text-white disabled:opacity-35 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div ref={viewport} className="mt-6 lg:mt-14 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y">
        <div ref={track} role="tabpanel" className="flex items-start gap-3 lg:gap-6 w-max pr-4 lg:pr-10">
          {city.items.map((d, i) => (
            <article key={d.id} data-card className={`group shrink-0 select-none ${i === 0 ? 'w-[78vw] max-w-[320px] lg:w-[560px] lg:max-w-none' : 'w-[78vw] max-w-[320px] lg:w-[400px] lg:max-w-none'}`}>
              <Link href={`/${locale}/desarrollos/${d.slug}`} draggable={false} className="block">
                <div data-ph className={`relative overflow-hidden rounded-md bg-[#D9E0E3] h-[380px] ${i === 0 ? 'lg:h-[640px]' : 'lg:h-[500px]'}`}>
                  {d.image && (
                    <Image src={d.image} alt={d.name} fill draggable={false} sizes="(max-width: 1024px) 80vw, 560px" className="object-cover pointer-events-none transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
                  )}
                  <span className={`absolute left-3 top-3 lg:left-4 lg:top-4 text-xs lg:text-[13px] font-semibold px-2.5 py-1.5 lg:px-3 lg:py-[7px] rounded ${d.stage === 'presale' ? 'bg-propyte-brand text-[#0F1923]' : 'bg-[#0F1923] text-white'}`}>
                    {tStage(d.stage)}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 mt-3.5 lg:mt-5">
                  <div className="min-w-0">
                    <h3 className="font-display text-[21px] lg:text-[26px] leading-[1.1] font-semibold tracking-[-0.025em]">{d.name}</h3>
                    <p className="mt-1 lg:mt-1.5 text-[13px] lg:text-[15px] text-[#5B6B74]">{d.place}</p>
                  </div>
                  {d.priceLabel && (
                    <div className="text-right shrink-0">
                      <span className="text-xs lg:text-[13px] text-[#5B6B74]">{t('from')}</span>
                      <b className="block font-display text-lg lg:text-[22px] font-semibold tracking-[-0.02em]">{d.priceLabel}</b>
                    </div>
                  )}
                </div>
                <div className="mt-2.5 lg:mt-3.5 pt-2.5 lg:pt-3.5 border-t border-black/10 text-[13px] lg:text-sm text-[#5B6B74] flex flex-wrap gap-x-4 gap-y-1">
                  {d.types.length > 0 && <span>{d.types.slice(0, 2).join(', ')}</span>}
                  {d.available != null && d.available > 0 && <span>{t('available', { count: d.available })}</span>}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-7 lg:mt-12 pr-4 lg:pr-10 flex items-center gap-6">
        <div className="relative flex-1 h-0.5 bg-black/10"><i ref={prog} className="absolute left-0 top-0 h-0.5 bg-[#0F1923] w-[30%]" /></div>
        <Link href={city.href} className="font-semibold text-[15px] whitespace-nowrap">
          {t('seeAll', { count: city.count, city: city.name })} →
        </Link>
      </div>
    </section>
  );
}
