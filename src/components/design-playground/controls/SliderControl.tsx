'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface SliderControlProps {
  label: string;
  cssVar: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;     // display unit label (e.g. 'px', 'rem', 'unitless')
  onChange: (value: number) => void;
  onReset: () => void;
}

export default function SliderControl({
  label,
  cssVar,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
  onReset,
}: SliderControlProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isDirty = value !== defaultValue;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="group py-1">
      <div className="flex items-center gap-2 mb-1">
        {/* Label + tooltip */}
        <div className="flex-1 min-w-0 relative">
          <button
            type="button"
            className="text-xs text-neutral-700 text-left truncate block w-full"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            tabIndex={-1}
          >
            {label}
          </button>
          {showTooltip && (
            <span className="absolute left-0 bottom-full mb-1 z-50 px-2 py-1 text-[10px] font-mono bg-neutral-900 text-white rounded shadow-lg whitespace-nowrap pointer-events-none">
              {cssVar}
            </span>
          )}
        </div>

        {/* Numeric input */}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="text-xs font-mono w-16 px-2 py-1 border border-neutral-200 rounded text-right focus:outline-none focus:border-neutral-400"
          aria-label={`Valor ${label}`}
        />
        <span className="text-[10px] text-neutral-400 w-6 shrink-0">{unit}</span>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className={`shrink-0 p-1 rounded transition-opacity ${
            isDirty
              ? 'opacity-100 text-amber-500 hover:text-amber-700'
              : 'opacity-0 group-hover:opacity-40 text-neutral-400'
          }`}
          aria-label={`Resetear ${label}`}
          title={`Resetear a ${defaultValue}${unit}`}
          tabIndex={isDirty ? 0 : -1}
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Slider */}
      <div className="relative h-4 flex items-center">
        <div className="w-full h-1.5 rounded-full bg-neutral-200 relative">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-neutral-600"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label={`Slider ${label}`}
        />
      </div>
    </div>
  );
}
