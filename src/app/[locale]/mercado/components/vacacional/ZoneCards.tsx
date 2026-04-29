'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SortAsc, SortDesc, BarChart3, ChevronDown } from 'lucide-react';
import { ZoneScoreCard } from '@/components/analytics/ZoneScoreCard';
import type { ZoneScore } from '@/lib/supabase/queries';

type SortField = 'score' | 'occupancy' | 'adr' | 'listings' | 'zone';
type SortDir = 'asc' | 'desc';

interface ZoneCardsProps {
  scores: ZoneScore[];
  locale: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  isFallback?: boolean;
}

const INITIAL_VISIBLE = 12;

export function ZoneCards({ scores, locale, sortField, sortDir, onSort, isFallback = false }: ZoneCardsProps) {
  const t = useTranslations('zoneCards');
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? scores : scores.slice(0, INITIAL_VISIBLE);
  const hasMore = scores.length > INITIAL_VISIBLE;

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc;

  const sortPills: { field: SortField; label: string }[] = [
    { field: 'score', label: t('sortIndex') },
    { field: 'occupancy', label: t('sortOccupancy') },
    { field: 'adr', label: t('sortRate') },
    { field: 'listings', label: t('sortProperties') },
    { field: 'zone', label: t('sortName') },
  ];

  if (scores.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg">{t('noZonesFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fallback banner */}
      {isFallback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          {t('noResultsFallback')}
        </div>
      )}

      {/* Sort pills */}
      <div className="flex flex-wrap gap-2">
        {sortPills.map(({ field, label }) => (
          <button
            key={field}
            onClick={() => onSort(field)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-colors ${
              sortField === field
                ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
            {sortField === field && <SortIcon className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((score) => {
          const slug = score.zone
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[/]/g, '-');
          return (
            <a key={score.id} href={`/${locale}/zonas/${slug}`} className="block">
              <ZoneScoreCard score={score} locale={locale} />
            </a>
          );
        })}
      </div>

      {/* Show all button */}
      {hasMore && !showAll && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-[#1A2F3F] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('viewAllZones', { count: scores.length })}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-gray-400 text-center">
        {t('showingOf', { visible: visible.length, total: scores.length })}
      </p>
    </div>
  );
}
