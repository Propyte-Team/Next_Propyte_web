'use client';

import SliderControl from '../controls/SliderControl';
import SelectControl from '../controls/SelectControl';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';

const FONT_OPTIONS = [
  { value: '"Space Grotesk", Inter, Arial, sans-serif', label: 'Space Grotesk (default)' },
  { value: 'Inter, Arial, sans-serif',                  label: 'Inter' },
  { value: '"DM Sans", sans-serif',                     label: 'DM Sans' },
  { value: 'Poppins, sans-serif',                       label: 'Poppins' },
  { value: 'Raleway, sans-serif',                       label: 'Raleway' },
  { value: 'Montserrat, sans-serif',                    label: 'Montserrat' },
  { value: 'Lato, sans-serif',                          label: 'Lato' },
  { value: '"Open Sans", sans-serif',                   label: 'Open Sans' },
  { value: 'Nunito, sans-serif',                        label: 'Nunito' },
  { value: 'Georgia, serif',                            label: 'Georgia (serif)' },
  { value: '"Playfair Display", serif',                 label: 'Playfair Display' },
  { value: '"JetBrains Mono", monospace',               label: 'JetBrains Mono' },
];

const WEIGHT_OPTIONS = [
  { value: '300', label: '300 — Light' },
  { value: '400', label: '400 — Normal' },
  { value: '500', label: '500 — Medium' },
  { value: '600', label: '600 — Semibold' },
  { value: '700', label: '700 — Bold' },
  { value: '800', label: '800 — Extrabold' },
];

export default function TypographySection() {
  const mode = useTokensStore((s) => s.mode);
  const typo = useTokensStore((s) => s.tokens[mode].typography);
  const setPath = useTokensStore((s) => s.setPath);
  const def = DEFAULT_TOKENS[mode].typography;

  const set = (key: keyof typeof typo, val: unknown) => setPath([mode, 'typography', key], val);
  const reset = (key: keyof typeof typo) => setPath([mode, 'typography', key], def[key]);

  return (
    <div>
      {/* Font families */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Fuentes
        </p>
        <SelectControl
          label="Headings"
          cssVar="--font-heading"
          value={typo.fontFamilyHeading}
          defaultValue={def.fontFamilyHeading}
          options={FONT_OPTIONS}
          allowCustom
          onChange={(v) => set('fontFamilyHeading', v)}
          onReset={() => reset('fontFamilyHeading')}
        />
        <SelectControl
          label="Body"
          cssVar="--font-body"
          value={typo.fontFamilyBody}
          defaultValue={def.fontFamilyBody}
          options={FONT_OPTIONS}
          allowCustom
          onChange={(v) => set('fontFamilyBody', v)}
          onReset={() => reset('fontFamilyBody')}
        />
      </div>

      {/* Font scale */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Escala tipográfica
        </p>
        {([
          ['fontSizeXs',  'xs',  '--fs-xs',   8, 16],
          ['fontSizeSm',  'sm',  '--fs-sm',   10, 20],
          ['fontSizeBase','base','--fs-base',  12, 24],
          ['fontSizeLg',  'lg',  '--fs-lg',   14, 28],
          ['fontSizeXl',  'xl',  '--fs-xl',   16, 40],
          ['fontSize2xl', '2xl', '--fs-2xl',  20, 60],
          ['fontSize3xl', '3xl', '--fs-3xl',  24, 80],
        ] as const).map(([key, scale, cssVar, min, max]) => (
          <SliderControl
            key={key}
            label={`Font ${scale}`}
            cssVar={cssVar}
            value={typo[key as keyof typeof typo] as number}
            defaultValue={def[key as keyof typeof def] as number}
            min={min}
            max={max}
            step={1}
            unit="px"
            onChange={(v) => set(key as keyof typeof typo, v)}
            onReset={() => reset(key as keyof typeof typo)}
          />
        ))}
      </div>

      {/* Font weights */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Pesos
        </p>
        {([
          ['fontWeightNormal',   'Normal',   '--fw-normal'],
          ['fontWeightMedium',   'Medium',   '--fw-medium'],
          ['fontWeightSemibold', 'Semibold', '--fw-semibold'],
          ['fontWeightBold',     'Bold',     '--fw-bold'],
        ] as const).map(([key, label, cssVar]) => (
          <SelectControl
            key={key}
            label={label}
            cssVar={cssVar}
            value={String(typo[key as keyof typeof typo])}
            defaultValue={String(def[key as keyof typeof def])}
            options={WEIGHT_OPTIONS}
            onChange={(v) => set(key as keyof typeof typo, Number(v))}
            onReset={() => reset(key as keyof typeof typo)}
          />
        ))}
      </div>

      {/* Line height */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Line height
        </p>
        {([
          ['lineHeightTight',   'Tight',   '--lh-tight',   0.9, 1.5, 0.05],
          ['lineHeightNormal',  'Normal',  '--lh-normal',  1.0, 2.0, 0.05],
          ['lineHeightRelaxed', 'Relaxed', '--lh-relaxed', 1.2, 2.5, 0.05],
        ] as const).map(([key, label, cssVar, min, max, step]) => (
          <SliderControl
            key={key}
            label={label}
            cssVar={cssVar}
            value={typo[key as keyof typeof typo] as number}
            defaultValue={def[key as keyof typeof def] as number}
            min={min}
            max={max}
            step={step}
            unit=""
            onChange={(v) => set(key as keyof typeof typo, v)}
            onReset={() => reset(key as keyof typeof typo)}
          />
        ))}
      </div>

      {/* Letter spacing */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Letter spacing (em)
        </p>
        {([
          ['letterSpacingTight',  'Tight',  '--ls-tight',  -0.1, 0,    0.005],
          ['letterSpacingNormal', 'Normal', '--ls-normal', -0.05, 0.1, 0.005],
          ['letterSpacingWide',   'Wide',   '--ls-wide',    0,   0.2,  0.005],
        ] as const).map(([key, label, cssVar, min, max, step]) => (
          <SliderControl
            key={key}
            label={label}
            cssVar={cssVar}
            value={typo[key as keyof typeof typo] as number}
            defaultValue={def[key as keyof typeof def] as number}
            min={min}
            max={max}
            step={step}
            unit="em"
            onChange={(v) => set(key as keyof typeof typo, v)}
            onReset={() => reset(key as keyof typeof typo)}
          />
        ))}
      </div>
    </div>
  );
}
