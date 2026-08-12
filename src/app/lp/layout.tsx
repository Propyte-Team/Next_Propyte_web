import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import Analytics from '@/components/shared/Analytics';
import ConsentBannerLp from './_components/ConsentBannerLp';
import './lp-theme.css';

// Display serif SOLO para titulares de la landing. El grotesk del sitio sigue
// haciendo interfaz y cifras.
//
// Por qué una serif aquí y no en el resto de propyte.com: esta página vende
// confianza mediante un texto largo y argumentado, no mediante fotos de
// producto. Una serif de texto le da autoridad de publicación a los titulares,
// que es exactamente el registro que la página necesita. Newsreader, no las
// dos serifs que todo generador escoge por defecto.
const displaySerif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-lp-display',
  display: 'swap',
});

// ============================================================
// Layout de landings de pago.
//
// Vive FUERA de `[locale]` a propósito. Los route groups de Next no permiten
// saltarse un layout padre: cualquier ruta bajo `app/[locale]/` hereda
// `[locale]/layout.tsx`, que monta Header, Footer y MainPadding. Colgar la
// landing de `app/lp/` la deja heredando solo el root layout (<html>, <body>,
// fuentes): cero navegación, cero footer de sitio, cero riesgo de regresión
// sobre el sitio vivo. Requiere el skip de `/lp/` en `middleware.ts`, o
// next-intl redirige a `/es/lp/...` con 307.
//
// Consecuencia: la URL no lleva prefijo de locale. Para una página `noindex`
// sin variante en inglés no cuesta nada: no hay hreflang que declarar.
//
// Analytics sí se remonta (vive en `[locale]/layout.tsx`), pero el CookieBanner
// del sitio no es reutilizable fuera de `[locale]`: depende de next-intl y del
// provider de comparación. En su lugar va `ConsentBannerLp`, que escribe en la
// misma clave de consentimiento. Sin él, Consent Mode v2 se queda en "denied".
// ============================================================

export const metadata: Metadata = {
  // noindex, follow: la landing no compite en orgánico, pero los enlaces que
  // salgan de ella (metodología, privacidad) sí deben poder rastrearse.
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`lp-root flex min-h-screen flex-col bg-[var(--lp-paper)] ${displaySerif.variable}`}
    >
      {/* Cabecera transparente sobre el hero. El hero ahora es una imagen a
          sangre, así que la cabecera flota encima en vez de cortarla con una
          banda de color: el primer pliegue se lee como una sola pieza.
          Logo no clicable: identidad sin ruta de salida (un solo objetivo). */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-5 py-5 sm:px-8">
          <span
            className="lp-display text-xl text-[var(--lp-on-dark)] drop-shadow-[0_1px_12px_rgb(0_0_0/0.45)]"
            aria-label="Propyte"
          >
            Propyte
          </span>
          <span className="text-[0.625rem] uppercase tracking-[0.14em] text-[var(--lp-on-dark)]/70 drop-shadow-[0_1px_12px_rgb(0_0_0/0.45)]">
            Riviera Maya
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Analytics />
      <ConsentBannerLp />
    </div>
  );
}
