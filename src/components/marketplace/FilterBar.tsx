'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, ChevronDown, Search, Bookmark } from 'lucide-react';
import type { Filters } from '@/hooks/useFilters';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onOpenAdvanced: () => void;
  resultCount: number;
}

function PillDropdown({
  label,
  activeLabel,
  isActive,
  children,
}: {
  label: string;
  activeLabel?: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`h-10 px-4 flex items-center gap-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
          isActive
            ? 'bg-[#5CE0D2]/10 border-[#5CE0D2] text-[#4BCEC0]'
            : 'bg-white border-gray-300 text-[#2C2C2C] hover:border-gray-400'
        }`}
      >
        {activeLabel || label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[260px]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ filters, onFilterChange, onOpenAdvanced, resultCount }: FilterBarProps) {
  const t = useTranslations('marketplace');
  const tTypes = useTranslations('types');

  const priceActive = filters.priceMin > 0 || filters.priceMax < 50_000_000;
  const priceLabel = priceActive
    ? `$${(filters.priceMin / 1_000_000).toFixed(1)}M – $${filters.priceMax >= 50_000_000 ? 'Max' : (filters.priceMax / 1_000_000).toFixed(1) + 'M'}`
    : undefined;

  const typeOptions = [
    { value: 'departamento', label: tTypes('departamento') },
    { value: 'penthouse', label: tTypes('penthouse') },
    { value: 'casa', label: tTypes('casa') },
    { value: 'terreno', label: tTypes('terreno') },
    { value: 'macrolote', label: tTypes('macrolote') },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Search input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-10 w-44 lg:w-56 pl-9 pr-3 rounded-full border border-gray-300 text-sm focus:border-[#5CE0D2] focus:outline-none"
          />
        </div>

        {/* Location pill */}
        <PillDropdown
          label={t('filterLocation')}
          activeLabel={filters.city || undefined}
          isActive={!!filters.city}
        >
          <div className="space-y-1">
            {['', 'Playa del Carmen', 'Tulum'].map(city => (
              <button
                key={city}
                onClick={() => onFilterChange('city', city)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.city === city ? 'bg-[#5CE0D2]/10 text-[#4BCEC0] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {city || t('filterAll')}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* Price pill */}
        <PillDropdown label={t('filterPrice')} activeLabel={priceLabel} isActive={priceActive}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterPriceRange')}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.priceMin || ''}
                onChange={e => onFilterChange('priceMin', Number(e.target.value) || 0)}
                placeholder="Min"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="number"
                value={filters.priceMax < 50_000_000 ? filters.priceMax : ''}
                onChange={e => onFilterChange('priceMax', Number(e.target.value) || 50_000_000)}
                placeholder="Max"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '< $3M', min: 0, max: 3_000_000 },
                { label: '$3M–$5M', min: 3_000_000, max: 5_000_000 },
                { label: '$5M–$10M', min: 5_000_000, max: 10_000_000 },
                { label: '$10M+', min: 10_000_000, max: 50_000_000 },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => { onFilterChange('priceMin', p.min); onFilterChange('priceMax', p.max); }}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-full hover:border-[#5CE0D2] hover:text-[#5CE0D2] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </PillDropdown>

        {/* Type pill */}
        <PillDropdown
          label={t('filterType')}
          activeLabel={filters.type ? tTypes(filters.type as 'departamento') : undefined}
          isActive={!!filters.type}
        >
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange('type', '')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !filters.type ? 'bg-[#5CE0D2]/10 text-[#4BCEC0] font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              {t('filterAll')}
            </button>
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onFilterChange('type', filters.type === opt.value ? '' : opt.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.type === opt.value ? 'bg-[#5CE0D2]/10 text-[#4BCEC0] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* ROI pill */}
        <PillDropdown
          label="ROI"
          activeLabel={filters.roiMin ? `ROI ${filters.roiMin}%+` : undefined}
          isActive={!!filters.roiMin}
        >
          <div className="space-y-1">
            {[0, 5, 8, 10, 12, 15].map(roi => (
              <button
                key={roi}
                onClick={() => onFilterChange('roiMin', roi)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.roiMin === roi ? 'bg-[#5CE0D2]/10 text-[#4BCEC0] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {roi === 0 ? t('filterAll') : `${roi}%+`}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* More Filters */}
        <button
          onClick={onOpenAdvanced}
          className="h-10 px-4 flex items-center gap-1.5 rounded-full border border-gray-300 text-sm font-semibold text-[#2C2C2C] hover:border-gray-400 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <SlidersHorizontal size={14} />
          {t('moreFilters')}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save search */}
        <button className="hidden md:flex h-10 px-4 items-center gap-1.5 rounded-full border border-gray-300 text-sm font-semibold text-[#2C2C2C] hover:border-gray-400 transition-colors whitespace-nowrap flex-shrink-0">
          <Bookmark size={14} />
          {t('saveSearch')}
        </button>

        {/* Result count */}
        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
          {t('results', { count: resultCount })}
        </span>
      </div>
    </div>
  );
}
