'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { gsap, SplitText, useGSAP, MOTION_OK, prefersReducedMotion } from '@/lib/gsap-client';

const ROWS = ['review', 'compare', 'keys', 'abroad', 'oneAdvisor'] as const;
const CRITERIA = ['legal', 'deadlines', 'price', 'build', 'resale'] as const;

/**
 * "Por qué comprar con Propyte": lista editorial ordenada por importancia
 * (pedido de la diseñadora). La fila activa pasa a oscuro con una banda que sube
 * y la foto fija de la izquierda cambia. Fotos reales de desarrollos (ambiente).
 */
export default function BenefitsV3({ images }: { images: string[] }) {
  const t = useTranslations('homeV3.benefits');
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const h2 = root.current?.querySelector('h2');
      if (h2) SplitText.create(h2, { type: 'lines,words', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: h2, start: 'top 88%', once: true } }) });
      gsap.from('[data-row]', { y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-list]', start: 'top 85%', once: true } });
      gsap.fromTo('[data-photo]', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '[data-photo]', start: 'top 90%', once: true } });
      gsap.from('[data-chip]', { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'back.out(2)', scrollTrigger: { trigger: '[data-chips]', start: 'top 92%', once: true } });
    });
    return () => mm.revert();
  }, { scope: root });

  const activate = (i: number) => {
    if (i === active) return;
    const d = prefersReducedMotion() ? 0 : 0.55;
    const bands = gsap.utils.toArray<HTMLElement>('[data-band]', root.current);
    const photos = gsap.utils.toArray<HTMLElement>('[data-ph-img]', root.current);
    gsap.to(bands[active], { scaleY: 0, transformOrigin: 'top', duration: d, ease: 'power3.inOut' });
    gsap.fromTo(bands[i], { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: d, ease: 'power3.inOut' });
    if (photos[i]) {
      gsap.to(photos[active], { autoAlpha: 0, duration: d * 1.4, ease: 'power2.inOut' });
      gsap.fromTo(photos[i], { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: d ? 1.2 : 0, ease: 'power3.out' });
    }
    setActive(i);
  };

  return (
    <section ref={root} aria-labelledby="home-benefits-title" className="px-4 lg:px-10 py-20 lg:py-40 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[clamp(40px,6vw,96px)] items-start">
      <div className="lg:sticky lg:top-[110px]">
        <h2 id="home-benefits-title" className="font-display text-[36px] lg:text-[clamp(34px,4.2vw,60px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">{t('title')}</h2>
        <p className="mt-4 lg:mt-5 text-[15px] lg:text-[17px] text-[#5B6B74] max-w-[380px]">{t('lead')}</p>
        <Link href={`/${locale}/metodologia`} className="inline-block mt-4 lg:mt-5 font-semibold text-[#0E7490]">{t('methodology')} →</Link>
        <div data-photo className="relative mt-7 lg:mt-10 aspect-[4/3] lg:aspect-[4/5] lg:max-h-[58vh] w-full rounded-md overflow-hidden bg-[#D9E0E3]" aria-hidden="true">
          {images.slice(0, ROWS.length).map((src, i) => (
            <div key={src} data-ph-img className="absolute inset-0" style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}>
              <Image src={src} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      <ul data-list className="mt-8 lg:mt-0 border-t border-black/10">
        {ROWS.map((key, i) => {
          const on = i === active;
          const main = i === 0;
          return (
            <li
              key={key}
              data-row
              tabIndex={0}
              onMouseEnter={() => activate(i)}
              onFocus={() => activate(i)}
              onClick={() => activate(i)}
              className="relative grid lg:grid-cols-[110px_minmax(0,1fr)] gap-1.5 lg:gap-6 px-[18px] lg:px-7 py-[26px] lg:py-10 border-b border-black/10 outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand rounded-lg"
            >
              <span data-band aria-hidden="true" className="absolute inset-0 rounded-lg bg-[#0F1923] origin-bottom" style={{ transform: `scaleY(${i === 0 ? 1 : 0})` }} />
              <span className={`relative font-display text-sm font-medium lg:pt-2 transition-colors duration-300 ${on ? 'text-propyte-brand' : 'text-[#5B6B74]'}`}>{t(`rank.${key}`)}</span>
              <div className="relative">
                <h3 className={`font-display font-semibold transition-colors duration-300 ${main ? 'text-[28px] lg:text-[clamp(30px,3.4vw,48px)] leading-[1.04] tracking-[-0.035em]' : 'text-[22px] lg:text-[clamp(24px,2.3vw,32px)] leading-[1.1] tracking-[-0.025em]'} ${on ? 'text-white' : 'text-[#13222C]'}`}>
                  {t(`${key}.title`)}
                </h3>
                <p className={`mt-3 text-[15px] lg:text-base max-w-[540px] transition-colors duration-300 ${on ? 'text-white/70' : 'text-[#5B6B74]'}`}>{t(`${key}.body`)}</p>
                {main && (
                  <div data-chips className="flex flex-wrap gap-2.5 mt-6">
                    {CRITERIA.map((c) => (
                      <span key={c} data-chip className={`text-[13px] px-3 py-1.5 rounded border transition-colors duration-300 ${on ? 'text-white border-white/25' : 'text-[#13222C] border-black/10'}`}>{t(`criteria.${c}`)}</span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
