'use client';

import SliderControl from '../controls/SliderControl';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';

export default function RadiusSection() {
  const mode = useTokensStore((s) => s.mode);
  const radii = useTokensStore((s) => s.tokens[mode].radii);
  const setPath = useTokensStore((s) => s.setPath);
  const def = DEFAULT_TOKENS[mode].radii;

  const previewStyle = (r: number) => ({
    width: 48,
    height: 48,
    borderRadius: r,
    background: 'var(--color-teal, #5CE0D2)',
    display: 'inline-block' as const,
    marginRight: 8,
  });

  return (
    <div>
      {/* Live preview row */}
      <div className="flex items-end gap-2 mb-4 pb-4 border-b border-neutral-100">
        {Object.entries(radii).map(([key, r]) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span style={previewStyle(r === 9999 ? 24 : r)} />
            <span className="text-2xs text-neutral-400">{key.replace('radius', '')}</span>
          </div>
        ))}
      </div>

      {([
        ['radiusSm', 'sm', '--radius-sm',  0, 24,   1],
        ['radiusMd', 'md', '--radius-md',  0, 40,   2],
        ['radiusLg', 'lg', '--radius-lg',  0, 48,   2],
        ['radiusXl', 'xl', '--radius-xl',  0, 64,   4],
        ['radiusFull','full','--radius-full', 100, 9999, 100],
      ] as const).map(([key, label, cssVar, min, max, step]) => (
        <SliderControl
          key={key}
          label={`Radius ${label}`}
          cssVar={cssVar}
          value={radii[key as keyof typeof radii]}
          defaultValue={def[key as keyof typeof def]}
          min={min}
          max={max}
          step={step}
          unit="px"
          onChange={(v) => setPath([mode, 'radii', key], v)}
          onReset={() => setPath([mode, 'radii', key], def[key as keyof typeof def])}
        />
      ))}
    </div>
  );
}
