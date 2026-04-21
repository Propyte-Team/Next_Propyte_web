'use client';

/**
 * ButtonsShowcase — renderiza el Button real del sitio + variantes token-driven.
 *
 * Doble render:
 *   (a) Button real (<Button variant>) — muestra el estado actual del sitio
 *       con colores hex hardcodeados. NO cambia en vivo.
 *   (b) "Token-driven" — botones que consumen `var(--color-*)` + radii/shadows
 *       → SÍ cambian instantáneamente. Referencia para Fase 5.
 */

import Button from '@/components/ui/Button';

export default function ButtonsShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Botones</h2>

      <div
        className="rounded-lg p-6 mb-4"
        style={{
          background: 'var(--color-muted)',
          border: `1px solid var(--color-border)`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h3 className="text-sm font-medium mb-3 opacity-70">
          Componentes reales (sitio actual — colores hardcodeados)
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="whatsapp">WhatsApp</Button>
        </div>
      </div>

      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-muted)',
          border: `1px solid var(--color-border)`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h3 className="text-sm font-medium mb-3 opacity-70">
          Token-driven (reflejan cambios en vivo)
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            style={{
              background: 'var(--color-teal)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--fw-semibold)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            Primario
          </button>
          <button
            type="button"
            style={{
              background: 'transparent',
              color: 'var(--color-navy)',
              border: '2px solid var(--color-navy)',
              padding: '8px 22px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--fw-semibold)',
            }}
          >
            Secundario
          </button>
          <button
            type="button"
            style={{
              background: 'var(--color-amber)',
              color: 'var(--color-aztec)',
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--fw-semibold)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Acento
          </button>
        </div>
      </div>
    </section>
  );
}
