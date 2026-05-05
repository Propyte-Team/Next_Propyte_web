'use client';

/**
 * useApplyDesignTokens — escribe CSS vars del tema activo a document.documentElement (:root).
 *
 * Debounce 50ms para evitar thrashing al arrastrar sliders.
 * Se limpia al desmontar, restaurando los valores del CSS estático de globals.css
 * (que vuelve a ser la fuente de verdad cuando el playground no está montado).
 */

import { useEffect, useRef } from 'react';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { themeToCssVars } from '@/components/playground/lib/applyTokens';

export function useApplyDesignTokens() {
  const mode = useTokensStore((s) => s.mode);
  const theme = useTokensStore((s) => s.tokens[mode]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot of CSS var names so we can clean up on unmount.
  const appliedVarsRef = useRef<string[]>([]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const vars = themeToCssVars(theme);
      const keys = Object.keys(vars);
      appliedVarsRef.current = keys;
      for (const [k, v] of Object.entries(vars)) {
        document.documentElement.style.setProperty(k, v);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [theme]);

  // Remove inline overrides on unmount — globals.css static values take over.
  useEffect(() => {
    return () => {
      for (const k of appliedVarsRef.current) {
        document.documentElement.style.removeProperty(k);
      }
    };
  }, []);
}
