'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

// Compartido entre el provider y `useLenisAnchor()` para que los anchor links
// usen la misma instancia y respeten el toggle de reduced-motion.
let lenisInstance: Lenis | null = null;

export function getLenis() {
  return lenisInstance;
}

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Kill switch sin redeploy: `NEXT_PUBLIC_LENIS=0` desactiva en runtime.
    if (process.env.NEXT_PUBLIC_LENIS === '0') return;

    // A11y: si el usuario prefiere reduced-motion, NO interceptamos el scroll.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });

    lenisInstance = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
