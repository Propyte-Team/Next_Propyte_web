'use client';

/**
 * CardsShowcase — MarketplaceCard real + card token-driven.
 */

import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import { MOCK_PROPERTY } from '../mockProperty';

export default function CardsShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Cards</h2>

      <div
        className="rounded-lg p-6 mb-4"
        style={{
          background: 'var(--color-muted)',
          border: `1px solid var(--color-border)`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h3 className="text-sm font-medium mb-3 opacity-70">
          MarketplaceCard real (sitio actual — mock data)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <MarketplaceCard property={MOCK_PROPERTY} priority />
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
          Token-driven card (refleja cambios en vivo)
        </h3>
        <div
          style={{
            background: 'var(--color-background)',
            border: `1px solid var(--color-border)`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: 20,
            maxWidth: 360,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'var(--color-amber)',
              color: 'var(--color-aztec)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 'var(--fw-semibold)',
              marginBottom: 12,
            }}
          >
            PREVENTA
          </div>
          <div
            style={{
              fontSize: 'var(--fs-xl)',
              fontWeight: 'var(--fw-bold)',
              fontFamily: 'var(--font-heading)',
              marginBottom: 6,
            }}
          >
            Eternity Jol
          </div>
          <div
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--color-graphite)',
              marginBottom: 16,
              opacity: 0.75,
            }}
          >
            Playa del Carmen · Centro
          </div>
          <div
            style={{
              fontSize: 'var(--fs-xl)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--color-teal-a11y)',
            }}
          >
            $4,890,000 MXN
          </div>
        </div>
      </div>
    </section>
  );
}
