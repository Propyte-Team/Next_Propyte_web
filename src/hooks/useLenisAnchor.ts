'use client';

import { useCallback } from 'react';
import { getLenis } from '@/components/providers/SmoothScrollProvider';

/**
 * Anchor scroll que respeta Lenis si está activo. Cuando Lenis no inicializó
 * (reduced-motion o kill switch), cae al scroll nativo del browser.
 *
 * Uso:
 *   const scrollTo = useLenisAnchor();
 *   <button onClick={() => scrollTo('#section')}>Ir</button>
 */
export function useLenisAnchor() {
  return useCallback((target: string | HTMLElement, options?: { offset?: number }) => {
    const lenis = getLenis();
    const offset = options?.offset ?? 0;

    if (lenis) {
      lenis.scrollTo(target, { offset });
      return;
    }

    // Fallback nativo
    const el =
      typeof target === 'string'
        ? document.querySelector<HTMLElement>(target)
        : target;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top + offset, behavior: 'smooth' });
  }, []);
}
