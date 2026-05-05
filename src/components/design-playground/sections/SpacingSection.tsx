'use client';

import SliderControl from '../controls/SliderControl';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';

export default function SpacingSection() {
  const mode = useTokensStore((s) => s.mode);
  const spacing = useTokensStore((s) => s.tokens[mode].spacing);
  const layout = useTokensStore((s) => s.tokens[mode].layout);
  const sectionMargins = useTokensStore((s) => s.tokens[mode].sectionMargins);
  const setPath = useTokensStore((s) => s.setPath);
  const defS = DEFAULT_TOKENS[mode].spacing;
  const defL = DEFAULT_TOKENS[mode].layout;
  const defM = DEFAULT_TOKENS[mode].sectionMargins;

  return (
    <div>
      {/* Spacing scale */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Escala de espaciado
        </p>
        {([
          ['space0',  '0  (0px)',   '--space-0',  0,   0,   0],
          ['space1',  '1  (4px)',   '--space-1',  0,   16,  1],
          ['space2',  '2  (8px)',   '--space-2',  0,   32,  1],
          ['space4',  '4  (16px)',  '--space-4',  4,   48,  2],
          ['space8',  '8  (32px)',  '--space-8',  8,   80,  4],
          ['space16', '16 (64px)',  '--space-16', 16,  128, 8],
          ['space24', '24 (96px)',  '--space-24', 32,  192, 8],
          ['space32', '32 (128px)', '--space-32', 48,  256, 8],
          ['space48', '48 (192px)', '--space-48', 64,  320, 8],
          ['space64', '64 (256px)', '--space-64', 80,  400, 16],
        ] as const).map(([key, label, cssVar, min, max, step]) => (
          key === 'space0' ? null : (
            <SliderControl
              key={key}
              label={label}
              cssVar={cssVar}
              value={spacing[key as keyof typeof spacing]}
              defaultValue={defS[key as keyof typeof defS]}
              min={min}
              max={max}
              step={step}
              unit="px"
              onChange={(v) => setPath([mode, 'spacing', key], v)}
              onReset={() => setPath([mode, 'spacing', key], defS[key as keyof typeof defS])}
            />
          )
        ))}
      </div>

      {/* Layout */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Layout
        </p>
        <SliderControl
          label="Container max-width"
          cssVar="--container-max"
          value={layout.containerMaxWidth}
          defaultValue={defL.containerMaxWidth}
          min={640}
          max={1920}
          step={40}
          unit="px"
          onChange={(v) => setPath([mode, 'layout', 'containerMaxWidth'], v)}
          onReset={() => setPath([mode, 'layout', 'containerMaxWidth'], defL.containerMaxWidth)}
        />
        <SliderControl
          label="Container padding"
          cssVar="--container-px"
          value={layout.containerPadding}
          defaultValue={defL.containerPadding}
          min={0}
          max={80}
          step={4}
          unit="px"
          onChange={(v) => setPath([mode, 'layout', 'containerPadding'], v)}
          onReset={() => setPath([mode, 'layout', 'containerPadding'], defL.containerPadding)}
        />
        <SliderControl
          label="Grid gap"
          cssVar="--grid-gap"
          value={layout.gridGap}
          defaultValue={defL.gridGap}
          min={0}
          max={64}
          step={4}
          unit="px"
          onChange={(v) => setPath([mode, 'layout', 'gridGap'], v)}
          onReset={() => setPath([mode, 'layout', 'gridGap'], defL.gridGap)}
        />
      </div>

      {/* Section padding */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Section padding vertical
        </p>
        {([
          ['heroPaddingTop',     'Hero top',      '--section-hero-pt',     0, 200, 8],
          ['heroPaddingBottom',  'Hero bottom',   '--section-hero-pb',     0, 200, 8],
          ['contentPaddingTop',  'Content top',   '--section-content-pt',  0, 160, 8],
          ['contentPaddingBottom','Content bottom','--section-content-pb', 0, 160, 8],
          ['footerPaddingTop',   'Footer top',    '--section-footer-pt',   0, 120, 8],
          ['footerPaddingBottom','Footer bottom', '--section-footer-pb',   0, 120, 8],
        ] as const).map(([key, label, cssVar, min, max, step]) => (
          <SliderControl
            key={key}
            label={label}
            cssVar={cssVar}
            value={sectionMargins[key as keyof typeof sectionMargins]}
            defaultValue={defM[key as keyof typeof defM]}
            min={min}
            max={max}
            step={step}
            unit="px"
            onChange={(v) => setPath([mode, 'sectionMargins', key], v)}
            onReset={() => setPath([mode, 'sectionMargins', key], defM[key as keyof typeof defM])}
          />
        ))}
      </div>
    </div>
  );
}
