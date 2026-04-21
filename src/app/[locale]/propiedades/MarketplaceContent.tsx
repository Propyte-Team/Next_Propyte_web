'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Map, List } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import type { Property } from '@/types/property';
import { useIsMobile } from '@/hooks/useMediaQuery';
import FilterBar from '@/components/marketplace/FilterBar';
import AdvancedFilters from '@/components/marketplace/AdvancedFilters';
import PropertyList from '@/components/marketplace/PropertyList';
import MapView from '@/components/marketplace/MapView';
import FilterChip from '@/components/ui/FilterChip';
import MobileBottomSheet from '@/components/marketplace/MobileBottomSheet';
import { MAX_PRICE } from '@/shared/constants/marketplace';
import { useCurrency } from '@/context/CurrencyContext';

interface MarketplaceContentProps {
  properties: Property[];
  titleKey?: 'h1Desarrollos' | 'h1Propiedades';
  subtitleKey?: 'subtitleDesarrollos' | 'subtitlePropiedades';
}

export default function MarketplaceContent({
  properties,
  titleKey = 'h1Propiedades',
  subtitleKey = 'subtitlePropiedades',
}: MarketplaceContentProps) {
  const t = useTranslations('marketplace');
  const isMobile = useIsMobile();
  const { currency, toggleCurrency } = useCurrency();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const { filters, filtered, updateFilter, clearFilters, sortBy, setSortBy } = useFilters(properties);

  const priceFmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filters.search) {
    activeChips.push({ label: `"${filters.search}"`, onRemove: () => updateFilter('search', '') });
  }
  if (filters.city) activeChips.push({ label: filters.city, onRemove: () => updateFilter('city', '') });
  if (filters.type) activeChips.push({ label: filters.type, onRemove: () => updateFilter('type', '') });
  if (filters.stage) activeChips.push({ label: filters.stage, onRemove: () => updateFilter('stage', '') });
  if (filters.usage) activeChips.push({ label: filters.usage, onRemove: () => updateFilter('usage', '') });
  if (filters.roiMin) activeChips.push({ label: `ROI ${filters.roiMin}%+`, onRemove: () => updateFilter('roiMin', 0) });
  if (filters.priceMin > 0) {
    activeChips.push({
      label: `≥ ${priceFmt(filters.priceMin)}`,
      onRemove: () => updateFilter('priceMin', 0),
    });
  }
  if (filters.priceMax < MAX_PRICE) {
    activeChips.push({
      label: `≤ ${priceFmt(filters.priceMax)}`,
      onRemove: () => updateFilter('priceMax', MAX_PRICE),
    });
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] lg:h-[calc(100dvh-144px)]">
      {/* SEO heading — visible al top */}
      <div className="px-4 md:px-6 pt-4 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A2F3F]">{t(titleKey)}</h1>
            <p className="text-sm text-gray-500 mt-1">{t(subtitleKey)}</p>
          </div>
          <button
            onClick={toggleCurrency}
            className="flex-shrink-0 mt-1 h-8 px-3 text-xs font-bold border border-gray-200 rounded-lg hover:border-[#5CE0D2] hover:text-[#0D9488] transition-colors tabular-nums"
            aria-label={t('toggleCurrencyAriaLabel')}
          >
            {currency === 'MXN' ? 'MXN → USD' : 'USD → MXN'}
          </button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onOpenAdvanced={() => setShowAdvanced(true)}
        resultCount={filtered.length}
      />

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-white border-b">
          {activeChips.map((chip, i) => (
            <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-600 ml-2">
            {t('clearAll')}
          </button>
        </div>
      )}

      {/* Mobile toggle */}
      {isMobile && (
        <div className="flex border-b bg-white">
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mobileView === 'map' ? 'text-[#5CE0D2] border-b-2 border-[#5CE0D2]' : 'text-gray-500'}`}
          >
            <Map size={16} /> {t('mapView')}
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mobileView === 'list' ? 'text-[#5CE0D2] border-b-2 border-[#5CE0D2]' : 'text-gray-500'}`}
          >
            <List size={16} /> {t('listView')}
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {!isMobile ? (
          <>
            <div className="w-[60%] h-full">
              <MapView properties={filtered} />
            </div>
            <div className="w-[40%] h-full border-l">
              <PropertyList properties={filtered} sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </>
        ) : (
          <>
            {mobileView === 'map' ? (
              <div className="w-full h-full relative">
                <MapView properties={filtered} />
                <MobileBottomSheet properties={filtered} />
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto">
                <PropertyList properties={filtered} sortBy={sortBy} onSortChange={setSortBy} />
              </div>
            )}
          </>
        )}
      </div>

      <AdvancedFilters
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        filters={filters}
        onFilterChange={updateFilter}
        onClear={clearFilters}
      />
    </div>
  );
}
