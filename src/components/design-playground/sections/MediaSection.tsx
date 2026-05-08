'use client';

import SliderControl from '../controls/SliderControl';
import SelectControl from '../controls/SelectControl';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';

const ASPECT_OPTIONS = [
  { value: '1/1',   label: '1:1 — Square' },
  { value: '4/3',   label: '4:3 — Classic' },
  { value: '3/2',   label: '3:2' },
  { value: '16/9',  label: '16:9 — Widescreen' },
  { value: '21/9',  label: '21:9 — Ultrawide' },
  { value: '3/4',   label: '3:4 — Portrait' },
  { value: '2/3',   label: '2:3 — Portrait tall' },
  { value: '9/16',  label: '9:16 — Story' },
];

const OBJECT_FIT_OPTIONS = [
  { value: 'cover',   label: 'cover' },
  { value: 'contain', label: 'contain' },
  { value: 'fill',    label: 'fill' },
];

export default function MediaSection() {
  const mode = useTokensStore((s) => s.mode);
  const media = useTokensStore((s) => s.tokens[mode].media);
  const setPath = useTokensStore((s) => s.setPath);
  const def = DEFAULT_TOKENS[mode].media;

  const set = (key: keyof typeof media, val: unknown) =>
    setPath([mode, 'media', key], val);
  const reset = (key: keyof typeof media) =>
    setPath([mode, 'media', key], def[key as keyof typeof def]);

  return (
    <div>
      {/* Aspect ratios */}
      <div className="mb-5">
        <p className="text-2xs uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Aspect ratios
        </p>
        <SelectControl
          label="Card"
          cssVar="--media-aspect-card"
          value={media.aspectRatioCard}
          defaultValue={def.aspectRatioCard}
          options={ASPECT_OPTIONS}
          onChange={(v) => set('aspectRatioCard', v)}
          onReset={() => reset('aspectRatioCard')}
        />
        <SelectControl
          label="Hero"
          cssVar="--media-aspect-hero"
          value={media.aspectRatioHero}
          defaultValue={def.aspectRatioHero}
          options={ASPECT_OPTIONS}
          onChange={(v) => set('aspectRatioHero', v)}
          onReset={() => reset('aspectRatioHero')}
        />
        <SelectControl
          label="Square"
          cssVar="--media-aspect-square"
          value={media.aspectRatioSquare}
          defaultValue={def.aspectRatioSquare}
          options={ASPECT_OPTIONS}
          onChange={(v) => set('aspectRatioSquare', v)}
          onReset={() => reset('aspectRatioSquare')}
        />
        <SelectControl
          label="Portrait"
          cssVar="--media-aspect-portrait"
          value={media.aspectRatioPortrait}
          defaultValue={def.aspectRatioPortrait}
          options={ASPECT_OPTIONS}
          onChange={(v) => set('aspectRatioPortrait', v)}
          onReset={() => reset('aspectRatioPortrait')}
        />
      </div>

      {/* Object fit */}
      <div className="mb-5">
        <p className="text-2xs uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Object fit
        </p>
        <SelectControl
          label="Image object-fit"
          cssVar="--media-object-fit"
          value={media.imageObjectFit}
          defaultValue={def.imageObjectFit}
          options={OBJECT_FIT_OPTIONS}
          onChange={(v) => set('imageObjectFit', v as 'cover' | 'contain' | 'fill')}
          onReset={() => reset('imageObjectFit')}
        />
      </div>

      {/* Radii + heights */}
      <div>
        <p className="text-2xs uppercase tracking-widest text-neutral-400 mb-2 font-medium">
          Dimensiones de imagen
        </p>
        <SliderControl
          label="Border radius (imágenes)"
          cssVar="--media-image-radius"
          value={media.imageBorderRadius}
          defaultValue={def.imageBorderRadius}
          min={0}
          max={32}
          step={1}
          unit="px"
          onChange={(v) => set('imageBorderRadius', v)}
          onReset={() => reset('imageBorderRadius')}
        />
        <SliderControl
          label="Card image height"
          cssVar="--media-card-image-height"
          value={media.cardImageHeight}
          defaultValue={def.cardImageHeight}
          min={120}
          max={400}
          step={8}
          unit="px"
          onChange={(v) => set('cardImageHeight', v)}
          onReset={() => reset('cardImageHeight')}
        />
      </div>

      {/* Live preview */}
      <div className="mt-5 pt-4 border-t border-neutral-100">
        <p className="text-2xs uppercase tracking-widest text-neutral-400 mb-3 font-medium">
          Preview
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['card', 'hero', 'square', 'portrait'] as const).map((type) => {
            const ar = type === 'card' ? media.aspectRatioCard
              : type === 'hero' ? media.aspectRatioHero
              : type === 'square' ? media.aspectRatioSquare
              : media.aspectRatioPortrait;
            return (
              <div key={type}>
                <div
                  className="w-full rounded overflow-hidden bg-neutral-200"
                  style={{
                    aspectRatio: ar,
                    borderRadius: media.imageBorderRadius,
                  }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-navy, #1A2F3F), var(--color-teal, #5CE0D2))',
                      objectFit: media.imageObjectFit,
                    }}
                  />
                </div>
                <p className="text-2xs text-neutral-400 mt-1 text-center">{type} {ar}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
