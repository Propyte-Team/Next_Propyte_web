'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectControlProps {
  label: string;
  cssVar: string;
  value: string;
  defaultValue: string;
  options: SelectOption[];
  allowCustom?: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}

export default function SelectControl({
  label,
  cssVar,
  value,
  defaultValue,
  options,
  allowCustom = false,
  onChange,
  onReset,
}: SelectControlProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isDirty = value !== defaultValue;
  const isCustom = allowCustom && !options.some((o) => o.value === value);

  return (
    <div className="flex items-center gap-2 group py-1">
      {/* Label */}
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

      {/* Select */}
      <select
        value={isCustom ? '__custom__' : value}
        onChange={(e) => {
          if (e.target.value !== '__custom__') onChange(e.target.value);
        }}
        className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-neutral-400 max-w-[160px] truncate"
        aria-label={`Seleccionar ${label}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {allowCustom && <option value="__custom__">Custom…</option>}
      </select>

      {/* Custom text input when no preset matches */}
      {isCustom && allowCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-mono w-32 px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:border-neutral-400"
          placeholder="font-family…"
          aria-label={`Valor custom ${label}`}
          spellCheck={false}
        />
      )}

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
        title={`Resetear a ${defaultValue}`}
        tabIndex={isDirty ? 0 : -1}
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
}
