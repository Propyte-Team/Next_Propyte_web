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

  const trustItems = activeTab === 'vacacional'
    ? [
        { value: strStats ? strStats.listings.toLocaleString() : '—', label: t('strProperties') },
        { value: strStats ? strStats.cities.toString() : '—', label: t('cities') },
        { value: strStats ? strStats.zones.toString() : '—', label: t('strZones') },
        { value: t('monthly'), label: t('update') },
      ]
    : [
        { value: ltrStats ? ltrStats.comparables.toLocaleString() : '—', label: t('ltrComparables') },
        { value: ltrStats ? ltrStats.cities.toString() : '—', label: t('cities') },
        { value: ltrStats ? ltrStats.sources.toString() : '—', label: t('ltrSources') },
        { value: t('daily'), label: t('update') },
      ];

  return (
    <div className="bg-gradient-to-b from-[#F4F6F8] to-white pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block bg-[#5CE0D2]/10 text-[#0D7A72] text-xs font-semibold px-4 py-1 rounded-full mb-4">
          {t('badge')}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A2F3F] mb-3">{t('title')}</h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">{t('subtitle')}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {trustItems.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-[#1A2F3F] font-mono">{item.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
