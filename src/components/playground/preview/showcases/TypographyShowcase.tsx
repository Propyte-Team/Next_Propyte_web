'use client';

/**
 * TypographyShowcase — tipografía en vivo.
 * Los controles Fase 2 editarán --font-*, --fs-*, --lh-*.
 */

export default function TypographyShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Tipografía</h2>
      <div
        className="rounded-lg p-6 space-y-4"
        style={{
          background: 'var(--color-muted)',
          border: `1px solid var(--color-border)`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)' }}>
          <div style={{ fontSize: 'var(--fs-3xl)', lineHeight: 'var(--lh-tight)', fontWeight: 'var(--fw-bold)' }}>
            Invierte con datos. Decide con confianza.
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', lineHeight: 'var(--lh-tight)', fontWeight: 'var(--fw-semibold)', marginTop: 8 }}>
            Desarrollos en preventa
          </div>
          <div style={{ fontSize: 'var(--fs-xl)', lineHeight: 'var(--lh-tight)', fontWeight: 'var(--fw-semibold)', marginTop: 8 }}>
            Heading 3 — sección
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-body)' }}>
          <p style={{ fontSize: 'var(--fs-base)', lineHeight: 'var(--lh-normal)' }}>
            Texto body 16px con line-height normal. Propyte es la plataforma
            inmobiliaria más inteligente de la Riviera Maya.
          </p>
          <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-normal)', marginTop: 8, opacity: 0.75 }}>
            Texto small 14px — metadata, captions, footer.
          </p>
          <p style={{ fontSize: 'var(--fs-xs)', marginTop: 8, opacity: 0.6 }}>
            XS 12px — badges, etiquetas.
          </p>
        </div>
      </div>
    </section>
  );
}
