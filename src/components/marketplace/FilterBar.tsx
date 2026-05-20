'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, ChevronDown, X, Search } from '@/lib/icons';
import { AnimatePresence, motion } from 'framer-motion';
import type { Filters } from '@/hooks/useFilters';
import { MAX_PRICE } from '@/shared/constants/marketplace';
import CurrencyToggle from '@/components/ui/CurrencyToggle';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onOpenAdvanced: () => void;
  advancedOpen: boolean;
  resultCount: number;
  /** Lista dinámica de ciudades disponibles en el listado actual. Si vacía,
   *  cae al hardcoded ['Playa del Carmen', 'Tulum']. */
  availableCities?: string[];
  /** Lista dinámica de zonas — se filtra por ciudad seleccionada en el padre. */
  availableZones?: string[];
  /** Mostrar pill de tipo desarrollo (solo /desarrollos). */
  showDevTypeFilter?: boolean;
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
            ? 'bg-propyte-cyan-100 border-propyte-brand text-[#0E7490]'
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

export default function FilterBar({
  filters,
  onFilterChange,
  onOpenAdvanced,
  advancedOpen,
  resultCount,
  availableCities,
  availableZones,
  showDevTypeFilter = false,
}: FilterBarProps) {
  const t = useTranslations('marketplace');
  const tTypes = useTranslations('types');
  const tStages = useTranslations('stages');
  const tUsages = useTranslations('usages');
  const tDevTypes = useTranslations('developmentTypes');

  const safeType = (type: string) => {
    try { return tTypes(type as 'departamento'); } catch { return type; }
  };
  const safeStage = (stage: string) => {
    try { return tStages(stage as 'preventa'); } catch { return stage; }
  };
  const safeUsage = (u: string) => {
    try { return tUsages(u as 'residencial'); } catch { return u; }
  };
  const safeDevType = (k: string) => {
    try { return tDevTypes(k as 'mixto'); } catch { return k; }
  };

  // Fallback cities cuando el padre no pasa lista dinámica.
  const cityOptions = (availableCities && availableCities.length > 0)
    ? availableCities
    : ['Playa del Carmen', 'Tulum'];
  const zoneOptions = availableZones || [];

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
    (filters.zone ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.bedroomsMin > 0 ? 1 : 0) +
    (filters.stage ? 1 : 0) +
    (filters.developmentType ? 1 : 0) +
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
      clear: () => { onFilterChange('city', ''); onFilterChange('zone', ''); },
    });
  }
  if (filters.zone) {
    activeChips.push({
      key: 'zone',
      label: filters.zone,
      clear: () => onFilterChange('zone', ''),
    });
  }
  if (filters.bedroomsMin > 0) {
    activeChips.push({
      key: 'bedrooms',
      label: filters.bedroomsMin >= 4 ? '4+ rec' : `${filters.bedroomsMin} rec`,
      clear: () => onFilterChange('bedroomsMin', 0),
    });
  }
  if (filters.developmentType) {
    activeChips.push({
      key: 'devType',
      label: safeDevType(filters.developmentType),
      clear: () => onFilterChange('developmentType', ''),
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
      label: safeType(filters.type),
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
  if (filters.stage) {
    activeChips.push({
      key: 'stage',
      label: safeStage(filters.stage),
      clear: () => onFilterChange('stage', ''),
    });
  }
  if (filters.usage) {
    activeChips.push({
      key: 'usage',
      label: safeUsage(filters.usage),
      clear: () => onFilterChange('usage', ''),
    });
  }

  const handleClearAll = () => {
    if (filters.search) onFilterChange('search', '');
    if (filters.city) onFilterChange('city', '');
    if (filters.zone) onFilterChange('zone', '');
    if (priceActive) {
      onFilterChange('priceMin', 0);
      onFilterChange('priceMax', MAX_PRICE);
    }
    if (filters.type) onFilterChange('type', '');
    if (filters.bedroomsMin > 0) onFilterChange('bedroomsMin', 0);
    if (filters.developmentType) onFilterChange('developmentType', '');
    if (filters.roiMin) onFilterChange('roiMin', 0);
    if (filters.stage) onFilterChange('stage', '');
    if (filters.usage) onFilterChange('usage', '');
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
            <span className="bg-propyte-brand text-[#0F1923] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
          {t('results', { count: resultCount })}
        </span>
      </div>

      {/* Desktop: full pills row */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Search input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <label htmlFor="marketplace-search" className="sr-only">
            {t('searchPlaceholder')}
          </label>
          <input
            id="marketplace-search"
            type="text"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-10 w-44 lg:w-56 pl-9 pr-3 rounded-full border border-gray-300 text-sm focus:border-propyte-brand focus:outline-none"
          />
        </div>

        {/* Ciudad pill (dinámica) */}
        <PillDropdown
          label={t('filterLocation')}
          activeLabel={filters.city || undefined}
          isActive={!!filters.city}
        >
          <div className="space-y-1 max-h-72 overflow-y-auto">
            <button
              onClick={() => { onFilterChange('city', ''); onFilterChange('zone', ''); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !filters.city ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              {t('filterAll')}
            </button>
            {cityOptions.map((city) => (
              <button
                key={city}
                onClick={() => {
                  // Al cambiar ciudad reseteamos zona — si la zona seleccionada
                  // no pertenece a la nueva ciudad, quedaría 0 resultados.
                  onFilterChange('city', filters.city === city ? '' : city);
                  onFilterChange('zone', '');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.city === city ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* Zona pill (visible solo cuando hay ciudad seleccionada y zonas) */}
        {filters.city && zoneOptions.length > 0 && (
          <PillDropdown
            label={t('filterZone')}
            activeLabel={filters.zone || undefined}
            isActive={!!filters.zone}
          >
            <div className="space-y-1 max-h-72 overflow-y-auto">
              <button
                onClick={() => onFilterChange('zone', '')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !filters.zone ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {t('filterAll')}
              </button>
              {zoneOptions.map((zone) => (
                <button
                  key={zone}
                  onClick={() => onFilterChange('zone', filters.zone === zone ? '' : zone)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.zone === zone ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </PillDropdown>
        )}

        {/* Price pill */}
        <PillDropdown label={t('filterPrice')} activeLabel={priceLabel} isActive={priceActive}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('filterPriceRange')}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.priceMin || ''}
                onChange={e => onFilterChange('priceMin', Number(e.target.value) || 0)}
                placeholder="Min"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
              />
              <span className="text-gray-600 text-sm">—</span>
              <input
                type="number"
                value={filters.priceMax < MAX_PRICE ? filters.priceMax : ''}
                onChange={e => onFilterChange('priceMax', Number(e.target.value) || MAX_PRICE)}
                placeholder="Max"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
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
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-full hover:border-[#0E7490] hover:text-[#0E7490] transition-colors"
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
          activeLabel={filters.type ? safeType(filters.type) : undefined}
          isActive={!!filters.type}
        >
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange('type', '')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !filters.type ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              {t('filterAll')}
            </button>
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onFilterChange('type', filters.type === opt.value ? '' : opt.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.type === opt.value ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* Recámaras pill */}
        <PillDropdown
          label={t('filterBedrooms')}
          activeLabel={filters.bedroomsMin > 0
            ? (filters.bedroomsMin >= 4 ? '4+ rec' : `${filters.bedroomsMin} rec`)
            : undefined}
          isActive={filters.bedroomsMin > 0}
        >
          <div className="space-y-1">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => onFilterChange('bedroomsMin', filters.bedroomsMin === n ? 0 : n)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.bedroomsMin === n ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {n === 0 ? t('filterAll') : n >= 4 ? '4+ rec' : `${n} rec`}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* Etapa pill */}
        <PillDropdown
          label={t('filterStage')}
          activeLabel={filters.stage ? safeStage(filters.stage) : undefined}
          isActive={!!filters.stage}
        >
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange('stage', '')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !filters.stage ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              {t('filterAll')}
            </button>
            {(['preventa', 'construccion', 'entrega_inmediata'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onFilterChange('stage', filters.stage === s ? '' : s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.stage === s ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {safeStage(s)}
              </button>
            ))}
          </div>
        </PillDropdown>

        {/* Tipo desarrollo pill — solo /desarrollos */}
        {showDevTypeFilter && (
          <PillDropdown
            label={t('filterDevType')}
            activeLabel={filters.developmentType ? safeDevType(filters.developmentType) : undefined}
            isActive={!!filters.developmentType}
          >
            <div className="space-y-1 max-h-72 overflow-y-auto">
              <button
                onClick={() => onFilterChange('developmentType', '')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !filters.developmentType ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                {t('filterAll')}
              </button>
              {[
                'residencial-vertical',
                'residencial-horizontal',
                'mixto',
                'comercial',
                'hotelero',
                'torre-oficinas',
                'condominio',
                'townhouse',
                'lotes',
                'macrolotes',
              ].map((dt) => (
                <button
                  key={dt}
                  onClick={() => onFilterChange('developmentType', filters.developmentType === dt ? '' : dt)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.developmentType === dt ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  {safeDevType(dt)}
                </button>
              ))}
            </div>
          </PillDropdown>
        )}

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
                  filters.roiMin === roi ? 'bg-propyte-cyan-100 text-[#0E7490] font-semibold' : 'hover:bg-gray-50'
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
        <span className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
          {t('results', { count: resultCount })}
        </span>
      </div>

      {/* Active filter chips (mobile + desktop) */}
      {activeChips.length > 0 && (
        <div
          className="mt-2 flex flex-wrap gap-1.5 items-center"
          aria-label={t('activeFilters')}
        >
          <AnimatePresence initial={false}>
            {activeChips.map((chip) => (
              <motion.button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                aria-label={`${t('removeFilter')}: ${chip.label}`}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
                className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-propyte-cyan-100 border border-propyte-brand/40 text-xs font-semibold text-[#0E7490] hover:bg-propyte-cyan-200 hover:border-propyte-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
              >
                <span className="truncate max-w-[180px]">{chip.label}</span>
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </motion.button>
            ))}
            {activeChips.length > 1 && (
              <motion.button
                key="clear-all"
                type="button"
                onClick={handleClearAll}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold text-gray-600 hover:text-[#1A2F3F] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
              >
                {t('clearAll')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
