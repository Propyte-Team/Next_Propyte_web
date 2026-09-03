'use client';

import { useTranslations } from 'next-intl';
import { X } from '@/lib/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Filters } from '@/hooks/useFilters';
import type { PropertyStage, PropertyUsage } from '@/types/property';
import { normalizeDevTypeKey } from '@/lib/i18n/normalizeKey';
import { CITY_MAP } from '@/app/[locale]/desarrollos/_components/cityConfig';
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';
import { MAX_PRICE } from '@/shared/constants/marketplace';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  /** Cambio de varias claves en una sola actualización (ciudad+zona, rango de
   *  precio). Dos `onFilterChange` seguidos disparan dos navegaciones. */
  onFiltersChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  /** Mismos props que FilterBar — en mobile este modal es la ÚNICA forma de
   *  llegar a estos filtros (la fila de pills de escritorio está oculta),
   *  así que necesita las mismas dimensiones, no solo Etapa/Uso. */
  availableCities?: string[];
  availableZones?: string[];
  showDevTypeFilter?: boolean;
  priceCeiling?: number;
}

const PRICE_QUICK_PICKS = (ceiling: number) => [
  { label: '< $3M', min: 0, max: 3_000_000 },
  { label: '$3M–$5M', min: 3_000_000, max: 5_000_000 },
  { label: '$5M–$10M', min: 5_000_000, max: 10_000_000 },
  { label: '$10M+', min: 10_000_000, max: ceiling },
];

const DEV_TYPES = [
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
];

const ROI_OPTIONS = [0, 5, 8, 10, 12, 15];

function pillClass(active: boolean) {
  return `px-3 py-2 rounded-lg text-sm border transition-colors ${
    active ? 'bg-propyte-brand text-aztec border-propyte-brand' : 'border-gray-200 hover:border-propyte-brand'
  }`;
}

