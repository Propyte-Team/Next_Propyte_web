'use client';

/**
 * PlaygroundShell — UI principal del Design Playground.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  Topbar (modo, preview, reset, dirty)           │
 *   ├──────────────┬───────────────────────────────────┤
 *   │  Panel izq   │  LivePreview                      │
 *   │  (controles) │  (componentes con CSS vars)       │
 *   └──────────────┴───────────────────────────────────┘
 *
 * Fase 1: solo ColorsPanel + LivePreview mínimo.
 * Fases siguientes: Typography, Spacing, Layout, Radii, Shadows, Export/Import.
 */

import { useState } from 'react';
import { useTokensStore } from './store/useTokensStore';
import ColorsPanel from './sections/ColorsPanel';
import LivePreview from './preview/LivePreview';

type PreviewTarget = 'components' | 'home';

export default function PlaygroundShell() {
  const mode = useTokensStore((s) => s.mode);
  const setMode = useTokensStore((s) => s.setMode);
  const dirty = useTokensStore((s) => s.dirty);
  const reset = useTokensStore((s) => s.reset);
  const [preview, setPreview] = useState<PreviewTarget>('components');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      {/* Topbar */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#5CE0D2] grid place-items-center font-bold text-[#0F1923]">
            P
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              Propyte Design Playground
            </h1>
            <p className="text-xs text-neutral-500 leading-tight">
              Edita tokens en vivo — Fase 1 (colores)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Modo light/dark */}
          <div className="flex rounded-md border border-neutral-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode('light')}
              className={`px-3 py-1.5 transition-colors ${
                mode === 'light'
                  ? 'bg-[#1A2F3F] text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
              aria-pressed={mode === 'light'}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => setMode('dark')}
              className={`px-3 py-1.5 transition-colors ${
                mode === 'dark'
                  ? 'bg-[#1A2F3F] text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
              aria-pressed={mode === 'dark'}
            >
              Oscuro
            </button>
          </div>

          {/* Preview selector */}
          <select
            value={preview}
            onChange={(e) => setPreview(e.target.value as PreviewTarget)}
            className="text-xs border border-neutral-200 rounded-md px-2 py-1.5 bg-white"
            aria-label="Qué previsualizar"
          >
            <option value="components">Componentes aislados</option>
            <option value="home">Home (próximamente)</option>
          </select>

          {dirty && (
            <span className="text-xs text-amber-600 font-medium">
              ● Sin guardar
            </span>
          )}

          <button
            type="button"
            onClick={reset}
            className="text-xs px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-100"
          >
            Resetear
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[360px_1fr] min-h-0">
        {/* Panel izquierdo: controles */}
        <aside className="border-r border-neutral-200 bg-white overflow-y-auto">
          <ColorsPanel />
        </aside>

        {/* Panel derecho: preview */}
        <section className="overflow-y-auto bg-neutral-100">
          <LivePreview target={preview} />
        </section>
      </div>
    </div>
  );
}
