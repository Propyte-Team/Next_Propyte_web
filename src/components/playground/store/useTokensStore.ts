/**
 * useTokensStore — store Zustand con persistencia en localStorage.
 *
 * Responsabilidades:
 *   - Mantener el estado vivo de los tokens (light + dark)
 *   - Marcar `dirty=true` cuando cambia algo vs el último aplicado/importado
 *   - Persistir sesión en localStorage (clave `propyte-design-tokens-v1`)
 *
 * Convención: `setPath(['light','colors','teal'], '#ff00aa')` actualiza
 * inmutablemente vía un walker. Mantiene el store pequeño y tipado end-to-end.
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DesignTokens,
  ThemeMode,
  ThemeTokens,
} from '@/types/design-tokens';
import { DEFAULT_TOKENS } from '../lib/defaults';

type TokensPath = readonly (string | number)[];

interface TokensStore {
  tokens: DesignTokens;
  mode: ThemeMode;
  dirty: boolean;
  // Acciones
  setMode: (mode: ThemeMode) => void;
  setPath: (path: TokensPath, value: unknown) => void;
  setTheme: (mode: ThemeMode, theme: ThemeTokens) => void;
  replaceAll: (tokens: DesignTokens, opts?: { markClean?: boolean }) => void;
  reset: () => void;
  markClean: () => void;
}

/** setIn inmutable minimalista — tipado permisivo por la naturaleza del walker. */
function setIn<T>(obj: T, path: TokensPath, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source = obj as any;
  const isArr = Array.isArray(source);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clone: any = isArr ? [...source] : { ...source };
  clone[head as string | number] = setIn(source?.[head as string | number], rest, value);
  return clone as T;
}

export const useTokensStore = create<TokensStore>()(
  persist(
    (set, get) => ({
      tokens: DEFAULT_TOKENS,
      mode: 'light',
      dirty: false,

      setMode: (mode) => set({ mode }),

      setPath: (path, value) => {
        const next = setIn(get().tokens, path, value);
        set({ tokens: next, dirty: true });
      },

      setTheme: (mode, theme) => {
        const next: DesignTokens = { ...get().tokens, [mode]: theme };
        set({ tokens: next, dirty: true });
      },

      replaceAll: (tokens, opts) => {
        set({ tokens, dirty: !opts?.markClean });
      },

      reset: () => {
        set({ tokens: DEFAULT_TOKENS, dirty: false });
      },

      markClean: () => set({ dirty: false }),
    }),
    {
      name: 'propyte-design-tokens-v1',
      // Solo persiste tokens + mode; dirty siempre parte en false al rehidratar.
      partialize: (state) => ({ tokens: state.tokens, mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) state.dirty = false;
      },
    },
  ),
);
