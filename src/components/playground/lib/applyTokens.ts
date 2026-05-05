/**
 * Aplica un ThemeTokens como CSS variables a un HTMLElement.
 * Usado por LivePreview para pintar en vivo sin recompilar Tailwind.
 *
 * Convención de nombres:
 *   --color-{role}        → ej. --color-teal, --color-background
 *   --font-{role}         → ej. --font-heading, --font-body
 *   --fs-{scale}          → ej. --fs-base, --fs-xl  (px)
 *   --lh-{scale}          → ej. --lh-normal
 *   --ls-{scale}          → ej. --ls-tight (em)
 *   --fw-{scale}          → ej. --fw-bold
 *   --space-{n}           → ej. --space-4, --space-16 (px)
 *   --radius-{scale}      → ej. --radius-lg (px)
 *   --shadow-{scale}      → string box-shadow compuesto
 *   --container-max       → px
 *   --container-px        → px
 *   --grid-gap            → px
 *   --section-*           → px
 *   --media-*             → aspect-ratio, border-radius, heights
 */

import type { ShadowLayer, ThemeTokens } from '@/types/design-tokens';


function shadowLayersToString(layers: ShadowLayer[]): string {
  return layers
    .map(
      (l) =>
        `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`,
    )
    .join(', ');
}

export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
  const { colors, typography, spacing, layout, radii, shadows, sectionMargins, media } = theme;

  return {
    // Colors canónicos
    '--color-teal': colors.teal,
    '--color-teal-dark': colors.tealDark,
    '--color-teal-a11y': colors.tealA11y,
    '--color-aqua-bright': colors.aquaBright,
    '--color-navy': colors.navy,
    '--color-aztec': colors.aztec,
    '--color-deep-onyx': colors.deepOnyx,
    '--color-graphite': colors.graphite,
    '--color-amber': colors.amber,
    '--color-gray-light': colors.grayLight,
    '--color-success': colors.success,
    '--color-error': colors.error,
    '--color-whatsapp': colors.whatsapp,
    '--color-whatsapp-dark': colors.whatsappDark,
    // Roles semánticos
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-muted': colors.muted,
    '--color-border': colors.border,

    // Tipografía
    '--font-heading': typography.fontFamilyHeading,
    '--font-body': typography.fontFamilyBody,
    '--fs-xs': `${typography.fontSizeXs}px`,
    '--fs-sm': `${typography.fontSizeSm}px`,
    '--fs-base': `${typography.fontSizeBase}px`,
    '--fs-lg': `${typography.fontSizeLg}px`,
    '--fs-xl': `${typography.fontSizeXl}px`,
    '--fs-2xl': `${typography.fontSize2xl}px`,
    '--fs-3xl': `${typography.fontSize3xl}px`,
    '--lh-tight': `${typography.lineHeightTight}`,
    '--lh-normal': `${typography.lineHeightNormal}`,
    '--lh-relaxed': `${typography.lineHeightRelaxed}`,
    '--ls-tight': `${typography.letterSpacingTight}em`,
    '--ls-normal': `${typography.letterSpacingNormal}em`,
    '--ls-wide': `${typography.letterSpacingWide}em`,
    '--fw-normal': `${typography.fontWeightNormal}`,
    '--fw-medium': `${typography.fontWeightMedium}`,
    '--fw-semibold': `${typography.fontWeightSemibold}`,
    '--fw-bold': `${typography.fontWeightBold}`,

    // Spacing
    '--space-0': `${spacing.space0}px`,
    '--space-1': `${spacing.space1}px`,
    '--space-2': `${spacing.space2}px`,
    '--space-4': `${spacing.space4}px`,
    '--space-8': `${spacing.space8}px`,
    '--space-16': `${spacing.space16}px`,
    '--space-24': `${spacing.space24}px`,
    '--space-32': `${spacing.space32}px`,
    '--space-48': `${spacing.space48}px`,
    '--space-64': `${spacing.space64}px`,

    // Layout
    '--container-max': `${layout.containerMaxWidth}px`,
    '--container-px': `${layout.containerPadding}px`,
    '--grid-gap': `${layout.gridGap}px`,

    // Radii
    '--radius-sm': `${radii.radiusSm}px`,
    '--radius-md': `${radii.radiusMd}px`,
    '--radius-lg': `${radii.radiusLg}px`,
    '--radius-xl': `${radii.radiusXl}px`,
    '--radius-full': `${radii.radiusFull}px`,

    // Shadows
    '--shadow-sm': shadowLayersToString(shadows.shadowSm),
    '--shadow-md': shadowLayersToString(shadows.shadowMd),
    '--shadow-lg': shadowLayersToString(shadows.shadowLg),
    '--shadow-xl': shadowLayersToString(shadows.shadowXl),

    // Section margins
    '--section-hero-pt': `${sectionMargins.heroPaddingTop}px`,
    '--section-hero-pb': `${sectionMargins.heroPaddingBottom}px`,
    '--section-content-pt': `${sectionMargins.contentPaddingTop}px`,
    '--section-content-pb': `${sectionMargins.contentPaddingBottom}px`,
    '--section-footer-pt': `${sectionMargins.footerPaddingTop}px`,
    '--section-footer-pb': `${sectionMargins.footerPaddingBottom}px`,

    // Media
    '--media-aspect-card': media.aspectRatioCard,
    '--media-aspect-hero': media.aspectRatioHero,
    '--media-aspect-square': media.aspectRatioSquare,
    '--media-aspect-portrait': media.aspectRatioPortrait,
    '--media-object-fit': media.imageObjectFit,
    '--media-image-radius': `${media.imageBorderRadius}px`,
    '--media-card-image-height': `${media.cardImageHeight}px`,
  };
}

export function applyTokensToElement(el: HTMLElement, theme: ThemeTokens): void {
  const vars = themeToCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
}
