'use client';

import { useState, useMemo } from 'react';
import { MapPin, Search } from 'lucide-react';
import type { ZoneScore } from '@/lib/supabase/queries';
import { VacacionalKPIs } from './VacacionalKPIs';
import { ZoneCards } from './ZoneCards';
import { ComparisonTable } from './ComparisonTable';
import { ROICalculatorCTA } from './ROICalculatorCTA';

interface VacacionalTabProps {
  scores: ZoneScore[];
  locale: string;
  initialCity?: string;
}

type SortField = 'score' | 'occupancy' | 'adr' | 'listings' | 'zone';
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

const CITY_REGIONS: Record<string, string[]> = {
  'Riviera Maya': ['Cancun', 'Playa del Carmen', 'Tulum', 'Puerto Morelos', 'Akumal', 'Puerto Aventuras', 'Cozumel', 'Holbox'],
  'Costa Maya': ['Bacalar', 'Mahahual', 'Chetumal'],
  'Yucatán': ['Merida', 'Valladolid', 'Progreso', 'Telchac Puerto', 'Sisal', 'Celestun', 'Chelem', 'Chicxulub Puerto', 'Izamal'],
  'CDMX': ['CDMX'],
};

export function VacacionalTab({ scores, locale, initialCity }: VacacionalTabProps) {
  const isEn = locale === 'en';
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || 'all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Available cities from the data
  const cities = useMemo(() => {
    const set = new Set(scores.map((s) => s.city));
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

    result.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortField) {
        case 'score': va = a.score ?? 0; vb = b.score ?? 0; break;
        case 'occupancy': va = a.median_occupancy ?? 0; vb = b.median_occupancy ?? 0; break;
        case 'adr': va = a.median_adr ?? 0; vb = b.median_adr ?? 0; break;
        case 'listings': va = a.active_listings ?? 0; vb = b.active_listings ?? 0; break;
        case 'zone': va = a.zone; vb = b.zone; break;
      }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return result;
  }, [scores, selectedCity, search, sortField, sortDir]);

  // KPI stats
  const kpiStats = useMemo(() => {
    const target = filtered.length > 0 ? filtered : scores;
    if (target.length === 0) return { zones: 0, avgIndex: 0, avgOccupancy: 0, totalListings: 0 };

    const avgIndex = target.reduce((s, z) => s + (z.score ?? 0), 0) / target.length;
    const occZones = target.filter((z) => z.median_occupancy != null);
    const avgOcc = occZones.length > 0
      ? occZones.reduce((s, z) => s + (z.median_occupancy ?? 0), 0) / occZones.length
      : 0;
    const totalListings = target.reduce((s, z) => s + (z.active_listings ?? 0), 0);

    return {
      zones: target.length,
      avgIndex: Math.round(avgIndex),
      avgOccupancy: Math.round(avgOcc),
      totalListings,
    };
  }, [filtered, scores]);

  // Latest data date
  const latestDate = useMemo(() => {
    if (scores.length === 0) return null;
    const dates = scores.map((s) => s.computed_at).filter(Boolean).sort().reverse();
    if (dates.length === 0) return null;
    const d = new Date(dates[0]);
    return d.toLocaleDateString(isEn ? 'en-US' : 'es-MX', { month: 'long', year: 'numeric' });
  }, [scores, isEn]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-8">
      {/* Data freshness */}
      <p className="text-xs text-gray-400 text-center">
        {isEn
          ? `Propyte analysis based on +2.5M short-term rental records in Mexico${latestDate ? ` · Updated ${latestDate}` : ''}`
          : `Análisis Propyte basado en +2.5 millones de registros de renta vacacional en México${latestDate ? ` · Actualizado ${latestDate}` : ''}`}
      </p>

      {/* Search bar + City filter */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* City selector grouped by region */}
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

        {/* Search input */}
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
      </div>

      {/* KPI cards */}
      <VacacionalKPIs
        zones={kpiStats.zones}
        avgIndex={kpiStats.avgIndex}
        avgOccupancy={kpiStats.avgOccupancy}
        totalListings={kpiStats.totalListings}
        locale={locale}
      />

      {/* Zone cards grid with sort pills */}
      <ZoneCards
        scores={filtered}
        locale={locale}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Comparison table */}
      <ComparisonTable scores={filtered} locale={locale} />

      {/* ROI Calculator CTA */}
      <ROICalculatorCTA locale={locale} />
    </div>
  );
}
