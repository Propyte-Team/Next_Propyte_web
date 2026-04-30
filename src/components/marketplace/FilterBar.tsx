'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, ChevronDown, Search, X } from 'lucide-react';
import type { Filters } from '@/hooks/useFilters';
import { MAX_PRICE } from '@/shared/constants/marketplace';
import CurrencyToggle from '@/components/ui/CurrencyToggle';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onOpenAdvanced: () => void;
  advancedOpen: boolean;
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
  const panelId = `fp-${label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()}`;

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
        type="button"
        data-filter-pill={label}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
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
        <div id={panelId} role="group" aria-label={label} className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[260px]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ filters, onFilterChange, onOpenAdvanced, advancedOpen, resultCount }: FilterBarProps) {
  const t = useTranslations('marketplace');
  const tTypes = useTranslations('types');

  const priceActive = filters.priceMin > 0 || filters.priceMax < MAX_PRICE;
  const priceLabel = priceActive
    ? `$${(filters.priceMin / 1_000_000).toFixed(1)}M – $${filters.priceMax >= MAX_PRICE ? 'Max' : (filters.priceMax / 1_000_000).toFixed(1) + 'M'}`
    : undefined;

  const typeOptions = [
    { value: 'departamento', label: tTypes('departamento') },
    { value: 'penthouse', label: tTypes('penthouse') },
    { value: 'casa', label: tTypes('casa') },
    { value: 'terreno', label: tTypes('terreno') },
    { value: 'macrolote', label: tTypes('macrolote') },
  ];

  const activeCount =
    (filters.city ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.roiMin ? 1 : 0) +
    (filters.search ? 1 : 0);

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.search) {
    activeChips.push({
      key: 'search',
      label: `"${filters.search}"`,
      clear: () => onFilterChange('search', ''),
    });
  }
  if (filters.city) {
    activeChips.push({
      key: 'city',
      label: filters.city,
      clear: () => onFilterChange('city', ''),
    });
  }
  if (priceActive && priceLabel) {
    activeChips.push({
      key: 'price',
      label: priceLabel,
      clear: () => {
        onFilterChange('priceMin', 0);
        onFilterChange('priceMax', MAX_PRICE);
      },
    });
  }
  if (filters.type) {
    activeChips.push({
      key: 'type',
      label: tTypes(filters.type as 'departamento'),
      clear: () => onFilterChange('type', ''),
    });
  }
  if (filters.roiMin) {
    activeChips.push({
      key: 'roi',
      label: `ROI ${filters.roiMin}%+`,
      clear: () => onFilterChange('roiMin', 0),
    });
  }

  const handleClearAll = () => {
    if (filters.search) onFilterChange('search', '');
    if (filters.city) onFilterChange('city', '');
    if (priceActive) {
      onFilterChange('priceMin', 0);
      onFilterChange('priceMax', MAX_PRICE);
    }
    if (filters.type) onFilterChange('type', '');
    if (filters.roiMin) onFilterChange('roiMin', 0);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      {/* Mobile: single button → opens MobileFilters drawer */}
      <div className="md:hidden flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenAdvanced}
          aria-haspopup="dialog"
          aria-expanded={advancedOpen}
          className="h-10 px-4 flex items-center gap-2 rounded-full border border-gray-300 text-sm font-semibold text-[#2C2C2C] hover:border-gray-400 transition-colors flex-shrink-0"
        >
          <SlidersHorizontal size={14} />
          {t('mobileFiltersButton')}
          {activeCount > 0 && (
            <span className="bg-[#5CE0D2] text-[#0F1923] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
          {t('results', { count: resultCount })}
        </span>
      </div>

      {/* Desktop: full pills row */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Search input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <label htmlFor="marketplace-search" className="sr-only">
            {t('searchPlaceholder')}
          </label>
          <input
            id="marketplace-search"
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
                value={filters.priceMax < MAX_PRICE ? filters.priceMax : ''}
                onChange={e => onFilterChange('priceMax', Number(e.target.value) || MAX_PRICE)}
                placeholder="Max"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '< $3M', min: 0, max: 3_000_000 },
                { label: '$3M–$5M', min: 3_000_000, max: 5_000_000 },
                { label: '$5M–$10M', min: 5_000_000, max: 10_000_000 },
                { label: '$10M+', min: 10_000_000, max: MAX_PRICE },
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
          aria-expanded={advancedOpen}
          aria-haspopup="dialog"
          aria-controls="advanced-filters-dialog"
          className="h-10 px-4 flex items-center gap-1.5 rounded-full border border-gray-300 text-sm font-semibold text-[#2C2C2C] hover:border-gray-400 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <SlidersHorizontal size={14} />
          {t('moreFilters')}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* MXN/USD toggle — desktop only; mobile has it in MobileHeader Row 1 */}
        <div className="hidden lg:inline-flex">
          <CurrencyToggle />
        </div>

        {/* Result count */}
        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
          {t('results', { count: resultCount })}
        </span>
      </div>

      {/* Active filter chips (mobile + desktop) */}
      {activeChips.length > 0 && (
        <div
          className="mt-2 flex flex-wrap gap-1.5 items-center"
          aria-label={t('activeFilters')}
        >
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              aria-label={`${t('removeFilter')}: ${chip.label}`}
              className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-[#5CE0D2]/10 border border-[#5CE0D2]/40 text-xs font-semibold text-[#0D9488] hover:bg-[#5CE0D2]/20 hover:border-[#5CE0D2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors"
            >
              <span className="truncate max-w-[180px]">{chip.label}</span>
              <X size={12} strokeWidth={2.5} aria-hidden="true" />
            </button>
          ))}
          {activeChips.length > 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold text-gray-500 hover:text-[#1A2F3F] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors"
            >
              {t('clearAll')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
