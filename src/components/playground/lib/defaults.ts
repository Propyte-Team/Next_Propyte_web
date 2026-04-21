/**
 * Defaults extraídos del sistema canónico WP Propyte.
 * Mantener sincronizados con:
 *   - src/styles/globals.css (:root + @theme inline)
 *   - tailwind.config.ts (theme.extend)
 */

import type { DesignTokens, ThemeTokens } from '@/types/design-tokens';

const lightTheme: ThemeTokens = {
  colors: {
    teal: '#5CE0D2',
    tealDark: '#4BCEC0',
    tealA11y: '#0D9488',
    aquaBright: '#99FFFF',
    navy: '#1A2F3F',
    aztec: '#0F1923',
    deepOnyx: '#1A1A2E',
    graphite: '#2C2C2C',
    amber: '#F5A623',
    grayLight: '#F4F6F8',
    success: '#22C55E',
    error: '#EF4444',
    whatsapp: '#25D366',
    whatsappDark: '#1EBE57',
    background: '#FFFFFF',
    foreground: '#2C2C2C',
    muted: '#F4F6F8',
    border: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamilyHeading: '"Space Grotesk", Inter, Arial, sans-serif',
    fontFamilyBody: '"Space Grotesk", Inter, Arial, sans-serif',
    fontSizeXs: 12,
    fontSizeSm: 14,
    fontSizeBase: 16,
    fontSizeLg: 18,
    fontSizeXl: 22,
    fontSize2xl: 28,
    fontSize3xl: 36,
    lineHeightTight: 1.2,
    lineHeightNormal: 1.5,
    lineHeightRelaxed: 1.75,
    letterSpacingTight: -0.02,
    letterSpacingNormal: 0,
    letterSpacingWide: 0.05,
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600,
    fontWeightBold: 700,
  },
  spacing: {
    space0: 0,
    space1: 4,
    space2: 8,
    space4: 16,
    space8: 32,
    space16: 64,
    space24: 96,
    space32: 128,
    space48: 192,
    space64: 256,
  },
  layout: {
    containerMaxWidth: 1280,
    containerPadding: 24,
    gridGap: 24,
  },
  radii: {
    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    radiusXl: 16,
    radiusFull: 9999,
  },
  shadows: {
    shadowSm: [
      { x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)' },
    ],
    shadowMd: [
      { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.08)' },
      { x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.06)' },
    ],
    shadowLg: [
      { x: 0, y: 10, blur: 25, spread: 0, color: 'rgba(0, 0, 0, 0.1)' },
      { x: 0, y: 4, blur: 10, spread: 0, color: 'rgba(0, 0, 0, 0.05)' },
    ],
    shadowXl: [
      { x: 0, y: 20, blur: 40, spread: 0, color: 'rgba(0, 0, 0, 0.15)' },
    ],
  },
  sectionMargins: {
    heroPaddingTop: 80,
    heroPaddingBottom: 80,
    contentPaddingTop: 64,
    contentPaddingBottom: 64,
    footerPaddingTop: 48,
    footerPaddingBottom: 48,
  },
};

// Dark: clona light y sobreescribe roles semánticos.
const darkTheme: ThemeTokens = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#0F1923',
    foreground: '#F4F6F8',
    muted: '#1A2F3F',
    border: 'rgba(255, 255, 255, 0.12)',
  },
  shadows: {
    shadowSm: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.4)' }],
    shadowMd: [
      { x: 0, y: 4, blur: 6, spread: 0, color: 'rgba(0, 0, 0, 0.5)' },
    ],
    shadowLg: [
      { x: 0, y: 10, blur: 25, spread: 0, color: 'rgba(0, 0, 0, 0.6)' },
    ],
    shadowXl: [
      { x: 0, y: 20, blur: 40, spread: 0, color: 'rgba(0, 0, 0, 0.7)' },
    ],
  },
};

export const DEFAULT_TOKENS: DesignTokens = {
  version: 1,
  light: lightTheme,
  dark: darkTheme,
};
