'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import type { ZoneScore } from '@/lib/supabase/queries';

type TableSortField = 'zone' | 'score' | 'adr' | 'occupancy' | 'monthly' | 'listings' | 'competition';
type SortDir = 'asc' | 'desc';

interface ComparisonTableProps {
  scores: ZoneScore[];
  locale: string;
}

function competitionLevel(listings: number, isEn: boolean): string {
  if (listings > 200) return isEn ? 'High' : 'Alta';
  if (listings > 50) return isEn ? 'Moderate' : 'Moderada';
  return isEn ? 'Low' : 'Baja';
}

function competitionSortValue(listings: number): number {
  if (listings > 200) return 3;
  if (listings > 50) return 2;
  return 1;
}

export function ComparisonTable({ scores, locale }: ComparisonTableProps) {
  const isEn = locale === 'en';
  const { format } = useCurrency();
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
          va = a.zone;
          vb = b.zone;
          break;
        case 'score':
          va = a.score ?? 0;
          vb = b.score ?? 0;
          break;
        case 'adr':
          va = a.median_adr ?? 0;
          vb = b.median_adr ?? 0;
          break;
        case 'occupancy':
          va = a.median_occupancy ?? 0;
          vb = b.median_occupancy ?? 0;
          break;
        case 'monthly':
          va = (a.median_adr ?? 0) * ((a.median_occupancy ?? 0) / 100) * 30;
          vb = (b.median_adr ?? 0) * ((b.median_occupancy ?? 0) / 100) * 30;
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
    { key: 'zone', label: isEn ? 'Zone' : 'Zona', align: 'left' },
    { key: 'score', label: isEn ? 'Index' : 'Índice', align: 'right' },
    { key: 'adr', label: isEn ? 'Rate/night' : 'Tarifa/noche', align: 'right' },
    { key: 'occupancy', label: isEn ? 'Occupancy' : 'Ocupación', align: 'right' },
    { key: 'monthly', label: isEn ? 'Est. monthly income' : 'Ingreso mensual est.', align: 'right' },
    { key: 'listings', label: isEn ? 'Properties' : 'Propiedades', align: 'right' },
    { key: 'competition', label: isEn ? 'Competition' : 'Competencia', align: 'right' },
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
      <h3 className="text-lg font-semibold text-gray-900">
        {isEn ? 'Full comparison' : 'Comparativa completa'}
      </h3>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map(({ key, label, align }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap ${
                    align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    <SortIndicator field={key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((score) => {
              const monthlyIncome =
                (score.median_adr ?? 0) * ((score.median_occupancy ?? 0) / 100) * 30;
              const listings = score.active_listings ?? 0;

              return (
                <tr
                  key={score.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-left">
                    <div className="font-medium text-gray-900">{score.zone}</div>
                    <div className="text-xs text-gray-400">{score.city}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-semibold ${
                        (score.score ?? 0) >= 70
                          ? 'text-emerald-600'
                          : (score.score ?? 0) >= 50
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {score.score != null ? Math.round(score.score) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {score.median_adr != null
                      ? format(Math.round(score.median_adr))
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {score.median_occupancy != null
                      ? `${Math.round(score.median_occupancy)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {monthlyIncome > 0 ? format(Math.round(monthlyIncome)) : '—'}
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
                      {competitionLevel(listings, isEn)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
