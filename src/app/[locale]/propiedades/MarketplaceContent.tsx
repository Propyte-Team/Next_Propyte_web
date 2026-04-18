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

interface MarketplaceContentProps {
  properties: Property[];
}

export default function MarketplaceContent({ properties }: MarketplaceContentProps) {
  const t = useTranslations('marketplace');
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const { filters, filtered, updateFilter, clearFilters, activeFilterCount, sortBy, setSortBy } = useFilters(properties);

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filters.city) activeChips.push({ label: filters.city, onRemove: () => updateFilter('city', '') });
  if (filters.type) activeChips.push({ label: filters.type, onRemove: () => updateFilter('type', '') });
  if (filters.stage) activeChips.push({ label: filters.stage, onRemove: () => updateFilter('stage', '') });
  if (filters.usage) activeChips.push({ label: filters.usage, onRemove: () => updateFilter('usage', '') });
  if (filters.roiMin) activeChips.push({ label: `ROI ${filters.roiMin}%+`, onRemove: () => updateFilter('roiMin', 0) });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
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
        {/* Desktop: split view */}
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
