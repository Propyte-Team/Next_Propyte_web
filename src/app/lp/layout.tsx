import type { Metadata } from 'next';
import Analytics from '@/components/shared/Analytics';
import ConsentBannerLp from './_components/ConsentBannerLp';

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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Cabecera sobre el mismo fondo que el hero, para que la marca y el
          primer pliegue lean como una sola pieza. Logo no clicable: identidad
          sin ruta de salida (un solo objetivo). */}
      <header className="bg-aztec">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-5 py-4">
          <span
            className="font-display text-lg font-semibold tracking-tight text-white"
            aria-label="Propyte"
          >
            Propyte
          </span>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-aqua-bright/55">
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
