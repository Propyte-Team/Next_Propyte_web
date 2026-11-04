'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { gsap, useGSAP, MOTION_OK } from '@/lib/gsap-client';

export interface PartnerBand {
  key: string;
  who: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  image: string | null;
}

/** Desarrolladores y brokers: dos franjas de foto a sangre con parallax. */
export default function PartnersV3({ bands }: { bands: PartnerBand[] }) {
  const t = useTranslations('homeV3.partners');
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>('[data-band]', root.current).forEach((b) => {
        const img = b.querySelector('img');
        if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.from(b.querySelector('[data-tx]'), { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 80%', once: true } });
      });
    });
    return () => mm.revert();
  }, { scope: root });

  if (bands.length === 0) return null;
  return (
    <section ref={root} aria-label={t('aria')} className="grid lg:grid-cols-2">
      {bands.map((b) => (
        <Link key={b.key} href={b.href} data-band className="group relative isolate block min-h-[480px] lg:min-h-[640px] overflow-hidden text-white bg-[#0F1923]">
          {b.image && (
            <span className="absolute inset-x-0 -top-[8%] h-[116%] -z-20">
              <Image src={b.image} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105" />
            </span>
          )}
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(15,25,35,.94)_0%,rgba(15,25,35,.6)_42%,rgba(15,25,35,.08)_78%)]" />
          <span data-tx className="absolute left-6 right-6 bottom-8 lg:left-16 lg:right-16 lg:bottom-[72px]">
            <span className="block text-[15px] text-white/75">{b.who}</span>
            <span className="block mt-3 font-display text-[32px] lg:text-[clamp(32px,3.6vw,54px)] leading-[1.02] font-semibold tracking-[-0.035em] max-w-[540px]">{b.title}</span>
            <span className="block mt-4 text-[15px] lg:text-[17px] text-white/80 max-w-[460px]">{b.body}</span>
            <span className="inline-flex items-center gap-2.5 mt-7 font-semibold text-propyte-brand">
              {b.cta} <i className="not-italic inline-block transition-transform duration-300 group-hover:translate-x-2">→</i>
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
