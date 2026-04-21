/**
 * DesignTokens — contrato único de tokens editables desde /admin/design.
 * Cualquier cambio aquí debe reflejarse en defaults.ts y applyTokens.ts.
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  // Paleta Propyte canónica (calca WP)
  teal: string;
  tealDark: string;
  tealA11y: string;
  aquaBright: string;
  navy: string;
  aztec: string;
  deepOnyx: string;
  graphite: string;
  amber: string;
  grayLight: string;
  // Estado
  success: string;
  error: string;
  // Marca externa
  whatsapp: string;
  whatsappDark: string;
  // Roles semánticos (aplicados al preview)
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface TypographyTokens {
  fontFamilyHeading: string;
  fontFamilyBody: string;
  // Escala fontSize en px
  fontSizeXs: number;
  fontSizeSm: number;
  fontSizeBase: number;
  fontSizeLg: number;
  fontSizeXl: number;
  fontSize2xl: number;
  fontSize3xl: number;
  // Line heights (unitless)
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
  // Letter spacing em
  letterSpacingTight: number;
  letterSpacingNormal: number;
  letterSpacingWide: number;
  // Weights
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
}

export interface SpacingTokens {
  // Escala spacing en px — aplicada como var(--space-*)
  space0: number;
  space1: number;
  space2: number;
  space4: number;
  space8: number;
  space16: number;
  space24: number;
  space32: number;
  space48: number;
  space64: number;
}

export interface LayoutTokens {
  containerMaxWidth: number; // px
  containerPadding: number; // px
  gridGap: number; // px
}

export interface RadiiTokens {
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
  radiusFull: number; // normalmente 9999
}

export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string; // rgba()
}

export interface ShadowsTokens {
  shadowSm: ShadowLayer[];
  shadowMd: ShadowLayer[];
  shadowLg: ShadowLayer[];
  shadowXl: ShadowLayer[];
}

export interface SectionMarginsTokens {
  heroPaddingTop: number;
  heroPaddingBottom: number;
  contentPaddingTop: number;
  contentPaddingBottom: number;
  footerPaddingTop: number;
  footerPaddingBottom: number;
}

/** Bloque completo de tokens — se duplica por tema (light/dark). */
export interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  layout: LayoutTokens;
  radii: RadiiTokens;
  shadows: ShadowsTokens;
  sectionMargins: SectionMarginsTokens;
}

/** Payload completo persistido en localStorage / JSON export. */
export interface DesignTokens {
  version: 1;
  light: ThemeTokens;
  dark: ThemeTokens;
}
