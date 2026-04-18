'use client';

import { useTranslations } from 'next-intl';
import MarketplaceCard from './MarketplaceCard';
import type { Property } from '@/types/property';

interface PropertyListProps {
  properties: Property[];
  sortBy: string;
  onSortChange: (sort: 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date') => void;
}

export default function PropertyList({ properties, sortBy, onSortChange }: PropertyListProps) {
  const t = useTranslations('marketplace');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <span className="text-sm font-semibold text-[#2C2C2C]">
          {t('results', { count: properties.length })}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{t('sortBy')}:</span>
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

      <div className="flex-1 overflow-y-auto">
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-semibold text-lg">{t('noResults')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('noResultsSuggestion')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {properties.map(property => (
              <MarketplaceCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
