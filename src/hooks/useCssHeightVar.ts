'use client';

import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Mide el alto real (offsetHeight) del elemento referenciado y lo publica
 * como CSS custom property en <html>. Cualquier padding que dependa de ese
 * alto debe leer la variable (ej. `pt-[var(--mobile-header-height,_122px)]`)
 * en vez de un valor fijo calculado a mano — así queda sincronizado aunque
 * cambien los paddings/alturas del elemento medido, sin tocar nada más.
 */
export function useCssHeightVar(ref: RefObject<HTMLElement | null>, varName: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function setVar() {
      if (el) {
        document.documentElement.style.setProperty(varName, `${el.offsetHeight}px`);
      }
    }

    setVar();

    const observer = new ResizeObserver(setVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, varName]);
}
