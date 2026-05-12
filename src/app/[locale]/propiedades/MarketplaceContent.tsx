'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Map, List, X, Sparkles } from 'lucide-react';
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

/**
 * Heading band con identidad Propyte: eyebrow pill brand + H1 con accent
 * cyan en la última palabra + orb decorativo brand/15 translúcido.
 * Compact: 1 banda integrada al canvas, no un hero pesado (los marketplaces
 * priorizan filtros + cards, no el hero).
 */
function MarketplaceHero({ heading, subheading, eyebrow }: { heading: string; subheading: string; eyebrow: string }) {
  // Split último token para acento — soporta locales ES/EN, fallback: heading completo si 1 palabra.
  const tokens = heading.trim().split(/\s+/);
  const lastWord = tokens.length > 1 ? tokens[tokens.length - 1] : '';
  const restOfHeading = tokens.length > 1 ? tokens.slice(0, -1).join(' ') : heading;
  return (
    <div className="relative overflow-hidden bg-white border-b border-gray-100">
      {/* Glow brand sutil — anclado top-right para no competir con el contenido */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-propyte-brand/15 rounded-full blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-96 h-96 bg-propyte-brand/8 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 pt-7 md:pt-9 pb-5 md:pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-4">
          <Sparkles size={12} strokeWidth={2.25} className="text-[#0F766E]" />
          <span className="text-[#0F766E] text-2xs font-bold tracking-[0.18em] uppercase">{eyebrow}</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#1A2F3F] leading-[1.1] tracking-tight">
          {restOfHeading}
          {lastWord && (
            <>
              {' '}
              <span className="text-[#0F766E]">{lastWord}</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl leading-relaxed">{subheading}</p>
      </div>
    </div>
  );
}

interface MarketplaceContentProps {
  properties: Property[];
  titleKey?: 'h1Desarrollos' | 'h1Propiedades';
  subtitleKey?: 'subtitleDesarrollos' | 'subtitlePropiedades';
  /** Override i18n key with explicit string (used by taxonomy pages). */
  customTitle?: string;
  /** Override i18n key with explicit string (used by taxonomy pages). */
  customSubtitle?: string;
  /**
   * Split map+list layout. Decisión arquitectónica 2026-05-11:
   * /propiedades → showMap=true (cluster pin "+N" filtra el listado);
   * /desarrollos + taxonomies → showMap=false (grid Ficha 02 full-width).
   */
  showMap?: boolean;
}

export default function MarketplaceContent({
  properties,
  titleKey = 'h1Propiedades',
  subtitleKey = 'subtitlePropiedades',
  customTitle,
  customSubtitle,
  showMap = false,
}: MarketplaceContentProps) {
  const t = useTranslations('marketplace');
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  // Filtro on-cluster-click: cuando el usuario clickea un pin "+N" en el mapa,
  // guardamos los IDs de las unidades agrupadas y restringimos el listado.
  const [clusterFilter, setClusterFilter] = useState<string[] | null>(null);
  const { filters, filtered, updateFilter, clearFilters, sortBy, setSortBy } = useFilters(properties);

  const heading = customTitle ?? t(titleKey);
  const subheading = customSubtitle ?? t(subtitleKey);
  // Eyebrow pill: canonical Propyte tagline para todas las listadas (ES/EN).
  const eyebrowLabel = t('heroEyebrow');

  // Cualquier cambio en los filtros normales invalida el cluster filter
  // (sino quedaría "pegado" mostrando IDs que ya no califican).
  useEffect(() => {
    setClusterFilter(null);
  }, [filters.search, filters.city, filters.type, filters.priceMin, filters.priceMax, filters.roiMin, filters.stage, filters.usage]);

  // Lista final visible en el sidebar: filtered intersect clusterFilter (si activo).
  const displayed = useMemo(() => {
    if (!clusterFilter || clusterFilter.length === 0) return filtered;
    const set = new Set(clusterFilter);
    return filtered.filter((p) => set.has(p.id));
  }, [filtered, clusterFilter]);

  // Debounced GA4 `search` event — fires 600ms after the user stops
  // tweaking filters. Skips the initial mount and the case where no
  // filters are active.
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

  // Layout split map+list (legacy + decisión 2026-05-11 para /propiedades)
  // vs grid full-width (decisión 2026-05-11 para /desarrollos + taxonomies).
  if (showMap) {
    return (
      <div className="flex flex-col min-h-[calc(100dvh-140px)] lg:min-h-[calc(100dvh-144px)]">
        <MarketplaceHero heading={heading} subheading={subheading} eyebrow={eyebrowLabel} />

        <FilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onOpenAdvanced={() => setShowAdvanced(true)}
          advancedOpen={showAdvanced}
          resultCount={displayed.length}
        />

        {/* Cluster filter chip — visible cuando el user clickeó un "+N" */}
        {clusterFilter && clusterFilter.length > 0 && (
          <div className="bg-propyte-cyan-100 border-b border-propyte-brand/30 px-4 md:px-6 py-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-[#0F766E]">
              {t('clusterFilterActive', { count: displayed.length })}
            </span>
            <button
              type="button"
              onClick={() => setClusterFilter(null)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-propyte-brand/40 hover:border-propyte-brand text-xs font-semibold text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
              aria-label={t('clusterFilterClear')}
            >
              {t('clusterFilterClear')} <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        )}

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
                <MapView properties={filtered} onClusterClick={setClusterFilter} />
              </div>
              <div className="w-[40%] h-full border-l">
                <PropertyList properties={displayed} sortBy={sortBy} onSortChange={setSortBy} />
              </div>
            </>
          ) : (
            <>
              {mobileView === 'map' ? (
                <div className="w-full h-full relative">
                  <MapView properties={filtered} onClusterClick={(ids) => { setClusterFilter(ids); setMobileView('list'); }} />
                  <MobileBottomSheet properties={displayed} />
                </div>
              ) : (
                <div className="w-full h-full overflow-y-auto">
                  <PropertyList properties={displayed} sortBy={sortBy} onSortChange={setSortBy} />
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

  // Grid full-width — /desarrollos + taxonomies sin mapa (estilo Ficha 02).
  return (
    <div className="propyte-marketplace-grid-canvas">
      <MarketplaceHero heading={heading} subheading={subheading} eyebrow={eyebrowLabel} />

      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onOpenAdvanced={() => setShowAdvanced(true)}
        advancedOpen={showAdvanced}
        resultCount={filtered.length}
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        <PropertyList
          properties={filtered}
          sortBy={sortBy}
          onSortChange={setSortBy}
          variant="grid"
        />
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
