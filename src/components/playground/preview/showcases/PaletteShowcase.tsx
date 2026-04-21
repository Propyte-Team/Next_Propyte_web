'use client';

/**
 * PaletteShowcase — swatches en vivo.
 * Consume `var(--color-*)` → reflejan cambios instantáneamente.
 */

import { useTokensStore } from '../../store/useTokensStore';

const SWATCHES: Array<{ label: string; varName: string }> = [
  { label: 'Teal', varName: '--color-teal' },
  { label: 'Teal dark', varName: '--color-teal-dark' },
  { label: 'Teal a11y', varName: '--color-teal-a11y' },
  { label: 'Aqua bright', varName: '--color-aqua-bright' },
  { label: 'Navy', varName: '--color-navy' },
  { label: 'Aztec', varName: '--color-aztec' },
  { label: 'Amber', varName: '--color-amber' },
  { label: 'Graphite', varName: '--color-graphite' },
  { label: 'Gray light', varName: '--color-gray-light' },
  { label: 'Success', varName: '--color-success' },
  { label: 'Error', varName: '--color-error' },
  { label: 'WhatsApp', varName: '--color-whatsapp' },
];

export default function PaletteShowcase() {
  // Subscribe para forzar re-render al editar (CSS vars son reactive per se,
  // pero el label hex en texto sí necesita reactividad del store).
  const mode = useTokensStore((s) => s.mode);
  const colors = useTokensStore((s) => s.tokens[mode].colors);

  // Mapeo varName → key para mostrar hex del store
  const varToKey: Record<string, keyof typeof colors> = {
    '--color-teal': 'teal',
    '--color-teal-dark': 'tealDark',
    '--color-teal-a11y': 'tealA11y',
    '--color-aqua-bright': 'aquaBright',
    '--color-navy': 'navy',
    '--color-aztec': 'aztec',
    '--color-amber': 'amber',
    '--color-graphite': 'graphite',
    '--color-gray-light': 'grayLight',
    '--color-success': 'success',
    '--color-error': 'error',
    '--color-whatsapp': 'whatsapp',
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Paleta</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {SWATCHES.map((s) => (
          <div
            key={s.varName}
            className="rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div
              className="h-16"
              style={{ background: `var(${s.varName})` }}
              aria-label={`${s.label} swatch`}
            />
            <div className="p-2 text-[11px]">
              <div className="font-medium">{s.label}</div>
              <div className="font-mono opacity-70">{colors[varToKey[s.varName]]}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
