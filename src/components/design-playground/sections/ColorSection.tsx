'use client';

import ColorControl from '../controls/ColorControl';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';
import type { ColorTokens } from '@/types/design-tokens';

interface ColorRow {
  key: keyof ColorTokens;
  label: string;
  cssVar: string;
  group: 'brand' | 'status' | 'semantic';
  asText?: boolean;
  pairKey?: keyof ColorTokens;  // for WCAG contrast pair
}

const COLOR_ROWS: ColorRow[] = [
  { key: 'teal',         label: 'Teal (primary)',   cssVar: '--color-teal',         group: 'brand',    pairKey: 'aztec' },
  { key: 'tealDark',     label: 'Teal dark',         cssVar: '--color-teal-dark',    group: 'brand',    pairKey: 'aztec' },
  { key: 'tealA11y',     label: 'Teal A11y',         cssVar: '--color-teal-a11y',    group: 'brand',    pairKey: 'grayLight' },
  { key: 'aquaBright',   label: 'Aqua bright',       cssVar: '--color-aqua-bright',  group: 'brand',    pairKey: 'navy' },
  { key: 'navy',         label: 'Navy',              cssVar: '--color-navy',         group: 'brand',    pairKey: 'grayLight' },
  { key: 'aztec',        label: 'Aztec',             cssVar: '--color-aztec',        group: 'brand',    pairKey: 'teal' },
  { key: 'deepOnyx',     label: 'Deep onyx',         cssVar: '--color-deep-onyx',    group: 'brand',    pairKey: 'teal' },
  { key: 'graphite',     label: 'Graphite',          cssVar: '--color-graphite',     group: 'brand',    pairKey: 'grayLight' },
  { key: 'amber',        label: 'Amber',             cssVar: '--color-amber',        group: 'brand',    pairKey: 'aztec' },
  { key: 'grayLight',    label: 'Gray light',        cssVar: '--color-gray-light',   group: 'brand',    pairKey: 'navy' },
  { key: 'success',      label: 'Success',           cssVar: '--color-success',      group: 'status',   pairKey: 'background' },
  { key: 'error',        label: 'Error',             cssVar: '--color-error',        group: 'status',   pairKey: 'background' },
  { key: 'whatsapp',     label: 'WhatsApp',          cssVar: '--color-whatsapp',     group: 'status',   pairKey: 'background' },
  { key: 'whatsappDark', label: 'WhatsApp dark',     cssVar: '--color-whatsapp-dark',group: 'status',   pairKey: 'background' },
  { key: 'background',   label: 'Background',        cssVar: '--color-background',   group: 'semantic', pairKey: 'foreground' },
  { key: 'foreground',   label: 'Foreground',        cssVar: '--color-foreground',   group: 'semantic', pairKey: 'background' },
  { key: 'muted',        label: 'Muted',             cssVar: '--color-muted',        group: 'semantic', pairKey: 'foreground' },
  { key: 'border',       label: 'Border',            cssVar: '--color-border',       group: 'semantic', asText: true },
];

const GROUP_LABELS: Record<ColorRow['group'], string> = {
  brand:    'Paleta Propyte',
  status:   'Estado',
  semantic: 'Roles semánticos',
};

export default function ColorSection() {
  const mode = useTokensStore((s) => s.mode);
  const colors = useTokensStore((s) => s.tokens[mode].colors);
  const setPath = useTokensStore((s) => s.setPath);
  const defaults = DEFAULT_TOKENS[mode].colors;

  const grouped = COLOR_ROWS.reduce<Record<ColorRow['group'], ColorRow[]>>(
    (acc, row) => { acc[row.group].push(row); return acc; },
    { brand: [], status: [], semantic: [] },
  );

  return (
    <div>
      {(Object.keys(grouped) as ColorRow['group'][]).map((group) => (
        <fieldset key={group} className="mb-5">
          <legend className="text-2xs uppercase tracking-widest text-neutral-400 mb-2 font-medium">
            {GROUP_LABELS[group]}
          </legend>
          <div>
            {grouped[group].map((row) => (
              <ColorControl
                key={row.key}
                label={row.label}
                cssVar={row.cssVar}
                value={colors[row.key]}
                defaultValue={defaults[row.key]}
                pairValue={row.pairKey ? colors[row.pairKey] : undefined}
                onChange={(v) => setPath([mode, 'colors', row.key], v)}
                onReset={() => setPath([mode, 'colors', row.key], defaults[row.key])}
                asText={row.asText}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
