'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Map, List } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import type { Property } from '@/types/property';
import { useIsMobile } from '@/hooks/useMediaQuery';
import FilterBar from '@/components/marketplace/FilterBar';
import AdvancedFilters from '@/components/marketplace/AdvancedFilters';
import PropertyList from '@/components/marketplace/PropertyList';
import MapView from '@/components/marketplace/MapView';
import MobileBottomSheet from '@/components/marketplace/MobileBottomSheet';
import ComparePanel from '@/components/marketplace/ComparePanel';
import { trackSearch } from '@/lib/analytics/track';
import { MAX_PRICE } from '@/shared/constants/marketplace';

interface MarketplaceContentProps {
  properties: Property[];
  titleKey?: 'h1Desarrollos' | 'h1Propiedades';
  subtitleKey?: 'subtitleDesarrollos' | 'subtitlePropiedades';
  /** Override i18n key with explicit string (used by taxonomy pages). */
  customTitle?: string;
  /** Override i18n key with explicit string (used by taxonomy pages). */
  customSubtitle?: string;
}

export default function MarketplaceContent({
  properties,
  titleKey = 'h1Propiedades',
  subtitleKey = 'subtitlePropiedades',
  customTitle,
  customSubtitle,
}: MarketplaceContentProps) {
  const t = useTranslations('marketplace');
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const { filters, filtered, updateFilter, clearFilters, sortBy, setSortBy } = useFilters(properties);

  const heading = customTitle ?? t(titleKey);
  const subheading = customSubtitle ?? t(subtitleKey);

  // Debounced GA4 `search` event — fires 600ms after the user stops
  // tweaking filters. Skips the initial mount (no signal worth recording
  // for a default landing) and skips the case where no filters are active.
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    const hasAnyFilter =
      !!filters.search ||
      !!filters.city ||
      !!filters.type ||
      filters.priceMin > 0 ||
      filters.priceMax < MAX_PRICE ||
      filters.roiMin > 0 ||
      !!filters.stage ||
      !!filters.usage;
    if (!hasAnyFilter) return;

    const timeout = window.setTimeout(() => {
      trackSearch({
        searchTerm: filters.search || undefined,
        filters: {
          city: filters.city || undefined,
          type: filters.type || undefined,
          stage: filters.stage || undefined,
          usage: filters.usage || undefined,
          priceMin: filters.priceMin || undefined,
          priceMax: filters.priceMax < MAX_PRICE ? filters.priceMax : undefined,
          roiMin: filters.roiMin || undefined,
        },
        resultCount: filtered.length,
      });
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [filters, filtered.length]);

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] lg:h-[calc(100dvh-144px)]">
      {/* SEO heading — visible al top */}
      <div className="px-4 md:px-6 pt-4 pb-3 bg-white border-b border-gray-100">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A2F3F]">{heading}</h1>
        <p className="text-sm text-gray-600 mt-1">{subheading}</p>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onOpenAdvanced={() => setShowAdvanced(true)}
        advancedOpen={showAdvanced}
        resultCount={filtered.length}
      />

      {/* Mobile toggle */}
      {isMobile && (
        <div className="flex border-b bg-white">
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mobileView === 'map' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-gray-600'}`}
          >
            <Map size={16} /> {t('mapView')}
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mobileView === 'list' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-gray-600'}`}
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

      <ComparePanel properties={properties} />
    </div>
  );
}
