'use client';

import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface ColorControlProps {
  label: string;
  cssVar: string;
  value: string;
  defaultValue: string;
  pairValue?: string;      // For WCAG: the contrasting color (e.g. foreground on background)
  pairLabel?: string;
  onChange: (value: string) => void;
  onReset: () => void;
  asText?: boolean;        // For rgba/non-hex values — shows only text input
}

// ─── WCAG helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function WcagBadge({ ratio }: { ratio: number }) {
  const aaa = ratio >= 7;
  const aa = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
      style={{
        background: aaa ? '#dcfce7' : aa ? '#fef9c3' : aaLarge ? '#fee2e2' : '#fee2e2',
        color: aaa ? '#166534' : aa ? '#854d0e' : '#991b1b',
      }}
      title={`Contrast ratio: ${ratio.toFixed(2)}:1`}
    >
      {aaa ? 'AAA' : aa ? 'AA' : aaLarge ? 'AA lg' : 'Fail'} {ratio.toFixed(1)}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function normalizeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return '#000000';
}

export default function ColorControl({
  label,
  cssVar,
  value,
  defaultValue,
  pairValue,
  onChange,
  onReset,
  asText = false,
}: ColorControlProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const isDirty = value !== defaultValue;
  const ratio = pairValue ? contrastRatio(value, pairValue) : null;

  return (
    <div className="flex items-center gap-2 group py-1">
      {/* Color swatch + picker */}
      {!asText && (
        <label className="relative cursor-pointer shrink-0">
          <span
            className="block w-7 h-7 rounded border border-neutral-300"
            style={{ background: value }}
          />
          <input
            type="color"
            value={normalizeHex(value)}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            aria-label={`Color picker ${label}`}
          />
        </label>
      )}

      {/* Label + CSS var tooltip */}
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
          <span
            ref={tooltipRef}
            className="absolute left-0 bottom-full mb-1 z-50 px-2 py-1 text-[10px] font-mono bg-neutral-900 text-white rounded shadow-lg whitespace-nowrap pointer-events-none"
          >
            {cssVar}
          </span>
        )}
      </div>

      {/* WCAG badge */}
      {ratio !== null && <WcagBadge ratio={ratio} />}

      {/* HEX text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-mono w-24 px-2 py-1 border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
        aria-label={`Valor ${label}`}
        spellCheck={false}
      />

      {/* Reset button */}
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
