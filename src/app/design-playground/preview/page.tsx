/**
 * /design-playground/preview — Showcase completo de componentes.
 *
 * Página standalone que muestra todos los componentes representativos del sitio
 * consumiendo CSS variables. Se puede visitar directamente para ver el estado
 * actual de los tokens sin el panel de controles.
 */

import { NextIntlClientProvider } from 'next-intl';
import messages from '@/i18n/messages/es.json';
import PaletteShowcase from '@/components/playground/preview/showcases/PaletteShowcase';
import TypographyShowcase from '@/components/playground/preview/showcases/TypographyShowcase';
import ButtonsShowcase from '@/components/playground/preview/showcases/ButtonsShowcase';
import CardsShowcase from '@/components/playground/preview/showcases/CardsShowcase';
import PreviewShowcaseExtras from './PreviewShowcaseExtras';

export const metadata = {
  title: 'Design Showcase — Propyte',
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Mexico_City">
      <div
        style={{
          background: 'var(--color-background, #fff)',
          color: 'var(--color-foreground, #2C2C2C)',
          fontFamily: 'var(--font-body, "Space Grotesk", sans-serif)',
          minHeight: '100vh',
        }}
      >
        {/* Top nav strip */}
        <header
          style={{ background: 'var(--color-navy, #1A2F3F)', color: '#fff' }}
          className="px-6 py-3 flex items-center justify-between"
        >
          <span className="font-bold tracking-tight" style={{ color: 'var(--color-teal, #5CE0D2)' }}>
            Propyte
          </span>
          <nav className="flex gap-6 text-sm opacity-80">
            {['Desarrollos', 'Mercado', 'Blog', 'Contacto'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        </header>

        {/* Hero strip */}
        <section
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--color-aztec, #0F1923) 0%, var(--color-navy, #1A2F3F) 100%)`,
            paddingTop: 'var(--section-hero-pt, 80px)',
            paddingBottom: 'var(--section-hero-pb, 80px)',
          }}
        >
          <div className="max-w-5xl mx-auto px-6">
            <h1
              style={{
                fontSize: 'var(--fs-3xl, 36px)',
                lineHeight: 'var(--lh-tight, 1.2)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--fw-bold, 700)',
                color: '#fff',
              }}
            >
              Invierte en el sureste mexicano
            </h1>
            <p
              style={{
                fontSize: 'var(--fs-lg, 18px)',
                color: 'var(--color-teal, #5CE0D2)',
                marginTop: '1rem',
                fontWeight: 'var(--fw-medium, 500)',
              }}
            >
              Propiedades con alto potencial de rentabilidad en Tulum, Cancún y Mérida.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                style={{
                  background: 'var(--color-teal, #5CE0D2)',
                  color: 'var(--color-aztec, #0F1923)',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontWeight: 'var(--fw-semibold, 600)',
                  fontSize: 'var(--fs-base, 16px)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                Ver desarrollos
              </button>
              <button
                style={{
                  background: 'transparent',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontWeight: 'var(--fw-semibold, 600)',
                  fontSize: 'var(--fs-base, 16px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                Conocer más
              </button>
            </div>
          </div>
        </section>

        {/* Main content */}
        <main
          style={{
            maxWidth: 'var(--container-max, 1280px)',
            margin: '0 auto',
            padding: 'var(--section-content-pt, 64px) var(--container-px, 24px) var(--section-content-pb, 64px)',
          }}
        >
          <div className="space-y-16">
            <PaletteShowcase />
            <TypographyShowcase />
            <ButtonsShowcase />
            <CardsShowcase />
            <PreviewShowcaseExtras />
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            background: 'var(--color-aztec, #0F1923)',
            color: '#fff',
            paddingTop: 'var(--section-footer-pt, 48px)',
            paddingBottom: 'var(--section-footer-pb, 48px)',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--container-max, 1280px)',
              margin: '0 auto',
              padding: '0 var(--container-px, 24px)',
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {['Empresa', 'Desarrollos', 'Servicios', 'Legal'].map((col) => (
                <div key={col}>
                  <h3
                    style={{
                      color: 'var(--color-teal, #5CE0D2)',
                      fontSize: 'var(--fs-sm, 14px)',
                      fontWeight: 'var(--fw-semibold, 600)',
                      marginBottom: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--ls-wide, 0.05em)',
                    }}
                  >
                    {col}
                  </h3>
                  {['Link 1', 'Link 2', 'Link 3'].map((l) => (
                    <div key={l} style={{ fontSize: 'var(--fs-sm, 14px)', opacity: 0.6, marginBottom: '0.4rem' }}>
                      {l}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontSize: 'var(--fs-xs, 12px)',
                opacity: 0.5,
              }}
            >
              © {new Date().getFullYear()} Propyte. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
