'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap-client';
import { getLenis } from '@/components/providers/SmoothScrollProvider';

/**
 * El sitio desplaza con Lenis; ScrollTrigger necesita enterarse de cada paso
 * para que las animaciones atadas al scroll no se queden atrás. El provider de
 * Lenis monta su efecto después que los hijos, así que se espera un frame.
 */
export default function GsapLenisSync() {
  useEffect(() => {
    let lenis = getLenis();
    let raf = 0;
    const onScroll = () => ScrollTrigger.update();
    const attach = () => {
      lenis = getLenis();
      if (lenis) {
        lenis.on('scroll', onScroll);
        ScrollTrigger.refresh();
      }
    };
    if (lenis) attach();
    else raf = requestAnimationFrame(attach);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.off('scroll', onScroll);
      window.removeEventListener('load', onLoad);
    };
  }, []);
  return null;
}
