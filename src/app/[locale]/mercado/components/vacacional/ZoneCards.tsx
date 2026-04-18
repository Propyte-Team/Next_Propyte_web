'use client';

import { useState } from 'react';
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
}

const INITIAL_VISIBLE = 12;

export function ZoneCards({ scores, locale, sortField, sortDir, onSort }: ZoneCardsProps) {
  const isEn = locale === 'en';
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? scores : scores.slice(0, INITIAL_VISIBLE);
  const hasMore = scores.length > INITIAL_VISIBLE;

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc;

  const sortPills: { field: SortField; label: string }[] = [
    { field: 'score', label: isEn ? 'Index' : 'Índice' },
    { field: 'occupancy', label: isEn ? 'Occupancy' : 'Ocupación' },
    { field: 'adr', label: isEn ? 'Rate/night' : 'Tarifa/noche' },
    { field: 'listings', label: isEn ? 'Properties' : 'Propiedades' },
    { field: 'zone', label: isEn ? 'Name' : 'Nombre' },
  ];

  if (scores.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg">
          {isEn
            ? 'No zones found with the current filters.'
            : 'No se encontraron zonas con los filtros actuales.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            {isEn
              ? `View all ${scores.length} zones`
              : `Ver todas las ${scores.length} zonas`}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-gray-400 text-center">
        {isEn
          ? `Showing ${visible.length} of ${scores.length} zones`
          : `Mostrando ${visible.length} de ${scores.length} zonas`}
      </p>
    </div>
  );
}
