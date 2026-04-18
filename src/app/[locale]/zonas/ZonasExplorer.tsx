'use client';

import { useState, useMemo } from 'react';
import { MapPin, Search, BarChart3, SortAsc, SortDesc } from 'lucide-react';
import { ZoneScoreCard } from '@/components/analytics/ZoneScoreCard';
import { MarketAlertBanner } from '@/components/analytics/MarketAlertBanner';
import type { ZoneScore } from '@/lib/supabase/queries';

interface ZonasExplorerProps {
  scores: ZoneScore[];
  cities: string[];
  locale: string;
}

type SortField = 'score' | 'occupancy' | 'adr' | 'revpar' | 'listings' | 'zone';
type SortDir = 'asc' | 'desc';

const CITY_LABELS: Record<string, string> = {
  'Cancun': 'Cancún',
  'Playa del Carmen': 'Playa del Carmen',
  'Tulum': 'Tulum',
  'Merida': 'Mérida',
  'Puerto Morelos': 'Puerto Morelos',
  'Cozumel': 'Cozumel',
  'Bacalar': 'Bacalar',
  'CDMX': 'Ciudad de México',
  'Mahahual': 'Mahahual',
  'Holbox': 'Holbox',
  'Chetumal': 'Chetumal',
  'Akumal': 'Akumal',
  'Puerto Aventuras': 'Puerto Aventuras',
  'Valladolid': 'Valladolid',
  'Progreso': 'Progreso',
  'Telchac Puerto': 'Telchac Puerto',
  'Sisal': 'Sisal',
  'Celestun': 'Celestún',
  'Chelem': 'Chelem',
  'Chicxulub Puerto': 'Chicxulub Puerto',
  'Izamal': 'Izamal',
};

// Group cities by region for the dropdown
const CITY_REGIONS: Record<string, string[]> = {
  'Riviera Maya': ['Cancun', 'Playa del Carmen', 'Tulum', 'Puerto Morelos', 'Akumal', 'Puerto Aventuras', 'Cozumel', 'Holbox'],
  'Costa Maya': ['Bacalar', 'Mahahual', 'Chetumal'],
  'Yucatán': ['Merida', 'Valladolid', 'Progreso', 'Telchac Puerto', 'Sisal', 'Celestun', 'Chelem', 'Chicxulub Puerto', 'Izamal'],
  'CDMX': ['CDMX'],
};

