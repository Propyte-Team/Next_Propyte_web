'use client';

/**
 * QuickEditPanel — opciones visuales contextuales que aparecen al hacer click
 * con el Inspector. Muestra 4-6 presets del tipo de elemento clickeado.
 * Cambia tokens directamente con un click — sin sliders ni inputs.
 */

import { X } from 'lucide-react';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { DEFAULT_TOKENS } from '@/components/playground/lib/defaults';

interface QuickEditPanelProps {
  category: string;
  label: string;
  onClose: () => void;
}

// ─── Typography presets ───────────────────────────────────────────────────────
function TypographyQuick() {
  const mode = useTokensStore((s) => s.mode);
  const typo = useTokensStore((s) => s.tokens[mode].typography);
  const setPath = useTokensStore((s) => s.setPath);

  const sizes = [
    { label: 'Compact', base: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28 },
    { label: 'Normal',  base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36 },
    { label: 'Large',   base: 18, lg: 20, xl: 26, '2xl': 34, '3xl': 44 },
    { label: 'XLarge',  base: 20, lg: 24, xl: 30, '2xl': 40, '3xl': 52 },
  ];

  const weights = [
    { label: 'Light',    heading: 300, body: 300 },
    { label: 'Normal',   heading: 600, body: 400 },
    { label: 'Bold',     heading: 700, body: 500 },
    { label: 'Heavy',    heading: 800, body: 600 },
  ];

  const fonts = [
    { label: 'Space Grotesk', value: '"Space Grotesk", sans-serif' },
    { label: 'Inter',          value: 'Inter, sans-serif' },
    { label: 'DM Sans',        value: '"DM Sans", sans-serif' },
    { label: 'Poppins',        value: 'Poppins, sans-serif' },
    { label: 'Raleway',        value: 'Raleway, sans-serif' },
    { label: 'Montserrat',     value: 'Montserrat, sans-serif' },
  ];

  const currentBase = typo.fontSizeBase;
  const currentHeading = typo.fontFamilyHeading;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">Tamaño</p>
        <div className="grid grid-cols-4 gap-1.5">
          {sizes.map((s) => {
            const active = currentBase === s.base;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setPath([mode, 'typography', 'fontSizeBase'], s.base);
                  setPath([mode, 'typography', 'fontSizeLg'],   s.lg);
                  setPath([mode, 'typography', 'fontSizeXl'],   s.xl);
                  setPath([mode, 'typography', 'fontSize2xl'],  s['2xl']);
                  setPath([mode, 'typography', 'fontSize3xl'],  s['3xl']);
                }}
                className={`py-2 rounded-md text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span style={{ fontSize: Math.max(9, s.base * 0.55) }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">Fuente</p>
        <div className="grid grid-cols-2 gap-1.5">
          {fonts.map((f) => {
            const active = currentHeading.includes(f.label);
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setPath([mode, 'typography', 'fontFamilyHeading'], f.value);
                  setPath([mode, 'typography', 'fontFamilyBody'],    f.value);
                }}
                style={{ fontFamily: f.value }}
                className={`py-2 px-3 rounded-md text-sm border transition-colors text-left ${
                  active
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">Peso</p>
        <div className="grid grid-cols-4 gap-1.5">
          {weights.map((w) => {
            const active = typo.fontWeightBold === w.heading;
            return (
              <button
                key={w.label}
                type="button"
                onClick={() => {
                  setPath([mode, 'typography', 'fontWeightBold'],     w.heading);
                  setPath([mode, 'typography', 'fontWeightSemibold'], Math.max(400, w.heading - 100));
                  setPath([mode, 'typography', 'fontWeightNormal'],   w.body);
                }}
                style={{ fontWeight: w.heading }}
                className={`py-2 rounded-md text-xs border transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Colors presets ───────────────────────────────────────────────────────────
function ColorsQuick() {
  const mode = useTokensStore((s) => s.mode);
  const colors = useTokensStore((s) => s.tokens[mode].colors);
  const setPath = useTokensStore((s) => s.setPath);

  const palettes = [
    {
      label: 'Propyte (default)',
      teal: '#5CE0D2', navy: '#1A2F3F', aztec: '#0F1923', amber: '#F5A623',
    },
    {
      label: 'Ocean',
      teal: '#0EA5E9', navy: '#0C4A6E', aztec: '#082F49', amber: '#F59E0B',
    },
    {
      label: 'Forest',
      teal: '#10B981', navy: '#064E3B', aztec: '#022C22', amber: '#D97706',
    },
    {
      label: 'Luxury',
      teal: '#A78BFA', navy: '#1E1B4B', aztec: '#0F0A2E', amber: '#F59E0B',
    },
    {
      label: 'Coral',
      teal: '#FB7185', navy: '#881337', aztec: '#4C0519', amber: '#FBBF24',
    },
    {
      label: 'Slate',
      teal: '#64748B', navy: '#1E293B', aztec: '#0F172A', amber: '#EAB308',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">Paletas preset</p>
        <div className="grid grid-cols-2 gap-2">
          {palettes.map((p) => {
            const active = colors.teal === p.teal;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPath([mode, 'colors', 'teal'],     p.teal);
                  setPath([mode, 'colors', 'tealDark'], p.teal + 'cc');
                  setPath([mode, 'colors', 'navy'],     p.navy);
                  setPath([mode, 'colors', 'aztec'],    p.aztec);
                  setPath([mode, 'colors', 'amber'],    p.amber);
                }}
                className={`p-2 rounded-md border transition-colors text-left ${
                  active ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex gap-1 mb-1.5">
                  {[p.teal, p.navy, p.aztec, p.amber].map((c) => (
                    <span key={c} className="flex-1 h-4 rounded" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-[11px] text-neutral-600">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">Colores individuales</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['teal',       'Primary',    '--color-teal'],
            ['navy',       'Navy',       '--color-navy'],
            ['amber',      'Accent',     '--color-amber'],
            ['background', 'Background', '--color-background'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 p-2 rounded-md border border-neutral-200 cursor-pointer hover:bg-neutral-50">
              <span className="relative w-6 h-6 rounded border border-neutral-200 shrink-0 overflow-hidden">
                <span className="block w-full h-full" style={{ background: colors[key] }} />
                <input
                  type="color"
                  value={colors[key].startsWith('#') ? colors[key] : '#000000'}
                  onChange={(e) => setPath([mode, 'colors', key], e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </span>
              <span className="text-xs text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Radii presets ────────────────────────────────────────────────────────────
function RadiiQuick() {
  const mode = useTokensStore((s) => s.mode);
  const radii = useTokensStore((s) => s.tokens[mode].radii);
  const setPath = useTokensStore((s) => s.setPath);
  const def = DEFAULT_TOKENS[mode].radii;

  const presets = [
    { label: 'Sharp',   sm: 0,  md: 0,  lg: 0,  xl: 0,  full: 0 },
    { label: 'Subtle',  sm: 2,  md: 4,  lg: 6,  xl: 8,  full: 9999 },
    { label: 'Rounded', sm: 4,  md: 8,  lg: 12, xl: 16, full: 9999 },
    { label: 'Soft',    sm: 8,  md: 12, lg: 20, xl: 28, full: 9999 },
    { label: 'Bubbly',  sm: 12, md: 16, lg: 24, xl: 32, full: 9999 },
    { label: 'Default', ...def },
  ];

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3 font-medium">Forma de las esquinas</p>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((p) => {
          const active = radii.radiusLg === p.lg;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setPath([mode, 'radii', 'radiusSm'],  p.sm);
                setPath([mode, 'radii', 'radiusMd'],  p.md);
                setPath([mode, 'radii', 'radiusLg'],  p.lg);
                setPath([mode, 'radii', 'radiusXl'],  p.xl);
                setPath([mode, 'radii', 'radiusFull'], p.full);
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-colors ${
                active ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <span
                className="w-9 h-9 bg-neutral-800"
                style={{ borderRadius: p.lg }}
              />
              <span className="text-[11px] text-neutral-600">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shadows presets ──────────────────────────────────────────────────────────
function ShadowsQuick() {
  const mode = useTokensStore((s) => s.mode);
  const setPath = useTokensStore((s) => s.setPath);

  const presets = [
    {
      label: 'None',
      sm: [],
      md: [],
      lg: [],
      xl: [],
    },
    {
      label: 'Subtle',
      sm: [{ x:0, y:1, blur:2,  spread:0, color:'rgba(0,0,0,0.04)' }],
      md: [{ x:0, y:1, blur:3,  spread:0, color:'rgba(0,0,0,0.06)' }],
      lg: [{ x:0, y:4, blur:10, spread:0, color:'rgba(0,0,0,0.06)' }],
      xl: [{ x:0, y:8, blur:20, spread:0, color:'rgba(0,0,0,0.08)' }],
    },
    {
      label: 'Card',
      sm: [{ x:0, y:1, blur:2,  spread:0, color:'rgba(0,0,0,0.05)' }],
      md: [{ x:0, y:1, blur:3,  spread:0, color:'rgba(0,0,0,0.08)' }, { x:0, y:1, blur:2, spread:0, color:'rgba(0,0,0,0.06)' }],
      lg: [{ x:0, y:10, blur:25, spread:0, color:'rgba(0,0,0,0.10)' }, { x:0, y:4, blur:10, spread:0, color:'rgba(0,0,0,0.05)' }],
      xl: [{ x:0, y:20, blur:40, spread:0, color:'rgba(0,0,0,0.15)' }],
    },
    {
      label: 'Bold',
      sm: [{ x:0, y:2, blur:6,  spread:0, color:'rgba(0,0,0,0.12)' }],
      md: [{ x:0, y:4, blur:12, spread:0, color:'rgba(0,0,0,0.16)' }],
      lg: [{ x:0, y:16, blur:32, spread:0, color:'rgba(0,0,0,0.20)' }],
      xl: [{ x:0, y:32, blur:64, spread:0, color:'rgba(0,0,0,0.24)' }],
    },
  ];

  const toShadow = (layers: typeof presets[0]['sm']) =>
    layers.map(l => `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`).join(', ') || 'none';

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3 font-medium">Elevación / sombras</p>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setPath([mode, 'shadows', 'shadowSm'], p.sm);
              setPath([mode, 'shadows', 'shadowMd'], p.md);
              setPath([mode, 'shadows', 'shadowLg'], p.lg);
              setPath([mode, 'shadows', 'shadowXl'], p.xl);
            }}
            className="flex flex-col items-center gap-3 p-4 rounded-md border border-neutral-200 hover:border-neutral-300 transition-colors"
          >
            <span
              className="w-10 h-10 rounded-lg bg-white border border-neutral-100"
              style={{ boxShadow: toShadow(p.md) }}
            />
            <span className="text-[11px] text-neutral-600">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Media presets ────────────────────────────────────────────────────────────
function MediaQuick() {
  const mode = useTokensStore((s) => s.mode);
  const media = useTokensStore((s) => s.tokens[mode].media);
  const setPath = useTokensStore((s) => s.setPath);

  const aspects = [
    { label: 'Square',   value: '1/1' },
    { label: 'Classic',  value: '4/3' },
    { label: 'Wide',     value: '16/9' },
    { label: 'Portrait', value: '3/4' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-medium">Aspect ratio (card)</p>
        <div className="grid grid-cols-4 gap-2">
          {aspects.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => setPath([mode, 'media', 'aspectRatioCard'], a.value)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-md border transition-colors ${
                media.aspectRatioCard === a.value ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <span
                className="bg-neutral-300 rounded"
                style={{ aspectRatio: a.value, width: '100%', maxHeight: 40 }}
              />
              <span className="text-[10px] text-neutral-500">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { title: string; component: React.ReactNode }> = {
  typography: { title: 'Tipografía',      component: <TypographyQuick /> },
  colors:     { title: 'Colores',         component: <ColorsQuick /> },
  radii:      { title: 'Bordes / Radios', component: <RadiiQuick /> },
  shadows:    { title: 'Sombras',         component: <ShadowsQuick /> },
  media:      { title: 'Imágenes',        component: <MediaQuick /> },
};

export default function QuickEditPanel({ category, label, onClose }: QuickEditPanelProps) {
  const info = CATEGORY_MAP[category] ?? CATEGORY_MAP['colors'];

  return (
    <div className="border-b border-neutral-200 bg-[#f0fdf9]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d1fae5]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span className="text-xs font-semibold text-neutral-800">
            Quick edit — {info.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[120px]">{label}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#d1fae5] transition-colors text-neutral-500"
            aria-label="Cerrar quick edit"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 max-h-72 overflow-y-auto">
        {info.component}
      </div>
    </div>
  );
}
