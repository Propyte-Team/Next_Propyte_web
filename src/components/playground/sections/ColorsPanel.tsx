'use client';

/**
 * ColorsPanel — color pickers para la paleta Propyte + roles semánticos.
 *
 * Cada color edita `tokens[mode].colors[key]`. Cambios → dirty=true.
 * Soporta formato hex (#rrggbb) y rgba/css para tokens `border` (transparencias).
 */

import { useTokensStore } from '../store/useTokensStore';
import type { ColorTokens } from '@/types/design-tokens';

interface ColorRow {
  key: keyof ColorTokens;
  label: string;
  group: 'brand' | 'status' | 'semantic';
  // Para valores rgba/non-hex (border) permitimos input texto
  asText?: boolean;
}

const COLOR_ROWS: ColorRow[] = [
  { key: 'teal', label: 'Teal (primary)', group: 'brand' },
  { key: 'tealDark', label: 'Teal dark', group: 'brand' },
  { key: 'tealA11y', label: 'Teal A11y', group: 'brand' },
  { key: 'aquaBright', label: 'Aqua bright', group: 'brand' },
  { key: 'navy', label: 'Navy', group: 'brand' },
  { key: 'aztec', label: 'Aztec', group: 'brand' },
  { key: 'deepOnyx', label: 'Deep onyx', group: 'brand' },
  { key: 'graphite', label: 'Graphite', group: 'brand' },
  { key: 'amber', label: 'Amber', group: 'brand' },
  { key: 'grayLight', label: 'Gray light', group: 'brand' },
  { key: 'success', label: 'Success', group: 'status' },
  { key: 'error', label: 'Error', group: 'status' },
  { key: 'whatsapp', label: 'WhatsApp', group: 'status' },
  { key: 'whatsappDark', label: 'WhatsApp dark', group: 'status' },
  { key: 'background', label: 'Background', group: 'semantic' },
  { key: 'foreground', label: 'Foreground', group: 'semantic' },
  { key: 'muted', label: 'Muted', group: 'semantic' },
  { key: 'border', label: 'Border', group: 'semantic', asText: true },
];

const GROUP_LABELS: Record<ColorRow['group'], string> = {
  brand: 'Paleta Propyte',
  status: 'Estado',
  semantic: 'Roles (aplicados al preview)',
};

export default function ColorsPanel() {
  const mode = useTokensStore((s) => s.mode);
  const colors = useTokensStore((s) => s.tokens[mode].colors);
  const setPath = useTokensStore((s) => s.setPath);

  const grouped = COLOR_ROWS.reduce<Record<ColorRow['group'], ColorRow[]>>(
    (acc, row) => {
      acc[row.group] = acc[row.group] || [];
      acc[row.group].push(row);
      return acc;
    },
    { brand: [], status: [], semantic: [] },
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-neutral-800">Colores</h2>
        <span className="text-2xs uppercase tracking-wide text-neutral-500">
          Tema: {mode === 'light' ? 'claro' : 'oscuro'}
        </span>
      </div>

      {(Object.keys(grouped) as ColorRow['group'][]).map((group) => (
        <fieldset key={group} className="mb-6">
          <legend className="text-2xs uppercase tracking-wide text-neutral-500 mb-2">
            {GROUP_LABELS[group]}
          </legend>
          <div className="space-y-2">
            {grouped[group].map((row) => {
              const value = colors[row.key];
              const id = `color-${String(row.key)}-${mode}`;
              return (
                <div key={row.key} className="flex items-center gap-2">
                  <label
                    htmlFor={id}
                    className="text-xs text-neutral-700 flex-1 min-w-0 truncate"
                  >
                    {row.label}
                  </label>
                  {!row.asText && (
                    <input
                      id={id}
                      type="color"
                      value={normalizeHex(value)}
                      onChange={(e) =>
                        setPath([mode, 'colors', row.key], e.target.value)
                      }
                      className="w-8 h-8 rounded border border-neutral-200 cursor-pointer"
                      aria-label={`Color picker ${row.label}`}
                    />
                  )}
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setPath([mode, 'colors', row.key], e.target.value)
                    }
                    className="text-xs font-mono w-28 px-2 py-1 border border-neutral-200 rounded"
                    aria-label={`Valor ${row.label}`}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/**
 * Los `<input type="color">` requieren `#rrggbb`. Si el valor trae alpha/rgba
 * (ej. border rgba(0,0,0,0.08)) devolvemos un fallback neutro para el picker;
 * el input de texto sigue siendo editable con el valor completo.
 */
function normalizeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return '#000000';
}