export function ZonasExplorer({ scores, cities, locale }: ZonasExplorerProps) {
  const isEn = locale === 'en';
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [clusterFilter, setClusterFilter] = useState<string>('all');

  // Get unique clusters
  const clusters = useMemo(() => {
    const set = new Set(scores.map((s) => s.cluster_label).filter(Boolean));
    return [...set].sort();
  }, [scores]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...scores];

    if (selectedCity !== 'all') {
      result = result.filter((s) => s.city === selectedCity);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.zone.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
      );
    }
    if (clusterFilter !== 'all') {
      result = result.filter((s) => s.cluster_label === clusterFilter);
    }

    result.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortField) {
        case 'score': va = a.score ?? 0; vb = b.score ?? 0; break;
        case 'occupancy': va = a.median_occupancy ?? 0; vb = b.median_occupancy ?? 0; break;
        case 'adr': va = a.median_adr ?? 0; vb = b.median_adr ?? 0; break;
        case 'revpar': va = a.revpar ?? 0; vb = b.revpar ?? 0; break;
        case 'listings': va = a.active_listings ?? 0; vb = b.active_listings ?? 0; break;
        case 'zone': va = a.zone; vb = b.zone; break;
      }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return result;
  }, [scores, selectedCity, search, sortField, sortDir, clusterFilter]);

  // City stats summary
  const cityStats = useMemo(() => {
    const target = selectedCity === 'all' ? scores : scores.filter((s) => s.city === selectedCity);
    if (target.length === 0) return null;
    const avgScore = target.reduce((s, z) => s + (z.score ?? 0), 0) / target.length;
    const avgOcc = target.filter((z) => z.median_occupancy != null);
    const avgOccVal = avgOcc.length > 0 ? avgOcc.reduce((s, z) => s + (z.median_occupancy ?? 0), 0) / avgOcc.length : 0;
    const totalListings = target.reduce((s, z) => s + (z.active_listings ?? 0), 0);
    return { zones: target.length, avgScore: Math.round(avgScore), avgOcc: Math.round(avgOccVal), totalListings };
  }, [scores, selectedCity]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc;

  // Compute latest data date
  const latestDate = useMemo(() => {
    if (scores.length === 0) return null;
    const dates = scores.map((s) => s.computed_at).filter(Boolean).sort().reverse();
    if (dates.length === 0) return null;
    const d = new Date(dates[0]);
    return d.toLocaleDateString(isEn ? 'en-US' : 'es-MX', { month: 'long', year: 'numeric' });
  }, [scores, isEn]);

  return (
    <div className="space-y-6">
      {/* Data source & freshness */}
      <p className="text-xs text-gray-400 text-center">
        {isEn
          ? `Propyte analysis based on +2.5M short-term rental records in Mexico${latestDate ? ` · Updated ${latestDate}` : ''}`
          : `Análisis Propyte basado en +2.5 millones de registros de renta vacacional en México${latestDate ? ` · Actualizado ${latestDate}` : ''}`}
      </p>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* City selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="all">{isEn ? 'All Cities' : 'Todas las Ciudades'}</option>
            {Object.entries(CITY_REGIONS).map(([region, regionCities]) => {
              const available = regionCities.filter((c) => cities.includes(c));
              if (available.length === 0) return null;
              return (
                <optgroup key={region} label={region}>
                  {available.map((city) => (
                    <option key={city} value={city}>
                      {CITY_LABELS[city] || city}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEn ? 'Search zone...' : 'Buscar zona...'}
            className="text-sm bg-transparent border-none outline-none w-full"
          />
        </div>

        {/* Cluster filter */}
        {clusters.length > 1 && (
          <select
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="all">{isEn ? 'All Profiles' : 'Todos los Perfiles'}</option>
            {clusters.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Sort Pills */}
      <div className="flex flex-wrap gap-2">
        {([
          ['score', isEn ? 'Propyte Index' : 'Índice Propyte'],
          ['occupancy', isEn ? 'Occupancy' : 'Ocupación'],
          ['adr', isEn ? 'Rate/night' : 'Tarifa/noche'],
          ['revpar', isEn ? 'Revenue/night' : 'Ingreso/noche'],
          ['listings', isEn ? 'Properties' : 'Propiedades'],
          ['zone', isEn ? 'Name' : 'Nombre'],
        ] as [SortField, string][]).map(([field, label]) => (
          <button
            key={field}
            onClick={() => toggleSort(field)}
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

      {/* Summary Stats */}
      {cityStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{cityStats.zones}</div>
            <div className="text-xs text-gray-500">{isEn ? 'Zones' : 'Zonas'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-teal-700">{cityStats.avgScore}/100</div>
            <div className="text-xs text-gray-500">{isEn ? 'Avg Index' : 'Índice Promedio'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{cityStats.avgOcc}%</div>
            <div className="text-xs text-gray-500">{isEn ? 'Avg Occupancy' : 'Ocupación Prom.'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{cityStats.totalListings.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{isEn ? 'Active Properties' : 'Propiedades Activas'}</div>
          </div>
        </div>
      )}

      {/* Zone Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((score) => {
            const slug = score.zone
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[\/]/g, '-');
            return (
              <a key={score.id} href={`/${locale}/zonas/${slug}`} className="block">
                <ZoneScoreCard score={score} locale={locale} />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">
            {isEn
              ? 'No zones found with the current filters.'
              : 'No se encontraron zonas con los filtros actuales.'}
          </p>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-400 text-center">
        {isEn
          ? `Showing ${filtered.length} of ${scores.length} zones`
          : `Mostrando ${filtered.length} de ${scores.length} zonas`}
      </p>
    </div>
  );
}
