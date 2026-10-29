'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from '@/lib/icons';
import { gsap, SplitText, useGSAP, MOTION_OK, prefersReducedMotion } from '@/lib/gsap-client';
import type { HeroSlide } from './types';

const SLIDE_SECS = 6;
type Tab = 'desarrollos' | 'propiedades';

/**
 * Hero v3: rota solo fotos de desarrollos destacados (comentario #2 de Lara),
 * con degradado del aztec de marca para asegurar contraste del texto blanco
 * (#6; medido ≥5.3:1 en el prototipo) y recorte por punto focal que funciona
 * vertical y horizontal (#4). Barras de avance + pausa como control.
 */
export default function HeroV3({ slides }: { slides: HeroSlide[] }) {
  const t = useTranslations('homeV3.hero');
  const locale = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('desarrollos');
  const [query, setQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const state = useRef({
    current: 0,
    progress: null as gsap.core.Tween | null,
    userPaused: false,
    offscreen: false,
    go: null as ((i: number) => void) | null,
    sync: null as (() => void) | null,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    const qs = params.toString();
    router.push(`/${locale}/${tab}${qs ? `?${qs}` : ''}`);
  }

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    const imgs = gsap.utils.toArray<HTMLElement>('[data-slide]', el);
    const fills = gsap.utils.toArray<HTMLElement>('[data-fill]', el);
    const reduce = prefersReducedMotion();
    const s = state.current;
    gsap.set(imgs, { autoAlpha: (i: number) => (i === 0 ? 1 : 0) });

    const syncPause = () => {
      const p = s.userPaused || s.offscreen || document.hidden;
      if (!s.progress) return;
      if (p) s.progress.pause();
      else s.progress.resume();
    };
    const go = (i: number, first = false) => {
      const prev = s.current;
      s.current = i;
      const d = first || reduce ? 0 : 1.1;
      if (!first && prev !== i) {
        gsap.to(imgs[prev], { autoAlpha: 0, duration: d, ease: 'power2.inOut' });
        gsap.fromTo(imgs[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power2.inOut' });
      }
      if (!reduce) {
        gsap.fromTo(imgs[i].querySelector('img'), { scale: 1.12, xPercent: i % 2 ? 1.5 : -1.5 }, { scale: 1, xPercent: 0, duration: SLIDE_SECS + 1.5, ease: 'none', overwrite: true });
      }
      fills.forEach((f, j) => gsap.set(f, { scaleX: j < i ? 1 : 0 }));
      s.progress?.kill();
      if (imgs.length > 1) {
        s.progress = gsap.fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: SLIDE_SECS, ease: 'none', onComplete: () => go((i + 1) % imgs.length) });
        syncPause();
      }
    };
    go(0, true);
    s.go = go;
    s.sync = syncPause;

    const onVis = () => syncPause();
    document.addEventListener('visibilitychange', onVis);
    const io = new IntersectionObserver(([entry]) => { s.offscreen = !entry.isIntersecting; syncPause(); });
    io.observe(el);

    const mm = gsap.matchMedia();
    // El titular arranca oculto (clase `invisible`) para que la entrada por palabras
    // no parpadee; con movimiento reducido se muestra tal cual.
    mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set(el.querySelector('h1'), { autoAlpha: 1 }); });
    mm.add(MOTION_OK, () => {
      gsap.from('[data-slides]', { scale: 1.15, duration: 2.4, ease: 'expo.out' });
      document.fonts.ready.then(() => {
        const h1 = el.querySelector('h1');
        if (h1) {
          gsap.set(h1, { autoAlpha: 1 });
          SplitText.create(h1, {
            type: 'lines,words', mask: 'lines', autoSplit: true,
            onSplit: (self) => gsap.from(self.words, { yPercent: 115, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.2 }),
          });
        }
        gsap.timeline({ delay: 0.45 })
          .from('[data-hero-sub]', { autoAlpha: 0, y: 20, duration: 0.8, ease: 'power3.out' })
          .from('[data-hero-search]', { autoAlpha: 0, y: 30, scale: 0.97, duration: 0.9, ease: 'back.out(1.4)' }, '<0.1')
          .from('[data-hero-ctrl]', { autoAlpha: 0, x: 30, duration: 0.8, ease: 'power3.out' }, '<0.1');
      });
      gsap.to('[data-slides]', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('[data-hero-in]', { y: -80, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: el, start: 'center center', end: 'bottom top', scrub: true } });
    });

    // Píldora deslizante del selector Desarrollos / Propiedades.
    const placePill = () => {
      const btn = segRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (btn && pillRef.current) gsap.set(pillRef.current, { x: btn.offsetLeft - 4, width: btn.offsetWidth });
    };
    document.fonts.ready.then(placePill);
    window.addEventListener('resize', placePill);

    return () => {
      s.progress?.kill();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', placePill);
      mm.revert();
    };
  }, { scope: root, dependencies: [slides.length] });

  // Manejadores de eventos: leen refs solo al hacer clic, nunca durante el render.
  const jump = (i: number) => state.current.go?.(i);
  const togglePause = () => {
    state.current.userPaused = !state.current.userPaused;
    setPaused(state.current.userPaused);
    state.current.sync?.();
  };
  const pickTab = (next: Tab, btn: HTMLButtonElement) => {
    setTab(next);
    if (pillRef.current) gsap.to(pillRef.current, { x: btn.offsetLeft - 4, width: btn.offsetWidth, duration: prefersReducedMotion() ? 0 : 0.45, ease: 'power3.inOut' });
  };

  return (
    <section ref={root} className="relative flex flex-col justify-end min-h-[clamp(640px,100svh,980px)] overflow-hidden bg-[#0F1923] text-white" aria-label={t('aria')}>
      <div data-slides className="absolute inset-x-0 -top-[6%] bottom-0 will-change-transform" aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.src} data-slide className="absolute inset-0" style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}>
            <Image src={s.src} alt="" fill priority={i === 0} sizes="(orientation: portrait) 240vw, 100vw" className="object-cover" style={{ objectPosition: '50% 55%' }} />
          </div>
        ))}
      </div>
      {/* #6 · degradado del aztec de marca: abajo (texto), izquierda (titular) y arriba (nav). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(0deg,rgba(15,25,35,.94) 0%,rgba(15,25,35,.78) 24%,rgba(15,25,35,.34) 52%,rgba(15,25,35,0) 72%),' +
            'linear-gradient(90deg,rgba(15,25,35,.62) 0%,rgba(15,25,35,.28) 42%,rgba(15,25,35,0) 68%),' +
            'linear-gradient(180deg,rgba(15,25,35,.5) 0%,rgba(15,25,35,0) 20%)',
        }}
      />
      <div data-hero-in className="relative px-4 lg:px-10 pt-28 lg:pt-36 pb-6 lg:pb-10 flex flex-col gap-7 lg:gap-10">
        <div className="max-w-[900px]">
          <h1 className="invisible font-display text-[52px] sm:text-[clamp(52px,8vw,116px)] leading-[0.9] font-bold tracking-[-0.045em] text-balance">
            {t('title')}
          </h1>
          <p data-hero-sub className="mt-4 lg:mt-7 text-[17px] lg:text-[clamp(17px,1.5vw,21px)] leading-[1.45] text-white/85 max-w-[560px]">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-10">
          <form
            data-hero-search
            role="search"
            onSubmit={onSubmit}
            className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0 bg-white text-[#13222C] rounded-[18px] lg:rounded-[20px] p-1.5 lg:p-2.5 lg:h-[76px] w-full lg:w-[min(880px,100%)]"
          >
            <div ref={segRef} className="relative flex bg-[#F4F6F8] rounded-xl lg:rounded-[14px] p-1 shrink-0">
              <span ref={pillRef} aria-hidden="true" className="absolute top-1 bottom-1 left-1 rounded-[10px] lg:rounded-[11px] bg-white shadow-sm" />
              {(['desarrollos', 'propiedades'] as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={tab === key}
                  onClick={(e) => pickTab(key, e.currentTarget)}
                  className={`relative flex-1 lg:flex-none px-5 py-2.5 lg:h-12 rounded-[10px] text-sm lg:text-[15px] font-semibold transition-colors ${tab === key ? 'text-[#13222C]' : 'text-[#5B6B74]'}`}
                >
                  {t(key === 'desarrollos' ? 'tabDevelopments' : 'tabProperties')}
                </button>
              ))}
            </div>
            <div className="flex items-center flex-1 min-w-0 h-[52px] lg:h-auto">
              <label htmlFor="home-search" className="sr-only">{t('searchLabel')}</label>
              <input
                id="home-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('placeholder')}
                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent outline-none px-3 lg:px-6 text-base lg:text-[17px] placeholder:text-[#7A8990]"
              />
              <button type="submit" aria-label={t('searchLabel')} className="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-[14px] bg-[#0F1923] text-white inline-flex items-center justify-center">
                <Search size={22} />
              </button>
            </div>
          </form>
          {slides.length > 1 && (
            <div data-hero-ctrl role="group" aria-label={t('photosLabel')} className="flex items-center gap-2 lg:w-[280px] shrink-0">
              {slides.map((s, i) => (
                <button key={s.src} type="button" onClick={() => jump(i)} aria-label={t('photoN', { n: i + 1, total: slides.length, name: s.name })} className="flex-1 h-5 flex items-center">
                  <i className="block w-full h-0.5 bg-white/30 relative overflow-hidden">
                    <b data-fill className="absolute inset-0 bg-propyte-brand origin-left scale-x-0" />
                  </i>
                </button>
              ))}
              <button type="button" onClick={togglePause} aria-label={paused ? t('play') : t('pause')} className="ml-1 shrink-0 w-7 h-7 rounded-full border border-white/35 inline-flex items-center justify-center">
                {paused ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="#fff" aria-hidden="true"><path d="M2 1l7 4-7 4z" /></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="#fff" aria-hidden="true"><rect x="1" y="1" width="3" height="8" /><rect x="6" y="1" width="3" height="8" /></svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
