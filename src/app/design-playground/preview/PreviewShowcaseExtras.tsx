'use client';

/**
 * Secciones adicionales del showcase: formulario, cards con imágenes, badges, inputs.
 */
export default function PreviewShowcaseExtras() {
  return (
    <section>
      <h2 style={{ fontSize: 'var(--fs-xl, 22px)', fontWeight: 'var(--fw-semibold, 600)', marginBottom: '1.5rem' }}>
        Formularios e inputs
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div
          style={{
            background: 'var(--color-muted, #F4F6F8)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '1.5rem',
            border: '1px solid var(--color-border, rgba(0,0,0,0.08))',
          }}
        >
          <h3 style={{ fontSize: 'var(--fs-lg, 18px)', fontWeight: 'var(--fw-semibold, 600)', marginBottom: '1rem' }}>
            Contacto
          </h3>
          <div className="space-y-3">
            {['Nombre', 'Email', 'Teléfono'].map((field) => (
              <div key={field}>
                <label
                  style={{ fontSize: 'var(--fs-sm, 14px)', fontWeight: 'var(--fw-medium, 500)', display: 'block', marginBottom: '0.25rem' }}
                >
                  {field}
                </label>
                <input
                  type="text"
                  placeholder={`Tu ${field.toLowerCase()}…`}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--color-border, rgba(0,0,0,0.12))',
                    fontSize: 'var(--fs-sm, 14px)',
                    background: '#fff',
                    color: 'var(--color-foreground, #2C2C2C)',
                    outline: 'none',
                  }}
                  readOnly
                />
              </div>
            ))}
            <button
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--color-teal, #5CE0D2)',
                color: 'var(--color-aztec, #0F1923)',
                borderRadius: 'var(--radius-md, 8px)',
                fontWeight: 'var(--fw-semibold, 600)',
                fontSize: 'var(--fs-base, 16px)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Enviar
            </button>
          </div>
        </div>

        {/* Badges & states */}
        <div>
          <h3 style={{ fontSize: 'var(--fs-lg, 18px)', fontWeight: 'var(--fw-semibold, 600)', marginBottom: '1rem' }}>
            Badges y estados
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'Disponible', bg: 'var(--color-success, #22C55E)', color: '#fff' },
              { label: 'Vendido', bg: 'var(--color-error, #EF4444)', color: '#fff' },
              { label: 'Preventa', bg: 'var(--propyte-cyan-300, #81EAF1)', color: 'var(--propyte-dark-900)' },
              { label: 'Destacado', bg: 'var(--color-teal, #5CE0D2)', color: 'var(--color-aztec)' },
              { label: 'Nuevo', bg: 'var(--color-navy, #1A2F3F)', color: '#fff' },
            ].map(({ label, bg, color }) => (
              <span
                key={label}
                style={{
                  background: bg,
                  color,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  fontSize: 'var(--fs-xs, 12px)',
                  fontWeight: 'var(--fw-semibold, 600)',
                  letterSpacing: 'var(--ls-wide, 0.05em)',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Image card with aspect-ratio token */}
          <div
            style={{
              borderRadius: 'var(--radius-lg, 12px)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                aspectRatio: 'var(--media-aspect-card, 4/3)',
                background: 'linear-gradient(135deg, var(--color-navy, #1A2F3F), var(--color-teal, #5CE0D2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 'var(--fs-sm, 14px)',
                opacity: 0.7,
              }}
            >
              Imagen card {/* aspect-ratio: --media-aspect-card */}
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-background)' }}>
              <h4 style={{ fontWeight: 'var(--fw-semibold, 600)', fontSize: 'var(--fs-lg, 18px)', marginBottom: '0.25rem' }}>
                Residencial Tulum Norte
              </h4>
              <p style={{ fontSize: 'var(--fs-sm, 14px)', opacity: 0.6 }}>
                Quintana Roo, México · Desde $120,000 USD
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
