'use client';

import { RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';
import type { ShadowLayer, ShadowsTokens } from '@/types/design-tokens';

type ShadowScale = keyof ShadowsTokens;

const SCALES: { key: ShadowScale; label: string; cssVar: string }[] = [
  { key: 'shadowSm', label: 'sm', cssVar: '--shadow-sm' },
  { key: 'shadowMd', label: 'md', cssVar: '--shadow-md' },
  { key: 'shadowLg', label: 'lg', cssVar: '--shadow-lg' },
  { key: 'shadowXl', label: 'xl', cssVar: '--shadow-xl' },
];

function layerToBoxShadow(l: ShadowLayer) {
  return `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`;
}

function ShadowPreview({ layers }: { layers: ShadowLayer[] }) {
  const shadow = layers.map(layerToBoxShadow).join(', ');
  return (
    <div
      className="w-10 h-10 rounded-md bg-white shrink-0"
      style={{ boxShadow: shadow || 'none' }}
    />
  );
}

interface LayerEditorProps {
  layer: ShadowLayer;
  index: number;
  total: number;
  onChange: (l: ShadowLayer) => void;
  onRemove: () => void;
}

function LayerEditor({ layer, index, total, onChange, onRemove }: LayerEditorProps) {
  const field = (key: keyof ShadowLayer, min: number, max: number, label: string) => (
    <label className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-2xs text-neutral-400">{label}</span>
      <input
        type="number"
        value={key === 'color' ? '' : layer[key] as number}
        min={min}
        max={max}
        onChange={(e) => onChange({ ...layer, [key]: Number(e.target.value) })}
        className="w-10 text-xs font-mono px-1 py-0.5 border border-neutral-200 rounded text-center focus:outline-none focus:border-neutral-400"
        aria-label={label}
      />
    </label>
  );

  return (
    <div className="flex items-end gap-1.5 mb-2">
      <span className="text-2xs text-neutral-400 w-4 shrink-0">L{index + 1}</span>
      {field('x',      -40,  40,   'X')}
      {field('y',      -40,  80,   'Y')}
      {field('blur',     0,  100,  'blur')}
      {field('spread', -20,   40,  'spread')}
      {/* Color */}
      <label className="flex flex-col items-center gap-0.5">
        <span className="text-2xs text-neutral-400">color</span>
        <input
          type="color"
          value={layer.color.startsWith('#') ? layer.color : '#000000'}
          onChange={(e) => onChange({ ...layer, color: e.target.value })}
          className="w-8 h-7 rounded border border-neutral-200 cursor-pointer"
          aria-label="Shadow color"
        />
      </label>
      {total > 1 && (
        <button
          type="button"
          onClick={onRemove}
          className="mb-0.5 p-1 text-neutral-400 hover:text-red-500 transition-colors"
          aria-label="Eliminar capa"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

export default function ShadowSection() {
  const mode = useTokensStore((s) => s.mode);
  const shadows = useTokensStore((s) => s.tokens[mode].shadows);
  const setPath = useTokensStore((s) => s.setPath);
  const def = DEFAULT_TOKENS[mode].shadows;

  const updateLayer = (scale: ShadowScale, index: number, layer: ShadowLayer) => {
    const next = [...shadows[scale]];
    next[index] = layer;
    setPath([mode, 'shadows', scale], next);
  };

  const addLayer = (scale: ShadowScale) => {
    const next = [...shadows[scale], { x: 0, y: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.08)' }];
    setPath([mode, 'shadows', scale], next);
  };

  const removeLayer = (scale: ShadowScale, index: number) => {
    const next = shadows[scale].filter((_, i) => i !== index);
    setPath([mode, 'shadows', scale], next);
  };

  const reset = (scale: ShadowScale) => {
    setPath([mode, 'shadows', scale], def[scale]);
  };

  return (
    <div>
      {SCALES.map(({ key, label, cssVar }) => {
        const layers = shadows[key];
        const isDirty = JSON.stringify(layers) !== JSON.stringify(def[key]);
        const boxShadow = layers.map(layerToBoxShadow).join(', ');

        return (
          <div key={key} className="mb-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <ShadowPreview layers={layers} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-neutral-700">Shadow {label}</span>
                  <span className="text-2xs font-mono text-neutral-400">{cssVar}</span>
                </div>
                <span className="text-2xs font-mono text-neutral-400 truncate block">
                  {boxShadow || 'none'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => reset(key)}
                className={`p-1 rounded transition-opacity ${
                  isDirty ? 'opacity-100 text-amber-500 hover:text-amber-700' : 'opacity-30 text-neutral-400'
                }`}
                aria-label={`Resetear shadow ${label}`}
                title="Resetear"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Layers */}
            <div className="pl-6">
              {layers.map((layer, i) => (
                <LayerEditor
                  key={i}
                  layer={layer}
                  index={i}
                  total={layers.length}
                  onChange={(l) => updateLayer(key, i, l)}
                  onRemove={() => removeLayer(key, i)}
                />
              ))}
              <button
                type="button"
                onClick={() => addLayer(key)}
                className="flex items-center gap-1 text-2xs text-neutral-500 hover:text-neutral-800 transition-colors mt-1"
              >
                <Plus size={11} /> Añadir capa
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
