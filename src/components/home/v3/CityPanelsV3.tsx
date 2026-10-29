'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { gsap, SplitText, useGSAP, MOTION_OK, prefersReducedMotion } from '@/lib/gsap-client';
import type { HomeCity } from './types';

/**
 * "Elige dónde vivir o invertir": en escritorio, paneles verticales que se
 * expanden al pasar el cursor; en móvil, acordeón. Conteos y "desde" reales
 * por ciudad (v_developments publicados).
 */
export default function CityPanelsV3({ cities }: { cities: HomeCity[] }) {
  const t = useTranslations('homeV3.cities');
  const [open, setOpen] = useState(Math.min(1, cities.length - 1));
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const panels = gsap.utils.toArray<HTMLElement>('[data-pn]', root.current);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      gsap.set(panels, { flexGrow: (j: number) => (j === open ? 3.8 : 1) });
    });
    mm.add('(max-width: 1023px)', () => {
      gsap.set(panels, { height: (j: number) => (j === open ? 400 : 88) });
    });
    mm.add(MOTION_OK, () => {
      const h2 = root.current?.querySelector('h2');
      if (h2) SplitText.create(h2, { type: 'lines,words', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: h2, start: 'top 88%', once: true } }) });
      gsap.fromTo(panels, { y: 80, autoAlpha: 0, clipPath: 'inset(30% 0% 0% 0%)' }, {
        y: 0, autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: '[data-panels]', start: 'top 85%', once: true },
      });
    });
    return () => mm.revert();
  }, { scope: root });

  const openPanel = (i: number) => {
    if (i === open) return;
    const panels = gsap.utils.toArray<HTMLElement>('[data-pn]', root.current);
    const d = prefersReducedMotion() ? 0 : 0.8;
    const desk = window.matchMedia('(min-width: 1024px)').matches;
    if (desk) gsap.to(panels, { flexGrow: (j: number) => (j === i ? 3.8 : 1), duration: d, ease: 'power3.inOut' });
    else {
      gsap.to(panels[open], { height: 88, duration: d, ease: 'power3.inOut' });
      gsap.to(panels[i], { height: 400, duration: d, ease: 'power3.inOut' });
    }
    const lg = panels[i].querySelector('[data-lg]');
    if (lg && d) gsap.fromTo(lg, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: d * 0.6, delay: d * 0.45, ease: 'power3.out' });
    const img = panels[i].querySelector('img');
    if (img && d) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: d * 2, ease: 'power2.out' });
    setOpen(i);
  };

  if (cities.length === 0) return null;
  return (
    <section ref={root} aria-labelledby="home-cities-title" className="bg-[#F4F6F8] px-4 lg:px-10 py-[72px] lg:py-32">
      <div className="lg:flex lg:justify-between lg:items-end gap-8">
        <h2 id="home-cities-title" className="font-display text-[36px] lg:text-[clamp(34px,4.2vw,60px)] leading-[1.02] font-semibold tracking-[-0.035em] max-w-[640px] text-balance">{t('title')}</h2>
        <p className="mt-3.5 lg:mt-0 text-[15px] lg:text-[17px] text-[#5B6B74] max-w-[420px]">{t('lead')}</p>
      </div>
      <div data-panels className="mt-7 lg:mt-14 flex flex-col lg:flex-row gap-2 lg:gap-3 lg:h-[600px]">
        {cities.map((c, i) => {
          const isOpen = i === open;
          return (
            <Link
              key={c.key}
              href={c.href}
              data-pn
              onMouseEnter={() => openPanel(i)}
              onFocus={() => openPanel(i)}
              onClick={(e) => {
                if (!window.matchMedia('(min-width: 1024px)').matches && !isOpen) { e.preventDefault(); openPanel(i); }
              }}
              className="relative overflow-hidden rounded-md text-white lg:flex-[1_1_0] min-w-0 h-[88px] lg:h-auto"
            >
              {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />}
              <span aria-hidden="true" className={`absolute inset-0 ${isOpen ? 'bg-gradient-to-b from-transparent via-[#0F1923]/20 to-[#0F1923]/90' : 'bg-[#0F1923]/55 lg:bg-gradient-to-b lg:from-transparent lg:to-[#0F1923]/85'}`} />
              {isOpen ? (
                <span data-lg className="absolute left-5 right-5 bottom-5 lg:left-10 lg:right-10 lg:bottom-10">
                  <span className="block font-display text-[52px] lg:text-[80px] leading-[0.95] font-semibold tracking-[-0.045em]">{c.name}</span>
                  <span className="block mt-2.5 lg:mt-3.5 text-[15px] lg:text-lg text-white/85">
                    {t('count', { count: c.count })}{c.fromLabel ? ` · ${t('from', { price: c.fromLabel })}` : ''}
                  </span>
                  {c.zones.length > 0 && <span className="hidden lg:block mt-1.5 text-[15px] text-white/65">{c.zones.join(', ')}</span>}
                  <span className="inline-flex items-center mt-5 lg:mt-7 h-11 lg:h-12 px-5 lg:px-6 rounded-full bg-propyte-brand text-[#0F1923] text-[15px] font-semibold">{t('cta', { city: c.name })}</span>
                </span>
              ) : (
                <span className="absolute inset-x-5 top-1/2 -translate-y-1/2 lg:translate-y-0 lg:top-auto lg:bottom-5 flex lg:block items-center justify-between">
                  <span className="block font-display text-[22px] font-semibold leading-tight">{c.name}</span>
                  <span className="block text-right lg:text-left text-[13px] lg:text-sm text-white/80 lg:mt-1.5">
                    {t('count', { count: c.count })}{c.fromLabel ? <><br />{t('from', { price: c.fromLabel })}</> : null}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
