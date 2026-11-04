'use client';

import { useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { gsap, useGSAP, MOTION_OK } from '@/lib/gsap-client';
import type { HomeStats } from './types';

/**
 * Franja de cifras del inventario real (getGlobalStats). El HTML del servidor
 * ya trae la cifra final; con movimiento, el conteo arranca en el 85 % al
 * entrar en pantalla (nunca desde 0: evita el "1 Ciudades" de la auditoría).
 */
export default function FiguresV3({ stats, asOf }: { stats: HomeStats; asOf: string }) {
  const t = useTranslations('homeV3.figures');
  const locale = useLocale();
  const root = useRef<HTMLElement>(null);
  const fmt = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-MX');

  const items = [
    { key: 'developments', value: stats.developments },
    { key: 'units', value: stats.units },
    { key: 'cities', value: stats.cities },
    { key: 'zones', value: stats.zones },
  ].filter((i) => i.value > 0);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>('[data-fig]', root.current).forEach((c, idx) => {
        const n = c.querySelector<HTMLElement>('[data-n]');
        if (!n) return;
        const to = Number(n.dataset.n);
        const o = { v: Math.round(to * 0.85) };
        const render = () => { n.textContent = fmt.format(Math.round(o.v)); };
        render();
        gsap.set(c, { '--rule': 0 });
        gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 90%', once: true }, delay: idx * 0.1 })
          .to(c, { '--rule': 1, duration: 0.9, ease: 'power3.inOut' })
          .to(o, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: render }, 0)
          .from(c.querySelector('[data-l]'), { y: 10, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, 0.2);
        return () => { n.textContent = fmt.format(to); };
      });
    });
  }, { scope: root });

  if (items.length === 0) return null;
  return (
    <section ref={root} aria-label={t('aria')} className="bg-[#0F1923] text-white px-4 lg:px-10 pt-10 lg:pt-16 pb-9 lg:pb-14">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-7">
        {items.map((i) => (
          <div
            key={i.key}
            data-fig
            className="relative pl-3.5 lg:pl-7 pr-4 before:content-[''] before:absolute before:left-0 before:inset-y-0 before:w-px before:bg-white/15 before:origin-top before:[transform:scaleY(var(--rule,1))]"
          >
            <div data-n={i.value} className="font-display text-[40px] lg:text-[clamp(40px,5vw,72px)] leading-none font-medium tracking-[-0.04em] tabular-nums">
              {fmt.format(i.value)}
            </div>
            <div data-l className="mt-2 lg:mt-3.5 text-[13px] lg:text-[15px] leading-snug text-white/60 max-w-[220px]">{t(i.key)}</div>
          </div>
        ))}
      </div>
      <p className="mt-7 lg:mt-10 text-xs lg:text-[13px] text-white/45">{t('source', { date: asOf })}</p>
    </section>
  );
}
