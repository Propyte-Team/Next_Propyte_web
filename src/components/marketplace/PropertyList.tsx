'use client';

import { useTranslations } from 'next-intl';
import MarketplaceCard from './MarketplaceCard';
import type { Property } from '@/types/property';

interface PropertyListProps {
  properties: Property[];
  sortBy: string;
  onSortChange: (sort: 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date') => void;
  /**
   * `compact` (default): grid 1-2 cols, hereda h-full y scrollea internamente
   * (caso split map+list de /desarrollos). `grid`: grid 1-2-3-4 cols full-width
   * sin altura fija, fluye con el viewport (caso /propiedades).
   */
  variant?: 'compact' | 'grid';
  /** Hover sync map↔card (solo split /propiedades). */
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

export default function PropertyList({
  properties,
  sortBy,
  onSortChange,
  variant = 'compact',
  hoveredId,
  onHover,
}: PropertyListProps) {
  const t = useTranslations('marketplace');

  if (variant === 'grid') {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-[#2C2C2C]">
            {t('results', { count: properties.length })}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{t('sortBy')}:</span>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date')}
              className="text-sm font-semibold border-0 bg-transparent text-[#2C2C2C] focus:outline-none cursor-pointer"
              aria-label={t('sortBy')}
            >
              <option value="relevance">{t('sortRelevance')}</option>
              <option value="price_asc">{t('sortPriceAsc')}</option>
              <option value="price_desc">{t('sortPriceDesc')}</option>
              <option value="roi">{t('sortRoi')}</option>
              <option value="date">{t('sortDate')}</option>
            </select>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 font-semibold text-lg">{t('noResults')}</p>
            <p className="text-sm text-gray-600 mt-2">{t('noResultsSuggestion')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7">
            {properties.map((property, i) => (
              <MarketplaceCard
                key={property.id}
                property={property}
                priority={i < 8}
                hoveredId={hoveredId}
                onHover={onHover}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <span className="text-sm font-semibold text-[#2C2C2C]">
          {t('results', { count: properties.length })}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{t('sortBy')}:</span>
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date')}
            className="text-sm font-semibold border-0 bg-transparent text-[#2C2C2C] focus:outline-none cursor-pointer"
            aria-label={t('sortBy')}
          >
            <option value="relevance">{t('sortRelevance')}</option>
            <option value="price_asc">{t('sortPriceAsc')}</option>
            <option value="price_desc">{t('sortPriceDesc')}</option>
            <option value="roi">{t('sortRoi')}</option>
            <option value="date">{t('sortDate')}</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 font-semibold text-lg">{t('noResults')}</p>
            <p className="text-sm text-gray-600 mt-2">{t('noResultsSuggestion')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3">
            {properties.map((property, i) => (
              <MarketplaceCard
                key={property.id}
                property={property}
                priority={i < 6}
                hoveredId={hoveredId}
                onHover={onHover}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
