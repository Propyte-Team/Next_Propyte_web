'use client';

import { useTranslations } from 'next-intl';
import { Activity } from 'lucide-react';
import type { TabId } from '@/lib/rental-data/types';

interface MercadoHeroProps {
  activeTab: TabId;
  locale: string;
  strStats?: { zones: number; listings: number; cities: number; updatedAt: string };
  ltrStats?: { comparables: number; cities: number; sources: number; updatedAt: string };
}

/**
 * MercadoHero — dark canvas data-forward.
 *
 * Antes: bg light + pill amber "Actualizando datos…" rompía la paleta teal/navy.
 * Ahora: hero oscuro con grid blueprint + glow nodes (sistema .propyte-hero-canvas),
 * stats en mono tabular como cifras destacadas, y status indicator integrado a la
 * paleta cuando no hay data.
 *
 * Mantiene la lógica de data: hide-empty-KPI (onboarding empty cuando stats undefined)
 * vs filter-empty (data sí existe pero el filtro no encontró match — eso vive en
 * VacacionalKPIs).
 */
export function MercadoHero({ activeTab, locale: _locale, strStats, ltrStats }: MercadoHeroProps) {
  const t = useTranslations('mercadoHero');

  const stats = activeTab === 'vacacional' ? strStats : ltrStats;
  const trustItems: { value: string; label: string }[] = [];
  if (activeTab === 'vacacional' && strStats) {
    trustItems.push(
      { value: strStats.listings.toLocaleString(), label: t('strProperties') },
      { value: strStats.cities.toString(), label: t('cities') },
      { value: strStats.zones.toString(), label: t('strZones') },
      { value: t('monthly'), label: t('update') },
    );
  } else if (activeTab !== 'vacacional' && ltrStats) {
    trustItems.push(
      { value: ltrStats.comparables.toLocaleString(), label: t('ltrComparables') },
      { value: ltrStats.cities.toString(), label: t('cities') },
      { value: ltrStats.sources.toString(), label: t('ltrSources') },
      { value: t('daily'), label: t('update') },
    );
  }

  return (
    <section className="propyte-hero-canvas relative">
      {/* Decorative sparkline SVG — chart-like ornament floating bottom-right.
          Static, decorativo, refuerza el "data-forward" sin distraer. */}
      <svg
        aria-hidden="true"
        className="absolute right-4 md:right-12 bottom-6 md:bottom-10 w-48 md:w-72 h-12 md:h-16 text-[#5CE0D2]/25 pointer-events-none"
        viewBox="0 0 280 60"
        fill="none"
      >
        <path
          d="M 0 48 L 24 42 L 48 46 L 72 28 L 96 32 L 120 18 L 144 22 L 168 8 L 192 14 L 216 4 L 240 12 L 264 6 L 280 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data point dots */}
        {[24, 72, 120, 168, 216, 264].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={[42, 28, 18, 8, 4, 6][i]}
            r="2"
            fill="currentColor"
            className="opacity-60"
          />
        ))}
      </svg>

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-10 md:pb-14 text-center">
        {/* Eyebrow status pill — pulsing teal dot reemplaza al amber popout */}
        <span
          className="propyte-hero-eyebrow propyte-hero-rise"
          style={{ animationDelay: '60ms' }}
        >
          <span className="propyte-hero-eyebrow__dot" aria-hidden="true" />
          {t('badge')}
        </span>

        {/* H1 grotesk + última palabra italic serif teal acento.
            "Analiza el mercado de rentas en México" → "México" en serif italic */}
        <h1
          className="mt-7 text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-white max-w-4xl mx-auto propyte-hero-rise"
          style={{ animationDelay: '160ms' }}
        >
          {t('title').split(' ').map((word, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <span key={i}>
                {isLast ? (
                  <span className="accent-serif text-[#5CE0D2]">{word}</span>
                ) : (
                  word
                )}
                {!isLast && ' '}
              </span>
            );
          })}
        </h1>

        <p
          className="mt-6 text-base md:text-lg text-white/65 max-w-2xl mx-auto leading-relaxed propyte-hero-rise"
          style={{ animationDelay: '260ms' }}
        >
          {t('subtitle')}
        </p>

        {/* Stats o status indicator. */}
        {trustItems.length > 0 ? (
          <dl
            className="mt-10 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden propyte-hero-rise"
            style={{ animationDelay: '360ms' }}
          >
            {trustItems.map((item, i) => (
              <div key={i} className="bg-[#0F1923] py-5 px-3">
                <dt className="accent-mono text-2xl md:text-3xl font-medium text-white">
                  {item.value}
                </dt>
                <dd className="mt-1.5 accent-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          !stats && (
            <div
              className="mt-10 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#5CE0D2]/25 bg-[#5CE0D2]/[0.06] text-[#5CE0D2] propyte-hero-rise"
              style={{ animationDelay: '360ms' }}
            >
              <Activity size={14} className="animate-pulse" aria-hidden="true" />
              <span className="accent-mono text-[11px] uppercase tracking-[0.12em] font-medium">
                {t('updating')}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
