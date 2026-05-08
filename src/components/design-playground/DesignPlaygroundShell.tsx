'use client';

import { useState } from 'react';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { useApplyDesignTokens } from '@/hooks/useApplyDesignTokens';
import ControlPanel from './ControlPanel';
import PreviewFrame, { type DeviceSize } from './PreviewFrame';
import ExportImport from './ExportImport';

export default function DesignPlaygroundShell() {
  const mode = useTokensStore((s) => s.mode);
  const setMode = useTokensStore((s) => s.setMode);
  const dirty = useTokensStore((s) => s.dirty);
  const reset = useTokensStore((s) => s.reset);
  const undo = useTokensStore((s) => s.undo);
  const redo = useTokensStore((s) => s.redo);
  const undoStack = useTokensStore((s) => s.undoStack);
  const redoStack = useTokensStore((s) => s.redoStack);

  const [device, setDevice] = useState<DeviceSize>('desktop');
  const [inspected, setInspected] = useState<{ category: string; label: string } | null>(null);

  // Writes active theme tokens to :root with 50ms debounce.
  useApplyDesignTokens();

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div className="h-screen flex flex-col bg-neutral-50 text-neutral-900 overflow-hidden">
      {/* ─── Topbar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-neutral-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-7 h-7 rounded-md bg-[#5CE0D2] grid place-items-center font-bold text-[#0F1923] text-sm shrink-0">
            P
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold leading-tight">Design Playground</h1>
            <p className="text-2xs text-neutral-400 leading-tight">Propyte — tokens en vivo</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo/Redo */}
          <div className="flex rounded-md border border-neutral-200 overflow-hidden">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 disabled:opacity-30 transition-colors border-r border-neutral-200"
              aria-label="Deshacer"
              title={`Deshacer (${undoStack.length} pasos)`}
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 disabled:opacity-30 transition-colors"
              aria-label="Rehacer"
              title={`Rehacer (${redoStack.length} pasos)`}
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-md border border-neutral-200 overflow-hidden text-xs">
            {(['light', 'dark'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 transition-colors ${
                  mode === m
                    ? 'bg-[#1A2F3F] text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                aria-pressed={mode === m}
              >
                {m === 'light' ? 'Claro' : 'Oscuro'}
              </button>
            ))}
          </div>

          {/* Export / Import / Presets */}
          <ExportImport />

          {/* Dirty indicator */}
          {dirty && (
            <span className="text-2xs text-amber-600 font-medium">● Sin guardar</span>
          )}

          {/* Reset all */}
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 transition-colors"
            title="Resetear todos los tokens a los valores por defecto"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </header>

      {/* ─── Body: 40% panel + 60% preview ─────────────────── */}
      <div className="flex-1 grid grid-cols-[400px_1fr] min-h-0 overflow-hidden">
        {/* Left: controls */}
        <aside className="border-r border-neutral-200 bg-white overflow-hidden flex flex-col">
          <ControlPanel
            forceOpen={inspected?.category ?? null}
            forceOpenLabel={inspected?.label ?? ''}
            onForceOpenHandled={() => setInspected(null)}
          />
        </aside>

        {/* Right: preview */}
        <section className="overflow-hidden flex flex-col">
          <PreviewFrame
            device={device}
            onDeviceChange={setDevice}
            onInspect={(category, label) => setInspected({ category, label })}
          />
        </section>
      </div>
    </div>
  );
}
