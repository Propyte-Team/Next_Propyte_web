/**
 * PlaygroundOverrideCss — CSS de override que se inyecta SOLO cuando la página
 * está embebida en el iframe del Design Playground.
 *
 * Mapea las "arbitrary values" más usadas en el codebase (ej. bg-[#5CE0D2])
 * a CSS variables (--color-teal). Eso permite que el playground cambie en vivo
 * elementos que usan hex hardcoded sin tener que refactorizar los componentes.
 *
 * Cobertura: ~1500 instancias contadas con
 *   grep -roh '(bg|text|border|fill|stroke|from|to|via)-\[#[0-9A-Fa-f]+\]' src/
 *
 * Si en el futuro se migra el código a tokens (bg-teal en vez de bg-[#5CE0D2])
 * este archivo deja de ser necesario.
 */

const COLOR_MAP: Record<string, string> = {
  '5CE0D2': 'teal',
  '4BCEC0': 'teal-dark',
  '0D9488': 'teal-a11y',
  '0F766E': 'teal-a11y',     // Tailwind teal-700 — usado en text accesible
  '99FFFF': 'aqua-bright',
  '1A2F3F': 'navy',
  '0F1923': 'aztec',
  '1A1A2E': 'deep-onyx',
  '2C2C2C': 'graphite',
  'F5A623': 'amber',
  'F4F6F8': 'gray-light',
  '22C55E': 'success',
  'EF4444': 'error',
  '25D366': 'whatsapp',
  '1EBE57': 'whatsapp-dark',
};

const COLOR_PROPS: Array<[string, string]> = [
  ['bg',     'background-color'],
  ['text',   'color'],
  ['border', 'border-color'],
  ['fill',   'fill'],
  ['stroke', 'stroke'],
  ['ring',   '--tw-ring-color'],
  ['from',   '--tw-gradient-from'],
  ['to',     '--tw-gradient-to'],
  ['via',    '--tw-gradient-via'],
  ['outline','outline-color'],
  ['decoration', 'text-decoration-color'],
  ['caret',  'caret-color'],
  ['accent', 'accent-color'],
  ['shadow', '--tw-shadow-color'],
];

function escapeForCss(hex: string): string {
  // bg-[#5CE0D2] → en CSS sale como .bg-\[\#5CE0D2\]
  return `\\[\\#${hex}\\]`;
}

// Variantes de pseudo-clase comunes en Tailwind. La sintaxis del prefijo
// se escapa con \: porque ":" es ilegal en selectores CSS sin escapar.
const VARIANTS: Array<[string, string]> = [
  ['',           ''],
  ['hover\\:',   ':hover'],
  ['focus\\:',   ':focus'],
  ['active\\:',  ':active'],
  ['group-hover\\:', ''],   // applied via .group:hover .group-hover\:bg-...
  ['md\\:',      ''],
  ['lg\\:',      ''],
];

// Mapa de tamaños arbitrarios (text-[NNpx]) → token equivalente más cercano.
const FONT_SIZE_MAP: Array<[string, string]> = [
  ['text-\\[10px\\]', 'calc(var(--fs-xs) * 0.83)'],   // 10px ≈ xs * 0.83
  ['text-\\[11px\\]', 'calc(var(--fs-xs) * 0.92)'],   // 11px ≈ xs * 0.92
  ['text-\\[9px\\]',  'calc(var(--fs-xs) * 0.75)'],
  ['text-\\[8px\\]',  'calc(var(--fs-xs) * 0.67)'],
  ['text-\\[56px\\]', 'calc(var(--fs-3xl) * 1.55)'],
];

function buildHexRules(): string[] {
  const rules: string[] = [];
  for (const [hex, varName] of Object.entries(COLOR_MAP)) {
    const uniqueVariants = Array.from(new Set([hex, hex.toLowerCase(), hex.toUpperCase()]));
    for (const [util, prop] of COLOR_PROPS) {
      for (const v of uniqueVariants) {
        for (const [prefix, pseudo] of VARIANTS) {
          if (prefix === 'group-hover\\:') {
            rules.push(
              `.group:hover .${prefix}${util}-${escapeForCss(v)} { ${prop}: var(--color-${varName}) !important; }`,
            );
          } else {
            rules.push(
              `.${prefix}${util}-${escapeForCss(v)}${pseudo} { ${prop}: var(--color-${varName}) !important; }`,
            );
          }
        }
      }
    }
  }
  return rules;
}

function buildFontSizeRules(): string[] {
  return FONT_SIZE_MAP.map(([cls, val]) => `.${cls} { font-size: ${val} !important; }`);
}

export function buildPlaygroundOverrideCss(): string {
  return [...buildHexRules(), ...buildFontSizeRules()].join('\n');
}