export default function AdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onFiltersChange,
  onClear,
  availableCities,
  availableZones,
  showDevTypeFilter = false,
  priceCeiling = MAX_PRICE,
}: AdvancedFiltersProps) {
  const t = useTranslations('marketplace');
  const tTypes = useTranslations('types');
  const tStages = useTranslations('stages');
  const tUsages = useTranslations('usages');
  const tDevTypes = useTranslations('developmentTypes');
  const { containerRef, initialFocusRef } = useFocusTrap<HTMLDivElement>({ isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const safeDevType = (k: string) => tDevTypes(normalizeDevTypeKey(k) as 'mixto');
  const stages: PropertyStage[] = ['preventa', 'construccion', 'entrega_inmediata'];
  const usages: PropertyUsage[] = ['residencial', 'vacacional', 'renta', 'mixto'];
  const cityOptions = (availableCities && availableCities.length > 0)
    ? availableCities
    : Object.values(CITY_MAP).map((c) => c.name);
  const zoneOptions = availableZones || [];
  const typeOptions = PRODUCT_TYPES.map((ty) => ({ value: ty, label: tTypes(ty) }));

  // z-[60]: por encima de WhatsAppButton y CookieBanner (ambos z-50/z-[55]) —
  // mismo fix aplicado en ComparePanel para este solapamiento conocido.
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={containerRef}
        id="advanced-filters-dialog"
        className="relative bg-white rounded-xl w-full max-w-md mx-4 max-h-[85vh] shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-filters-title"
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 id="advanced-filters-title" className="text-lg font-semibold">{t('moreFilters')}</h3>
          <button ref={initialFocusRef} onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-w-[48px] min-h-[48px] flex items-center justify-center" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Todo lo que la fila de pills de escritorio ya ofrece vive aquí y se
              oculta en >=md: duplicar Ubicación/Precio/Tipo/Recámaras/Etapa/ROI
              dentro del modal solo daba dos controles para el mismo filtro. En
              mobile esa fila está oculta y este modal es la ÚNICA vía, así que
              ahí siguen visibles todos. Uso queda fuera del wrapper porque no
              tiene pill propia en ningún viewport. */}
          <div className="md:hidden space-y-6">
            {/* Búsqueda — sin equivalente en mobile antes de esto (la fila de
                pills de escritorio, incluida la caja de búsqueda, está oculta
                por completo en pantallas <md). */}
            <div>
              <label htmlFor="advanced-search" className="block text-sm font-medium text-gray-700 mb-2">
                {t('searchPlaceholder')}
              </label>
              <input
                id="advanced-search"
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterLocation')}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onFiltersChange({ city: '', zone: '' })}
                  className={pillClass(!filters.city)}
                >
                  {t('filterAll')}
                </button>
                {cityOptions.map((city) => (
                  <button
                    key={city}
                    onClick={() => onFiltersChange({ city: filters.city === city ? '' : city, zone: '' })}
                    className={pillClass(filters.city === city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {filters.city && zoneOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterZone')}</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onFilterChange('zone', '')} className={pillClass(!filters.zone)}>
                    {t('filterAll')}
                  </button>
                  {zoneOptions.map((zone) => (
                    <button
                      key={zone}
                      onClick={() => onFilterChange('zone', filters.zone === zone ? '' : zone)}
                      className={pillClass(filters.zone === zone)}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterPriceRange')}</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={filters.priceMin || ''}
                  onChange={(e) => onFilterChange('priceMin', Number(e.target.value) || 0)}
                  placeholder="Min"
                  aria-label={t('filterPriceMin')}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
                />
                <span className="text-gray-600 text-sm">—</span>
                <input
                  type="number"
                  value={filters.priceMax < priceCeiling ? filters.priceMax : ''}
                  onChange={(e) => onFilterChange('priceMax', Number(e.target.value) || priceCeiling)}
                  placeholder="Max"
                  aria-label={t('filterPriceMax')}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRICE_QUICK_PICKS(priceCeiling).map((p) => {
                  const active = filters.priceMin === p.min && filters.priceMax === p.max;
                  return (
                    <button
                      key={p.label}
                      // Toggle: sin esto el atajo no se podía deshacer más que
                      // editando los dos inputs a mano.
                      onClick={() => onFiltersChange(
                        active
                          ? { priceMin: 0, priceMax: priceCeiling }
                          : { priceMin: p.min, priceMax: p.max },
                      )}
                      aria-pressed={active}
                      className={`px-3 py-1.5 text-xs border rounded-full transition-colors ${
                        active
                          ? 'bg-propyte-brand text-aztec border-propyte-brand'
                          : 'border-gray-200 hover:border-teal-a11y hover:text-teal-a11y'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterType')}</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onFilterChange('type', '')} className={pillClass(!filters.type)}>
                  {t('filterAll')}
                </button>
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange('type', filters.type === opt.value ? '' : opt.value)}
                    className={pillClass(filters.type === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterBedrooms')}</label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => onFilterChange('bedroomsMin', filters.bedroomsMin === n ? 0 : n)}
                    className={pillClass(filters.bedroomsMin === n)}
                  >
                    {n === 0 ? t('filterAll') : n >= 4 ? '4+ rec' : `${n} rec`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterStage')}</label>
              <div className="flex flex-wrap gap-2">
                {stages.map(stage => (
                  <button
                    key={stage}
                    onClick={() => onFilterChange('stage', filters.stage === stage ? '' : stage)}
                    className={pillClass(filters.stage === stage)}
                  >
                    {tStages(stage)}
                  </button>
                ))}
              </div>
            </div>

            {showDevTypeFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterDevType')}</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onFilterChange('developmentType', '')} className={pillClass(!filters.developmentType)}>
                    {t('filterAll')}
                  </button>
                  {DEV_TYPES.map((dt) => (
                    <button
                      key={dt}
                      onClick={() => onFilterChange('developmentType', filters.developmentType === dt ? '' : dt)}
                      className={pillClass(filters.developmentType === dt)}
                    >
                      {safeDevType(dt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ROI</label>
              <div className="flex flex-wrap gap-2">
                {ROI_OPTIONS.map((roi) => (
                  <button
                    key={roi}
                    onClick={() => onFilterChange('roiMin', roi)}
                    className={pillClass(filters.roiMin === roi)}
                  >
                    {roi === 0 ? t('filterAll') : `${roi}%+`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterUsage')}</label>
            <div className="flex flex-wrap gap-2">
              {usages.map(usage => (
                <button
                  key={usage}
                  onClick={() => onFilterChange('usage', filters.usage === usage ? '' : usage)}
                  className={pillClass(filters.usage === usage)}
                >
                  {tUsages(usage)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClear} className="flex-1 h-11 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            {t('clearAll')}
          </button>
          <button onClick={onClose} className="flex-1 h-11 bg-propyte-brand text-aztec rounded-lg text-sm font-medium hover:bg-propyte-cyan-300! transition-colors">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
