'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Search, BarChart3, SortAsc, SortDesc } from '@/lib/icons';
import { ZoneScoreCard } from '@/components/analytics/ZoneScoreCard';
import type { ZoneScore } from '@/lib/supabase/queries';
import { averageIndex, partitionByPool } from '@/lib/rental-data/pools';
import { formatDataThroughDate, isStale, oldestDataThrough } from '@/lib/rental-data/zone-metrics';
import { zoneSlug } from '@/lib/utils';

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
  const t = useTranslations('zonas');
  // El aviso de serie rancia se reusa del namespace 'mercado': misma redacción en
  // /mercado y en /zonas, una sola frase que mantener.
  const tMer = useTranslations('mercado');
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
        case 'occupancy': va = a.occupancy_p50_ttm ?? 0; vb = b.occupancy_p50_ttm ?? 0; break;
        case 'adr': va = a.adr_p50_ttm ?? 0; vb = b.adr_p50_ttm ?? 0; break;
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
    // averageIndex descarta las zonas SIN índice en vez de contarlas como cero:
    // sumar `score ?? 0` hundía el promedio publicado (8 de 44 zonas publican
    // score = null por umbral de muestra). Misma función que usa /mercado.
    const avgScoreVal = averageIndex(target);
    const avgOcc = target.filter((z) => z.occupancy_p50_ttm != null);
    const avgOccVal = avgOcc.length > 0
      ? avgOcc.reduce((s, z) => s + (z.occupancy_p50_ttm ?? 0), 0) / avgOcc.length
      : null;
    const totalListings = target.reduce((s, z) => s + (z.active_listings ?? 0), 0);
    // null, no 0: el `: 0` publicaba "0/100" y "0%" como si fueran mediciones.
    return {
      zones: target.length,
      avgScore: avgScoreVal != null ? Math.round(avgScoreVal) : null,
      avgOcc: avgOccVal != null ? Math.round(avgOccVal) : null,
      totalListings,
    };
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

  // Corte de los datos. `data_through` (lo que el dato CUBRE), no `computed_at`
  // (cuándo corrió el pipeline): computed_at decía "agosto de 2026" sobre una
  // serie cerrada en febrero. Se toma la fecha MÁS ANTIGUA del pool de ranking:
  // el máximo dejaba que una sola zona refrescada rotulara todo el tablero, y
  // CDMX (mercado de referencia, no oferta) no debe decidir la frescura del
  // Caribe. El formateo va por formatDataThroughDate, que ancla el parseo a UTC
  // para no correr el mes hacia atrás en huso negativo (UTC-6).
  const oldestThrough = useMemo(
    () => oldestDataThrough(partitionByPool(scores).ranking),
    [scores],
  );
  const latestDate = useMemo(
    () => formatDataThroughDate(oldestThrough, isEn ? 'en' : 'es'),
    [oldestThrough, isEn],
  );
  const seriesIsStale = useMemo(() => isStale(oldestThrough, new Date()), [oldestThrough]);

  return (
    <div className="space-y-6">
      {/* Data source & freshness */}
      <p className="text-xs text-gray-600 text-center">
        {t('dataSource')}{latestDate ? t('dataSourceUpdated', { date: latestDate }) : ''}
      </p>

      {/* Aviso de antigüedad: la serie puede haber quedado congelada aunque el
          pipeline haya corrido después. Es una advertencia, no un reemplazo: las
          cifras se siguen mostrando (mismo tratamiento que VacacionalTab). */}
      {scores.length > 0 && seriesIsStale && (
        <p className="text-xs text-amber-800 text-center">
          {tMer('staleSeriesNotice', { date: latestDate ?? '—' })}
        </p>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* City selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="min-h-[44px] text-sm font-medium text-gray-900 bg-transparent border-none outline-none cursor-pointer touch-manipulation"
          >
            <option value="all">{t('allCities')}</option>
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
          <Search className="w-4 h-4 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchZone')}
            className="min-h-[44px] text-sm bg-transparent border-none outline-none w-full touch-manipulation"
          />
        </div>

        {/* Cluster filter */}
        {clusters.length > 1 && (
          <select
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            className="min-h-[44px] text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer touch-manipulation"
          >
            <option value="all">{t('allProfiles')}</option>
            {clusters.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Sort Pills */}
      <div className="flex flex-wrap gap-2">
        {([
          ['score', t('sortPropyteIndex')],
          ['occupancy', t('sortOccupancy')],
          ['adr', t('sortRate')],
          ['revpar', t('sortRevenue')],
          ['listings', t('sortProperties')],
          ['zone', t('sortName')],
        ] as [SortField, string][]).map(([field, label]) => (
          <button
            key={field}
            onClick={() => toggleSort(field)}
            className={`flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-xs rounded-full border transition-colors touch-manipulation ${
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
            <div className="text-xs text-gray-600">{t('statZones')}</div>
          </div>
          {/* Se ocultan cuando no hay valor positivo, igual que VacacionalKPIs en
              /mercado: "0/100" y "0%" son afirmaciones, no marcadores de ausencia. */}
          {cityStats.avgScore != null && cityStats.avgScore > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-teal-700">{cityStats.avgScore}/100</div>
              <div className="text-xs text-gray-600">{t('statAvgIndex')}</div>
            </div>
          )}
          {cityStats.avgOcc != null && cityStats.avgOcc > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{cityStats.avgOcc}%</div>
              <div className="text-xs text-gray-600">{t('statAvgOccupancy')}</div>
            </div>
          )}
          {cityStats.totalListings > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{cityStats.totalListings.toLocaleString()}</div>
              <div className="text-xs text-gray-600">{t('statActiveProperties')}</div>
            </div>
          )}
        </div>
      )}

      {/* Zone Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((score) => {
            const slug = zoneSlug(score.zone);
            return (
              <a key={score.id} href={`/${locale}/zonas/${slug}`} className="block">
                <ZoneScoreCard score={score} locale={locale} />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-600">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">{t('noZonesFound')}</p>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-600 text-center">
        {t('showingOf', { visible: filtered.length, total: scores.length })}
      </p>
    </div>
  );
}
