'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { Filters } from '@/hooks/useFilters';
import type { PropertyStage, PropertyUsage } from '@/types/property';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onClear: () => void;
}

export default function AdvancedFilters({ isOpen, onClose, filters, onFilterChange, onClear }: AdvancedFiltersProps) {
  const t = useTranslations('marketplace');
  const tStages = useTranslations('stages');
  const tUsages = useTranslations('usages');

  if (!isOpen) return null;

  const stages: PropertyStage[] = ['preventa', 'construccion', 'entrega_inmediata'];
  const usages: PropertyUsage[] = ['residencial', 'vacacional', 'renta', 'mixto'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-md mx-4 p-6 shadow-xl" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{t('moreFilters')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-w-[48px] min-h-[48px] flex items-center justify-center" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterStage')}</label>
            <div className="flex flex-wrap gap-2">
              {stages.map(stage => (
                <button
                  key={stage}
                  onClick={() => onFilterChange('stage', filters.stage === stage ? '' : stage)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${filters.stage === stage ? 'bg-[#5CE0D2] text-white border-[#5CE0D2]' : 'border-gray-200 hover:border-[#5CE0D2]'}`}
                >
                  {tStages(stage)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterUsage')}</label>
            <div className="flex flex-wrap gap-2">
              {usages.map(usage => (
                <button
                  key={usage}
                  onClick={() => onFilterChange('usage', filters.usage === usage ? '' : usage)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${filters.usage === usage ? 'bg-[#5CE0D2] text-white border-[#5CE0D2]' : 'border-gray-200 hover:border-[#5CE0D2]'}`}
                >
                  {tUsages(usage)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClear} className="flex-1 h-11 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            {t('clearAll')}
          </button>
          <button onClick={onClose} className="flex-1 h-11 bg-[#5CE0D2] text-white rounded-lg text-sm font-medium hover:bg-[#4BCEC0] transition-colors">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
