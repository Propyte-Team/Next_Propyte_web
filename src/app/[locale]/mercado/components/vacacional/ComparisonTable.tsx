'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown, ArrowUp, ArrowDown } from '@/lib/icons';
import { useCurrency } from '@/context/CurrencyContext';
import type { ZoneScore } from '@/lib/supabase/queries';
import { getZoneInfo } from '@/lib/rental-data/zone-names';
import { grossMonthlyIncome, omissionBadge } from '@/lib/rental-data/zone-metrics';

type TableSortField = 'zone' | 'score' | 'adr' | 'occupancy' | 'monthly' | 'listings' | 'competition';
type SortDir = 'asc' | 'desc';

interface ComparisonTableProps {
  scores: ZoneScore[];
  locale: string;
}

type CompetitionT = ReturnType<typeof useTranslations<'comparisonTable'>>;

function competitionLevel(listings: number, t: CompetitionT): string {
  if (listings > 200) return t('competitionHigh');
  if (listings > 50) return t('competitionModerate');
  return t('competitionLow');
}

function competitionSortValue(listings: number): number {
  if (listings > 200) return 3;
  if (listings > 50) return 2;
  return 1;
}

export function ComparisonTable({ scores, locale: _locale }: ComparisonTableProps) {
  const t = useTranslations('comparisonTable');
  const { formatMxn } = useCurrency();
  const format = formatMxn;
  const [sortField, setSortField] = useState<TableSortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: TableSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    const result = [...scores];
    result.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      switch (sortField) {
        case 'zone':
          va = getZoneInfo(a.zone).displayName;
          vb = getZoneInfo(b.zone).displayName;
          break;
        case 'score':
          va = a.score ?? 0;
          vb = b.score ?? 0;
          break;
        case 'adr':
          va = a.adr_p50_ttm ?? 0;
          vb = b.adr_p50_ttm ?? 0;
          break;
        case 'occupancy':
          va = a.occupancy_p50_ttm ?? 0;
          vb = b.occupancy_p50_ttm ?? 0;
          break;
        case 'monthly':
          va = grossMonthlyIncome(a.adr_p50_ttm, a.occupancy_p50_ttm) ?? 0;
          vb = grossMonthlyIncome(b.adr_p50_ttm, b.occupancy_p50_ttm) ?? 0;
          break;
        case 'listings':
          va = a.active_listings ?? 0;
          vb = b.active_listings ?? 0;
          break;
        case 'competition':
          va = competitionSortValue(a.active_listings ?? 0);
          vb = competitionSortValue(b.active_listings ?? 0);
          break;
      }

      if (typeof va === 'string') {
        return sortDir === 'asc'
          ? va.localeCompare(vb as string)
          : (vb as string).localeCompare(va);
      }
      return sortDir === 'asc'
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return result;
  }, [scores, sortField, sortDir]);

  const columns: { key: TableSortField; label: string; align?: 'left' | 'right' }[] = [
    { key: 'zone', label: t('colZone'), align: 'left' },
    { key: 'score', label: t('colIndex'), align: 'right' },
    { key: 'adr', label: t('colRate'), align: 'right' },
    { key: 'occupancy', label: t('colOccupancy'), align: 'right' },
    { key: 'monthly', label: t('colMonthlyIncome'), align: 'right' },
    { key: 'listings', label: t('colProperties'), align: 'right' },
    { key: 'competition', label: t('colCompetition'), align: 'right' },
  ];

  const SortIndicator = ({ field }: { field: TableSortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-teal-600" />
      : <ArrowDown className="w-3 h-3 text-teal-600" />;
  };

  if (scores.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">{t('fullComparison')}</h3>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map(({ key, label, align }) => (
                <th
                  key={key}
                  aria-sort={sortField === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`px-4 py-3 font-medium text-gray-600 transition-colors whitespace-nowrap ${
                    align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="inline-flex items-center gap-1 hover:bg-gray-100 transition-colors rounded px-1 -mx-1"
                  >
                    {label}
                    <SortIndicator field={key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((score) => {
              const monthlyIncome = grossMonthlyIncome(score.adr_p50_ttm, score.occupancy_p50_ttm);
              const listings = score.active_listings ?? 0;

              return (
                <tr
                  key={score.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-left">
                    <div className="font-medium text-gray-900">{getZoneInfo(score.zone).displayName}</div>
                    <div className="text-xs text-gray-600">{score.city}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {score.score != null ? (
                      <span
                        className={`font-mono font-semibold ${
                          score.score >= 70
                            ? 'text-emerald-700'
                            : score.score >= 50
                            ? 'text-amber-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {Math.round(score.score)}
                      </span>
                    ) : (
                      // El pipeline decidió y dijo por qué. El sitio solo rotula: no reevalúa
                      // el umbral ni colapsa las razones en una sola etiqueta.
                      (() => {
                        const badge = omissionBadge(
                          score.index_omission_reason,
                          score.ttm_months_observed,
                        );
                        if (!badge) return <span className="text-gray-600">—</span>;
                        return (
                          <span
                            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            title={t(badge.titleKey)}
                          >
                            {t(badge.labelKey, badge.values)}
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {score.adr_p50_ttm != null
                      ? format(Math.round(score.adr_p50_ttm))
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {score.occupancy_p50_ttm != null
                      ? `${Math.round(score.occupancy_p50_ttm)}%`
                      : '—'}
                    {score.occupancy_low_season != null && score.occupancy_high_season != null && (
                      <span className="block text-2xs text-gray-600">
                        {t('occupancyRangeLabel', {
                          low: Math.round(score.occupancy_low_season),
                          high: Math.round(score.occupancy_high_season),
                        })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {monthlyIncome != null ? format(monthlyIncome) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {listings > 0 ? listings.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        listings > 200
                          ? 'bg-red-50 text-red-700'
                          : listings > 50
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {competitionLevel(listings, t)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">{t('grossIncomeNote')}</p>
    </div>
  );
}
