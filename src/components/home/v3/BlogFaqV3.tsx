'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus } from '@/lib/icons';
import { gsap, SplitText, useGSAP, MOTION_OK, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap-client';

export interface BlogItem {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  image: string | null;
  publishedAt: string | null;
  minutes: number;
}

const FAQ_KEYS = ['1', '2', '3', '4'] as const;

/**
 * Blog (#3 de Lara): una nota destacada con foto + lista "Lo más reciente" sin
 * portadas. La destacada sale de la curaduría del Hub (blog-featured) y, si no
 * hay, de la entrada más reciente. Debajo, preguntas frecuentes en acordeón con
 * los mismos textos y el mismo JSON-LD que la home anterior.
 */
export default function BlogFaqV3({ lead, latest }: { lead: BlogItem | null; latest: BlogItem[] }) {
  const t = useTranslations('homeV3.blog');
  const tf = useTranslations('homeFAQ');
  const locale = useLocale();
  const root = useRef<HTMLElement>(null);
  const [openQ, setOpenQ] = useState<number | null>(0);
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '');
  const postHref = (slug: string) => `/${locale}/blog/${slug}`;

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>('[data-split]', root.current).forEach((h) => {
        SplitText.create(h, { type: 'lines,words', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }) });
      });
      const ph = root.current?.querySelector('[data-lead-ph]');
      if (ph) {
        gsap.timeline({ scrollTrigger: { trigger: ph, start: 'top 85%', once: true } })
          .fromTo(ph, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' })
          .from(ph.querySelector('img'), { scale: 1.2, duration: 1.5, ease: 'expo.out' }, 0);
      }
      gsap.from('[data-latest]', { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '[data-latest-list]', start: 'top 88%', once: true } });
      gsap.from('[data-qa]', { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '[data-qas]', start: 'top 88%', once: true } });
    });
    // Abre la primera respuesta sin animación al montar.
    const first = root.current?.querySelector<HTMLElement>('[data-ans="0"]');
    if (first) gsap.set(first, { height: 'auto' });
    return () => mm.revert();
  }, { scope: root });

  const { contextSafe } = useGSAP({ scope: root });
  const toggle = contextSafe((i: number) => {
    const d = prefersReducedMotion() ? 0 : 0.55;
    const next = openQ === i ? null : i;
    if (openQ !== null) {
      gsap.to(`[data-ans="${openQ}"]`, { height: 0, duration: d, ease: 'power3.inOut' });
      gsap.to(`[data-ico="${openQ}"]`, { rotate: 0, duration: d, ease: 'power3.inOut' });
    }
    if (next !== null) {
      gsap.to(`[data-ans="${next}"]`, { height: 'auto', duration: d, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
      gsap.to(`[data-ico="${next}"]`, { rotate: 45, duration: d, ease: 'power3.inOut' });
    }
    setOpenQ(next);
  });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_KEYS.map((k) => ({ '@type': 'Question', name: tf(`q${k}`), acceptedAnswer: { '@type': 'Answer', text: tf(`a${k}`) } })),
  };

  return (
    <section ref={root} aria-labelledby="home-blog-title" className="px-4 lg:px-10 pt-[72px] lg:pt-36 pb-[72px] lg:pb-32">
      {(lead || latest.length > 0) && (
        <>
          <div className="flex justify-between items-end gap-6">
            <h2 id="home-blog-title" data-split className="font-display text-[36px] lg:text-[clamp(34px,4.2vw,60px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">{t('title')}</h2>
            <Link href={`/${locale}/blog`} className="hidden sm:inline font-semibold text-[15px] whitespace-nowrap">{t('all')} →</Link>
          </div>
          <div className="mt-7 lg:mt-14 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 lg:gap-[clamp(40px,5vw,72px)] items-start">
            {lead && (
              <Link href={postHref(lead.slug)} className="group block">
                <div data-lead-ph className="relative aspect-[16/10] rounded-md overflow-hidden bg-[#D9E0E3]">
                  {lead.image && <Image src={lead.image} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]" />}
                </div>
                <div className="mt-5 lg:mt-6 flex flex-wrap items-center gap-2.5 text-[13px] text-[#5B6B74]">
                  <span className="bg-[#0F1923] text-white font-semibold px-2 py-[3px] rounded">{t('featured')}</span>
                  <b className="text-[#0E7490] font-semibold">{lead.category}</b>
                  <span>{fmtDate(lead.publishedAt)} · {t('minutes', { count: lead.minutes })}</span>
                </div>
                <h3 className="mt-3 font-display text-[26px] lg:text-[clamp(28px,3vw,42px)] leading-[1.08] font-semibold tracking-[-0.03em] max-w-[680px]">{lead.title}</h3>
                {lead.excerpt && <p className="mt-3.5 text-[15px] lg:text-[17px] text-[#5B6B74] max-w-[620px]">{lead.excerpt}</p>}
              </Link>
            )}
            <div data-latest-list>
              <p data-latest className="font-display text-sm font-medium text-[#5B6B74] pb-4 border-b border-black/10">{t('latest')}</p>
              {latest.map((p) => (
                <Link key={p.slug} href={postHref(p.slug)} data-latest className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center py-5 lg:py-[22px] border-b border-black/10">
                  <span>
                    <span className="block text-[13px] text-[#5B6B74]"><b className="text-[#0E7490] font-semibold">{p.category}</b> · {fmtDate(p.publishedAt)} · {t('minutes', { count: p.minutes })}</span>
                    <span className="block mt-1.5 font-display text-lg lg:text-[21px] leading-[1.25] font-semibold tracking-[-0.015em]">{p.title}</span>
                  </span>
                  <span aria-hidden="true" className="text-xl transition-transform duration-300 group-hover:translate-x-2">→</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div id="preguntas" className="mt-16 lg:mt-[120px] pt-10 lg:pt-14 border-t border-black/10 grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-16">
        <div>
          <h3 data-split className="font-display text-[30px] lg:text-[clamp(28px,3vw,40px)] leading-[1.05] font-semibold tracking-[-0.03em]">{tf('title')}</h3>
          <p className="mt-4 text-[#5B6B74] max-w-[320px]">{t('faqLead')}</p>
          <Link href={`/${locale}/faq`} className="inline-block mt-5 font-semibold text-[#0E7490]">{t('faqAll')} →</Link>
        </div>
        <div data-qas>
          {FAQ_KEYS.map((k, i) => {
            const isOpen = openQ === i;
            return (
              <div key={k} data-qa className={`border-b border-black/10 ${i === 0 ? 'border-t' : ''}`}>
                <button
                  type="button"
                  id={`faq-q-${k}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${k}`}
                  onClick={() => toggle(i)}
                  className="w-full flex justify-between items-center gap-6 py-5 lg:py-6 text-left font-display text-[17px] lg:text-xl leading-[1.3] font-semibold tracking-[-0.015em]"
                >
                  {tf(`q${k}`)}
                  <span className={`shrink-0 w-8 h-8 rounded-full border inline-flex items-center justify-center transition-colors ${isOpen ? 'bg-[#0F1923] border-[#0F1923] text-white' : 'border-black/10'}`}>
                    <span data-ico={i} className="inline-flex" style={{ transform: i === 0 ? 'rotate(45deg)' : undefined }}><Plus size={14} /></span>
                  </span>
                </button>
                <div id={`faq-a-${k}`} role="region" aria-labelledby={`faq-q-${k}`} data-ans={i} className="h-0 overflow-hidden">
                  <p className="pb-6 pr-0 lg:pr-14 text-[15px] lg:text-base text-[#5B6B74] max-w-[760px]">{tf(`a${k}`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </section>
  );
}
