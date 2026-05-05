'use client';

import { useTranslations } from 'next-intl';
import type { TabId } from '@/lib/rental-data/types';

interface MercadoHeroProps {
  activeTab: TabId;
  locale: string;
  strStats?: { zones: number; listings: number; cities: number; updatedAt: string };
  ltrStats?: { comparables: number; cities: number; sources: number; updatedAt: string };
}

export function MercadoHero({ activeTab, locale: _locale, strStats, ltrStats }: MercadoHeroProps) {
  const t = useTranslations('mercadoHero');

  // Hide-empty-KPI — patrón "onboarding empty" (data NO existe en Supabase).
  // Cuando stats undefined: oculta grid + muestra "Actualizando datos…"
  // amber pulse, comunica que el data pipeline está poblándose.
  // Diferenciar de "filter empty" (data sí existe pero el filtro del usuario
  // no encontró match) — ese caso usa "Sin datos para esta selección" gris
  // neutral en VacacionalKPIs (commit 9861258 Sprint A item 11).
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
    <div className="bg-gradient-to-b from-[#F4F6F8] to-white pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block bg-[#5CE0D2]/10 text-[#0F766E] text-xs font-semibold px-4 py-1 rounded-full mb-4">
          {t('badge')}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A2F3F] mb-3">{t('title')}</h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">{t('subtitle')}</p>

        {trustItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {trustItems.map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-[#1A2F3F] font-mono">{item.value}</div>
                <div className="text-xs text-gray-600 uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        ) : (
          !stats && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
              <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              {t('updating')}
            </div>
          )
        )}
      </div>
    </div>
  );
}
