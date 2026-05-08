import type { Config } from "tailwindcss";

// Colors reference CSS variables so the Design Playground can override them
// at runtime via document.documentElement.style.setProperty(). The variables
// are defined in src/styles/globals.css :root with the canonical Propyte hex
// values as defaults.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        propyte: {
          teal:         'var(--color-teal)',
          'teal-dark':  'var(--color-teal-dark)',
          'teal-a11y':  'var(--color-teal-a11y)',
          'aqua-bright':'var(--color-aqua-bright)',
          navy:         'var(--color-navy)',
          aztec:        'var(--color-aztec)',
          'deep-onyx':  'var(--color-deep-onyx)',
          graphite:     'var(--color-graphite)',
          amber:        'var(--color-amber)',
          light:        'var(--color-gray-light)',
        },
        // Shorthand aliases
        navy:          'var(--color-navy)',
        aztec:         'var(--color-aztec)',
        teal: {
          DEFAULT: 'var(--color-teal)',
          dark:    'var(--color-teal-dark)',
          a11y:    'var(--color-teal-a11y)',
        },
        'aqua-bright': 'var(--color-aqua-bright)',
        amber:         'var(--color-amber)',
        graphite:      'var(--color-graphite)',
        'gray-light':  'var(--color-gray-light)',
        success:       'var(--color-success)',
        error:         'var(--color-error)',
        whatsapp: {
          DEFAULT: 'var(--color-whatsapp)',
          dark:    'var(--color-whatsapp-dark)',
        },
        // Design Playground semantic roles
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted:      'var(--color-muted)',
        border:     'var(--color-border)',
      },
      fontFamily: {
        sans: ['var(--font-body)', '"Space Grotesk"', 'Inter', 'Arial', 'sans-serif'],
        heading: ['var(--font-heading)', '"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      maxWidth: {
        'container-sm': '640px',
        'container-md': '1024px',
        'container-lg': '1280px',
        'container-xl': '1440px',
      },
      fontSize: {
        // — Escala fluida 320 → 1440 (clamps definidos en globals.css :root) —
        '2xs':         ['var(--fs-2xs)',  { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-medium)' }],
        '7xl':         ['var(--fs-7xl)',  { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-bold)' }],
        // — Heading semantic presets (apuntan a --fs-h1...h6 fluidos) —
        'h1':          ['var(--fs-h1)',   { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-bold)' }],
        'h2':          ['var(--fs-h2)',   { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-bold)' }],
        'h3':          ['var(--fs-h3)',   { lineHeight: 'var(--lh-normal)',  fontWeight: 'var(--fw-semibold)' }],
        'h4':          ['var(--fs-h4)',   { lineHeight: 'var(--lh-normal)',  fontWeight: 'var(--fw-semibold)' }],
        'h5':          ['var(--fs-h5)',   { lineHeight: 'var(--lh-normal)',  fontWeight: 'var(--fw-semibold)' }],
        'h6':          ['var(--fs-h6)',   { lineHeight: 'var(--lh-normal)',  fontWeight: 'var(--fw-semibold)' }],
        'display':     ['var(--fs-display)', { lineHeight: 'var(--lh-tight)', fontWeight: 'var(--fw-bold)' }],
        'eyebrow':     ['var(--fs-eyebrow)', { lineHeight: 'var(--lh-tight)', fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--ls-wide)' }],
        // — Component aliases —
        'body':        ['var(--fs-base)', { lineHeight: 'var(--lh-relaxed)', fontWeight: 'var(--fw-normal)' }],
        'body-sm':     ['var(--fs-sm)',   { lineHeight: 'var(--lh-normal)',  fontWeight: 'var(--fw-normal)' }],
        'price-card':  ['var(--fs-xl)',   { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-bold)' }],
        'price-micro': ['var(--fs-2xl)',  { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-bold)' }],
        'metadata':    ['var(--fs-sm)',   { lineHeight: 'var(--lh-normal)',  fontWeight: 'var(--fw-medium)' }],
        'badge':       ['var(--fs-xs)',   { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-semibold)' }],
        'btn':         ['var(--fs-base)', { lineHeight: 'var(--lh-tight)',   fontWeight: 'var(--fw-semibold)' }],
      },
      borderRadius: {
        'card':  'var(--radius-lg)',
        'btn':   'var(--radius-md)',
        'badge': 'var(--radius-sm)',
        'pin':   'var(--radius-sm)',
      },
      boxShadow: {
        'card':       'var(--shadow-md)',
        'card-hover': 'var(--shadow-lg)',
        'pin':        'var(--shadow-sm)',
      },
    },
  },
  plugins: [],
};
export default config;
