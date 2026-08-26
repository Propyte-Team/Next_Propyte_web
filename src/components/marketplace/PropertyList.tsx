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
  /** Presente solo cuando hay filtros activos — habilita el CTA del empty state. */
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export default function PropertyList({
  properties,
  sortBy,
  onSortChange,
  variant = 'compact',
  hoveredId,
  onHover,
  hasActiveFilters,
  onClearFilters,
}: PropertyListProps) {
  const t = useTranslations('marketplace');

  const emptyState = (
    <>
      <p className="text-gray-600 font-semibold text-lg">{t('noResults')}</p>
      <p className="text-sm text-gray-600 mt-2">{t('noResultsSuggestion')}</p>
      {hasActiveFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center min-h-[44px] px-5 mt-5 text-sm font-semibold text-white bg-navy hover:bg-aztec rounded-lg transition-colors"
        >
          {t('clearAll')}
        </button>
      )}
    </>
  );

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
              className="min-h-[44px] py-2 text-sm font-semibold border-0 bg-transparent text-[#2C2C2C] focus:outline-none cursor-pointer touch-manipulation"
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
          <div className="text-center py-20">{emptyState}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7">
            {properties.map((property, i) => (
              <MarketplaceCard
                key={property.id}
                property={property}
                priority={i < 8}
                hoveredId={hoveredId}
                onHover={onHover}
                variant="grid"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    // `h-full` solo en escritorio: en móvil encerraba la lista en el alto del
    // shell y obligaba al scroller anidado de abajo.
    <div className="flex flex-col lg:h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <span className="text-sm font-semibold text-[#2C2C2C]">
          {t('results', { count: properties.length })}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{t('sortBy')}:</span>
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as 'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date')}
            className="min-h-[44px] py-2 text-sm font-semibold border-0 bg-transparent text-[#2C2C2C] focus:outline-none cursor-pointer touch-manipulation"
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

      {/*
        El scroller propio es SOLO de escritorio, donde la lista convive con el
        mapa en un split de altura fija. En móvil ese mismo shell dejaba 49
        resultados asomando por una ventana de 571 px sobre 12.691 px de
        contenido, con `overscroll-contain` impidiendo que el scroll de la
        página encadenara: dos regiones compitiendo y ninguna señal de cuál
        mueve qué. Por debajo de `lg` la lista fluye en el documento.

        `data-lenis-prevent` se queda sin condicionar: Lenis solo suaviza la
        rueda (`smoothWheel`, sin `syncTouch`), y en móvil el scroll es táctil,
        así que el atributo no interviene.
      */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:overscroll-contain" data-lenis-prevent>
        {properties.length === 0 ? (
          <div className="text-center py-16">{emptyState}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
            {properties.map((property, i) => (
              <MarketplaceCard
                key={property.id}
                property={property}
                priority={i < 6}
                hoveredId={hoveredId}
                onHover={onHover}
                variant="compact"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
