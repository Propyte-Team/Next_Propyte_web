'use client';

/**
 * useTokensStore — store Zustand con persistencia en localStorage.
 *
 * Responsabilidades:
 *   - Mantener el estado vivo de los tokens (light + dark)
 *   - Marcar `dirty=true` cuando cambia algo vs el último aplicado/importado
 *   - Persistir sesión en localStorage (clave `propyte-design-tokens-v1`)
 *   - Undo/redo stack (últimos 20 estados)
 *   - Presets nombrados guardados en localStorage
 *
 * Convención: `setPath(['light','colors','teal'], '#ff00aa')` actualiza
 * inmutablemente vía un walker. Mantiene el store pequeño y tipado end-to-end.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DesignTokens,
  ThemeMode,
  ThemeTokens,
} from '@/types/design-tokens';
import { DEFAULT_TOKENS } from '../lib/defaults';

type TokensPath = readonly (string | number)[];

export interface Preset {
  id: string;
  name: string;
  tokens: DesignTokens;
  createdAt: number;
}

interface TokensStore {
  tokens: DesignTokens;
  mode: ThemeMode;
  dirty: boolean;
  undoStack: DesignTokens[];
  redoStack: DesignTokens[];
  presets: Preset[];
  // Acciones
  setMode: (mode: ThemeMode) => void;
  setPath: (path: TokensPath, value: unknown) => void;
  setTheme: (mode: ThemeMode, theme: ThemeTokens) => void;
  replaceAll: (tokens: DesignTokens, opts?: { markClean?: boolean }) => void;
  reset: () => void;
  markClean: () => void;
  undo: () => void;
  redo: () => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
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

function pushUndo(undoStack: DesignTokens[], current: DesignTokens): DesignTokens[] {
  return [...undoStack, current].slice(-20);
}

export const useTokensStore = create<TokensStore>()(
  persist(
    (set, get) => ({
      tokens: DEFAULT_TOKENS,
      mode: 'light',
      dirty: false,
      undoStack: [],
      redoStack: [],
      presets: [],

      setMode: (mode) => set({ mode }),

      setPath: (path, value) => {
        const { tokens, undoStack } = get();
        const next = setIn(tokens, path, value);
        set({ tokens: next, dirty: true, undoStack: pushUndo(undoStack, tokens), redoStack: [] });
      },

      setTheme: (mode, theme) => {
        const { tokens, undoStack } = get();
        const next: DesignTokens = { ...tokens, [mode]: theme };
        set({ tokens: next, dirty: true, undoStack: pushUndo(undoStack, tokens), redoStack: [] });
      },

      replaceAll: (tokens, opts) => {
        const { tokens: current, undoStack } = get();
        set({
          tokens,
          dirty: !opts?.markClean,
          undoStack: pushUndo(undoStack, current),
          redoStack: [],
        });
      },

      reset: () => {
        const { tokens, undoStack } = get();
        set({ tokens: DEFAULT_TOKENS, dirty: false, undoStack: pushUndo(undoStack, tokens), redoStack: [] });
      },

      markClean: () => set({ dirty: false }),

      undo: () => {
        const { undoStack, tokens, redoStack } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        set({
          tokens: prev,
          undoStack: undoStack.slice(0, -1),
          redoStack: [tokens, ...redoStack].slice(0, 20),
          dirty: true,
        });
      },

      redo: () => {
        const { redoStack, tokens, undoStack } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[0];
        set({
          tokens: next,
          redoStack: redoStack.slice(1),
          undoStack: [...undoStack, tokens].slice(-20),
          dirty: true,
        });
      },

      savePreset: (name) => {
        const { tokens, presets } = get();
        const preset: Preset = {
          id: `preset-${Date.now()}`,
          name,
          tokens,
          createdAt: Date.now(),
        };
        set({ presets: [...presets, preset] });
      },

      loadPreset: (id) => {
        const { presets, tokens, undoStack } = get();
        const preset = presets.find((p) => p.id === id);
        if (!preset) return;
        set({ tokens: preset.tokens, dirty: true, undoStack: pushUndo(undoStack, tokens), redoStack: [] });
      },

      deletePreset: (id) => {
        const { presets } = get();
        set({ presets: presets.filter((p) => p.id !== id) });
      },
    }),
    {
      name: 'propyte-design-tokens-v1',
      // Undo/redo stacks no se persisten — parten vacíos en cada sesión.
      partialize: (state) => ({
        tokens: state.tokens,
        mode: state.mode,
        presets: state.presets,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.dirty = false;
          state.undoStack = [];
          state.redoStack = [];
        }
      },
    },
  ),
);
