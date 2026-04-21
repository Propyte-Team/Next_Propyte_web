'use client';

/**
 * LivePreview — zona derecha del playground.
 *
 * Inyecta las CSS vars del tema activo en un contenedor scoped (no en :root,
 * para no contaminar el resto de la app). Los showcases consumen las vars
 * directamente via `style={{ color: 'var(--color-teal)' }}` o
 * `bg-[var(--color-teal)]`.
 *
 * Los componentes reales del sitio (MarketplaceCard, Button) se renderizan
 * tal cual — sus colores hex hardcodeados NO cambian en vivo; reflejan el
 * estado actual del sitio hasta que Fase 5 aplique los tokens al código real.
 */

import { useEffect, useRef } from 'react';
import { useTokensStore } from '../store/useTokensStore';
import { themeToCssVars } from '../lib/applyTokens';
import PaletteShowcase from './showcases/PaletteShowcase';
import TypographyShowcase from './showcases/TypographyShowcase';
import ButtonsShowcase from './showcases/ButtonsShowcase';
import CardsShowcase from './showcases/CardsShowcase';

interface LivePreviewProps {
  target: 'components' | 'home';
}

export default function LivePreview({ target }: LivePreviewProps) {
  const mode = useTokensStore((s) => s.mode);
  const theme = useTokensStore((s) => s.tokens[mode]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Aplica CSS vars al contenedor en cada cambio de tokens/modo.
  useEffect(() => {
    if (!rootRef.current) return;
    const vars = themeToCssVars(theme);
    for (const [k, v] of Object.entries(vars)) {
      rootRef.current.style.setProperty(k, v);
    }
  }, [theme]);

  return (
    <div
      ref={rootRef}
      data-theme={mode}
      className="min-h-full p-6"
      style={{
        background: 'var(--color-background)',
        color: 'var(--color-foreground)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {target === 'components' ? (
        <div className="max-w-[var(--container-max)] mx-auto space-y-10">
          <PaletteShowcase />
          <TypographyShowcase />
          <ButtonsShowcase />
          <CardsShowcase />
        </div>
      ) : (
        <div className="max-w-[var(--container-max)] mx-auto py-16">
          <h2 className="text-2xl font-semibold mb-3">Home — próximamente</h2>
          <p className="text-sm opacity-70">
            En Fase 2 se integrará el render del Hero, FeaturedProperties y
            demás secciones del home con los tokens en vivo.
          </p>
        </div>
      )}
    </div>
  );
}
