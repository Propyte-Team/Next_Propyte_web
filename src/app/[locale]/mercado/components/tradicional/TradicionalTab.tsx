'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Building2, MapPin, BarChart3, ArrowUpRight,
  ChevronDown, Loader2, X, SlidersHorizontal,
  Database, Clock,
} from 'lucide-react';
import { formatPrice, formatPercentage } from '@/lib/formatters';

// ── Types ────────────────────────────────────────────
interface Comparable {
  city: string;
  zone: string | null;
  pt: string;   // property_type
  beds: number | null;
  rent: number;
  m2: number | null;
  rt: string;   // rental_type
  fur: boolean | null;
}

interface DevelopmentFinancial {
  id: string;
  slug: string;
  name: string;
  city: string;
  zone: string | null;
  stage: string;
  price_min: number | null;
  price_max: number | null;
  image: string | null;
  roi_annual_pct: number | null;
  irr_5yr: number | null;
  irr_10yr: number | null;
  cash_on_cash_pct: number | null;
  breakeven_months: number | null;
  monthly_net_flow: number | null;
  cap_rate: number | null;
  rent_yield_gross: number | null;
  rent_yield_net: number | null;
  estimated_rent: number | null;
  estimated_rent_vac: number | null;
}

interface SourceStat {
  source: string;
  count: number;
}

interface AnalysisData {
  comparables: Comparable[];
  developments: DevelopmentFinancial[];
  city_stats: Array<Record<string, unknown>>;
  source_stats: SourceStat[];
  data_freshness: string | null;
  model: { version: string; last_computed: string } | null;
  total_comparables: number;
}

interface Filters {
  city: string;
  zone: string;
  propertyType: string;
  bedrooms: string;
  rentalType: string;
  furnished: string;
  rentMin: number;
  rentMax: number;
  minSamples: number;
}

interface ComputedMetrics {
  count: number;
  avg: number;
  median: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  avgM2: number | null;
  byType: Record<string, { count: number; avg: number; median: number }>;
  byBeds: Record<string, { count: number; avg: number; median: number }>;
  byCity: Record<string, { count: number; avg: number; median: number }>;
  byZone: Record<string, { count: number; avg: number; median: number }>;
}

type SortKey = 'rent_yield_gross' | 'irr_5yr' | 'cap_rate' | 'cash_on_cash_pct' | 'estimated_rent' | 'price_min';

// ── Zone normalization ──────────────────────────────
const CANONICAL_ZONES: Record<string, Record<string, string[]>> = {
  Cancun: {
    'Centro': ['Cancún Centro', 'Ciudad de Cancún', 'Cancún'],
    'Zona Hotelera': ['Zona Hotelera', 'Zona Hotel', 'Pok Ta Pok', 'Pok-ta-pok', 'Blvd. Kukulcan 1'],
    'Puerto Cancún': ['Puerto Cancun', 'Puerto Cancún', 'Avenida Puerto Cancun', 'Av. Puerto Cancún 1', 'Av. Puerto Cancun 1'],
    'Isla Dorada': ['Isla Dorada'],
    'Aqua Residencial': ['Aqua Residencial', 'Residencial Aqua 1', 'Residencial Aqua SN'],
    'Cumbres': ['Cumbres', 'Fraccionamiento Vía Cumbres', 'Avenida Cumbres'],
    'Arbolada': ['Arbolada', 'Fraccionamiento Arbolada', 'Arbolada Sur'],
    'Alfredo V. Bonfil': ['Alfredo V. Bonfil', 'Alfredo V Bonfil'],
    'Long Island': ['Fraccionamiento Long Island'],
    'Lagos del Sol': ['Lagos del Sol'],
    'Polígono Sur': ['Polígono Sur'],
    'Residencial Río': ['Residencial Río', 'Fraccionamiento Residencial Rio'],
    'Supermanzana 11-17': ['Supermanzana 11', 'Supermanzana 13', 'Supermanzana 15', 'Supermanzana 17', 'Supermanzana 12', 'Supermanzana 10', 'Supermanzana 15a'],
    'Palmaris': ['Residencial Palmaris'],
    'Selvamar': ['Fraccionamiento Selvamar'],
    'Campestre': ['Campestre'],
    'Puerto Juárez': ['Puerto Juárez'],
    'Las Torres': ['Las Torres', 'Fraccionamiento Las Torres'],
  },
  Merida: {
    'Temozón Norte': ['Temozon Norte', 'TEMOZON NORTE'],
    'Yucatán Country Club': ['Yucatán Country Club', 'Yucatan Country Club'],
    'Montebello': ['Montebello', 'Fraccionamiento Montebello'],
    'Altabrisa': ['Altabrisa', 'Fraccionamiento Altabrisa'],
    'Cholul': ['Cholul'],
    'Mérida Centro': ['Mérida Centro', 'Centro', 'Mérida'],
    'Benito Juárez Norte': ['Benito Juárez Nte'],
    'Club de Golf La Ceiba': ['Club de Golf La Ceiba'],
    'Santa Gertrudis Copo': ['Santa Gertrudis Copo'],
    'Cabo Norte': ['Cabo norte', 'Fraccionamiento Cabo Norte', 'cabo norte'],
    'Dzityá': ['Dzitya', 'Dzibichaltun'],
    'Las Américas': ['Las Américas', 'Americas II', 'Las Americas'],
    'Vía Montejo': ['Fraccionamiento Vía Montejo', 'Via Montejo', 'Paseo de Montejo', 'Prolongación Montejo'],
    'Francisco de Montejo': ['Francisco de Montejo', 'Fraccionamiento Francisco de Montejo V'],
    'Sodzil Norte': ['Sodzil Norte', 'Núcleo Sodzil'],
    'México Norte': ['México Norte'],
    'Montecristo': ['Montecristo'],
    'Gran Santa Fe': ['Gran Santa Fe', 'Fraccionamiento Gran Santa Fe', 'Santa Fe', 'Grand Santa Fe', 'Santa Fe Plus'],
    'Real Montejo': ['Real Montejo', 'Fraccionamiento Real Montejo'],
    'Xcumpich': ['Xcumpich'],
    'Campestre': ['Campestre'],
    'García Ginerés': ['García Gineres', 'Garcia Gineres', 'Privada Garcia Gineres C - 29'],
    'Maya': ['Maya'],
    'Cocoyoles': ['Fraccionamiento Cocoyoles'],
    'San Pedro Cholul': ['San Pedro Cholul'],
    'Caucel': ['Caucel'],
    'Chuburná': ['Chuburna de Hidalgo'],
    'Los Héroes': ['Fraccionamiento Los Héroes'],
    'Montes de Amé': ['Montes de Ame', 'Montes de ame'],
  },
  'Playa del Carmen': {
    'Centro': ['Centro', 'Playa del Carmen Centro', 'centro'],
    'Playacar Fase II': ['Playa Car Fase II', 'PLAYA CAR II 301 REAL DEL CARMEN', 'Playacar Fase 2 Vaiven del Mar Playa del carmen'],
    'Ciudad Mayakoba': ['Jardines de Ciudad Mayakoba', 'Fraccionamiento Ciudad Mayakoba', 'Bosques de Mayakoba', 'Lagunas de Mayakoba'],
    'Gonzalo Guerrero': ['Gonzalo Guerrero'],
    'Ejidal': ['Ejidal'],
    'Selvanova': ['Selvanova Residencial', 'Selvanova', 'Selvanova Coto 4'],
    'Selvamar': ['Selvamar', 'Fraccionamiento Selvamar'],
    'Polanco': ['Polanco'],
    'Granada': ['Granada'],
    'Campanario': ['Campanario'],
    'Real Ibiza': ['Real Ibiza', 'Fraccionamiento Real Ibiza'],
    'Real Amalfi': ['Real Amalfi'],
    'Real Bilbao': ['Real Bilbao', 'Fraccionamiento Real Bilbao'],
    'Colosio': ['Luis Donaldo Colosio'],
    'Nicte-Ha': ['Nicte-ha'],
    'El Cielo': ['El Cielo'],
    'Playa Magna': ['Fraccionamiento Playa Magna'],
    'Aviación': ['Aviación'],
    'Solidaridad': ['Solidaridad'],
    'Vela Mar': ['Vela Mar'],
    'Misión del Carmen': ['Misión del Carmen'],
  },
  Tulum: {
    'Aldea Zamá': ['Aldea Zama', 'Aldea Zamá', 'Eden Zama'],
    'Tulum Centro': ['Tulum Centro', 'Pueblo Tulum'],
    'Región 15': ['Region 15 Kukulcan', 'Region 15', 'C. 39 Pte. Supermanzana 15'],
    'La Veleta': ['La Veleta'],
    'Tumben Kaá': ['Tumben Kaa'],
    'Riviera Tulum': ['Fraccionamiento Riviera Tulum'],
    'Huracanes': ['Calle Asteroides Col Huracanes', 'Villas Huracanes'],
  },
  Cozumel: {
    'Centro': ['Cozumel Centro'],
  },
  'Puerto Morelos': {
    'Centro': ['Puerto Morelos'],
  },
  Bacalar: {},
};

const JUNK_ZONES = new Set([
  'piso', 'casa', 'villa', 'habitación', 'mansión', 'casa rural', 'dúplex amueblado',
  'piso amueblado', 'casa amueblada', 'casa independiente', 'casa nueva', 'casa con terraza',
  'piso con terraza', 'piso de planta baja con jardín', 'penthouse',
  'amoblado', 'permite mascotas', 'aire acondicionado', 'asador', 'balcón',
  'área de juegos infantiles', 'escuelas cercanas', 'mantenimiento', 'bajó de precio',
  'colegios', 'renta', 'recámaras', 'recamaras', 'venta', 'sección', 'secc',
  'mexico', 'null', 'n/a', 's/n', 'sn', 'residencial', '. .', 'q.r.',
  'yucatan', 'nuevo-leon', 'guerrero', 'baja-california-sur', 'baja-california',
  'coahuila-de-zaragoza', 'jalisco', 'puebla', 'sinaloa', 'ciudad-de-mexico',
  'hidalgo', 'queretaro', 'guanajuato', 'durango', 'tamaulipas', 'morelos',
  'veracruz-de-ignacio-de-la-llave', 'chihuahua', 'nayarit', 'san-luis-potosi',
  'tlaxcala', 'quintana-roo',
]);

function normalizeZone(city: string, rawZone: string | null): string | null {
  if (!rawZone) return null;
  const trimmed = rawZone.trim();
  if (!trimmed) return null;
  if (JUNK_ZONES.has(trimmed.toLowerCase())) return null;
  if (/^\d+[\w-]*$/.test(trimmed) && trimmed.length <= 6) return null;
  if (/^\d+\s/.test(trimmed) && trimmed.length > 10) return null;

  const cityZones = CANONICAL_ZONES[city];
  if (cityZones) {
    for (const [canonical, aliases] of Object.entries(cityZones)) {
      if (aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
        return canonical;
      }
    }
  }
  if (cityZones && trimmed in cityZones) return trimmed;
  return 'Otra zona';
}

function computeMedian(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function computePercentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length * p)];
}

// ── Component ────────────────────────────────────────
export function TradicionalTab({ locale }: { locale: string }) {
  const t = useTranslations('rentas');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('rent_yield_gross');
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    city: '',
    zone: '',
    propertyType: '',
    bedrooms: '',
    rentalType: '',
    furnished: '',
    rentMin: 0,
    rentMax: 0,
    minSamples: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/rental-analysis');
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error('Failed to fetch rental analysis:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Normalize zones + price bounds safety net ──
  type ComparableWithZone = Comparable & { normalizedZone: string | null };
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- compiler skipped this file due to other rules; keep manual memo while we refactor
  const normalizedComparables = useMemo<ComparableWithZone[]>(() => {
    if (!data?.comparables) return [];
    return data.comparables
      .filter(c => c.rent >= 5000 && c.rent <= 500000)
      .map(c => ({
        ...c,
        normalizedZone: normalizeZone(c.city, c.zone),
      }));
  }, [data?.comparables]);

  // ── Filtered comparables ──
  const filtered = useMemo(() => {
    if (!normalizedComparables.length) return [] as ComparableWithZone[];
    let excludedCities: Set<string> | null = null;
    if (filters.minSamples > 0) {
      const cityCounts: Record<string, number> = {};
      for (const c of normalizedComparables) {
        cityCounts[c.city] = (cityCounts[c.city] || 0) + 1;
      }
      excludedCities = new Set(
        Object.entries(cityCounts)
          .filter(([, count]) => count < filters.minSamples)
          .map(([city]) => city)
      );
    }

    return normalizedComparables.filter(c => {
      if (excludedCities && excludedCities.has(c.city)) return false;
      if (filters.city && c.city !== filters.city) return false;
      if (filters.zone && c.normalizedZone !== filters.zone) return false;
      if (filters.propertyType && c.pt !== filters.propertyType) return false;
      if (filters.bedrooms && String(c.beds) !== filters.bedrooms) return false;
      if (filters.rentalType && c.rt !== filters.rentalType) return false;
      if (filters.furnished === 'true' && !c.fur) return false;
      if (filters.furnished === 'false' && c.fur) return false;
      if (filters.rentMin > 0 && c.rent < filters.rentMin) return false;
      if (filters.rentMax > 0 && c.rent > filters.rentMax) return false;
      return true;
    });
  }, [normalizedComparables, filters]);

  // ── Computed metrics for filtered data ──
  const metrics: ComputedMetrics | null = useMemo(() => {
    if (!filtered.length) return null;
    const rents = filtered.map(c => c.rent);
    const m2Rents = filtered.filter(c => c.m2 && c.m2 > 0).map(c => c.rent / c.m2!);

    const byType: Record<string, { count: number; avg: number; median: number }> = {};
    const byBeds: Record<string, { count: number; avg: number; median: number }> = {};
    const byCity: Record<string, { count: number; avg: number; median: number }> = {};
    const byZone: Record<string, { count: number; avg: number; median: number }> = {};

    const typeRents: Record<string, number[]> = {};
    const bedsRents: Record<string, number[]> = {};
    const cityRents: Record<string, number[]> = {};
    const zoneRents: Record<string, number[]> = {};

    for (const c of filtered) {
      const pt = c.pt || 'otro';
      if (!typeRents[pt]) typeRents[pt] = [];
      typeRents[pt].push(c.rent);

      const beds = String(c.beds ?? 'N/A');
      if (!bedsRents[beds]) bedsRents[beds] = [];
      bedsRents[beds].push(c.rent);

      if (!cityRents[c.city]) cityRents[c.city] = [];
      cityRents[c.city].push(c.rent);

      const zone = c.normalizedZone || 'Sin zona';
      if (!zoneRents[zone]) zoneRents[zone] = [];
      zoneRents[zone].push(c.rent);
    }

    for (const [k, v] of Object.entries(typeRents)) {
      byType[k] = { count: v.length, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), median: computeMedian(v) };
    }
    for (const [k, v] of Object.entries(bedsRents)) {
      byBeds[k] = { count: v.length, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), median: computeMedian(v) };
    }
    for (const [k, v] of Object.entries(cityRents)) {
      byCity[k] = { count: v.length, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), median: computeMedian(v) };
    }
    for (const [k, v] of Object.entries(zoneRents)) {
      byZone[k] = { count: v.length, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), median: computeMedian(v) };
    }

    return {
      count: filtered.length,
      avg: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
      median: computeMedian(rents),
      min: Math.min(...rents),
      max: Math.max(...rents),
      p25: computePercentile(rents, 0.25),
      p75: computePercentile(rents, 0.75),
      avgM2: m2Rents.length >= 3 ? Math.round((m2Rents.reduce((a, b) => a + b, 0) / m2Rents.length) * 100) / 100 : null,
      byType,
      byBeds,
      byCity,
      byZone,
    };
  }, [filtered]);

  // ── Unique filter options from data ──
  const filterOptions = useMemo(() => {
    if (!normalizedComparables.length) return { cities: [], zones: [], types: [], beds: [] };
    const cities = [...new Set(normalizedComparables.map(c => c.city))].sort();
    const zonesSource = filters.city
      ? normalizedComparables.filter(c => c.city === filters.city)
      : normalizedComparables;
    const zones = [...new Set(zonesSource.map(c => c.normalizedZone).filter((z): z is string => !!z))].sort();
    const types = [...new Set(normalizedComparables.map(c => c.pt).filter(Boolean))].sort();
    const beds = [...new Set(normalizedComparables.map(c => String(c.beds ?? 'N/A')))].sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return Number(a) - Number(b);
    });
    return { cities, zones, types, beds };
  }, [normalizedComparables, filters.city]);

  const activeFilterCount = [filters.city, filters.zone, filters.propertyType, filters.bedrooms, filters.rentalType, filters.furnished].filter(Boolean).length
    + (filters.rentMin > 0 ? 1 : 0) + (filters.rentMax > 0 ? 1 : 0) + (filters.minSamples > 0 ? 1 : 0);

  const clearFilters = () => setFilters({ city: '', zone: '', propertyType: '', bedrooms: '', rentalType: '', furnished: '', rentMin: 0, rentMax: 0, minSamples: 0 });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- compiler skipped this file due to other rules; keep manual memo while we refactor
  const sortedDevelopments = useMemo(() => {
    if (!data?.developments) return [];
    return [...data.developments].sort((a, b) => {
      const va = (a[sortBy] as number) ?? -Infinity;
      const vb = (b[sortBy] as number) ?? -Infinity;
      return vb - va;
    });
  }, [data?.developments, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  if (!data || (!data.comparables?.length && !data.developments?.length)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <BarChart3 size={48} className="text-gray-300" />
        <p className="text-gray-600 text-center">{t('noData')}</p>
        <p className="text-sm text-gray-600 text-center">{t('noDataHint')}</p>
      </div>
    );
  }

  const hasDevelopments = data.developments?.length > 0;

  return (
    <div className="space-y-8">
      {/* Source badges + data freshness */}
      {data.source_stats && data.source_stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Database size={14} className="text-gray-600" />
          {data.source_stats.map(s => (
            <span key={s.source} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-propyte-brand" />
              {s.source} <span className="text-gray-600">({s.count.toLocaleString()})</span>
            </span>
          ))}
          {data.data_freshness && (() => {
            // eslint-disable-next-line react-hooks/purity -- "days ago" display is intentionally live; staleness across re-renders is acceptable
            const daysAgo = Math.floor((Date.now() - new Date(data.data_freshness).getTime()) / 86400000);
            const dotColor = daysAgo <= 7 ? 'bg-[#22C55E]' : daysAgo <= 30 ? 'bg-yellow-400' : 'bg-[#EF4444]';
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 ml-auto">
                <Clock size={10} />
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                {t('dataFreshness')}: {daysAgo <= 0 ? t('today') : `${daysAgo}d`}
              </span>
            );
          })()}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <SlidersHorizontal size={16} className="text-[#0F766E]" />
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-[#0F766E] text-white text-2xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-600 hover:text-[#B91C1C] transition-colors">
              <X size={12} />
              {t('clearFilters')}
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
            {/* City */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterCity')}</label>
              <select
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value, zone: '' }))}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              >
                <option value="">{t('all')}</option>
                {filterOptions.cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Zone */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterZone')}</label>
              <select
                value={filters.zone}
                onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              >
                <option value="">{t('all')}</option>
                {filterOptions.zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterType')}</label>
              <select
                value={filters.propertyType}
                onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              >
                <option value="">{t('all')}</option>
                {filterOptions.types.map(pt => <option key={pt} value={pt} className="capitalize">{pt.replace('_', ' ')}</option>)}
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterBeds')}</label>
              <select
                value={filters.bedrooms}
                onChange={e => setFilters(f => ({ ...f, bedrooms: e.target.value }))}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              >
                <option value="">{t('all')}</option>
                {filterOptions.beds.map(b => <option key={b} value={b}>{b === 'N/A' ? 'N/A' : `${b} rec`}</option>)}
              </select>
            </div>

            {/* Rental Type */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterRentalType')}</label>
              <select
                value={filters.rentalType}
                onChange={e => setFilters(f => ({ ...f, rentalType: e.target.value }))}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              >
                <option value="">{t('all')}</option>
                <option value="residencial">Residencial</option>
                <option value="vacacional">Vacacional</option>
              </select>
            </div>

            {/* Furnished */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterFurnished')}</label>
              <select
                value={filters.furnished}
                onChange={e => setFilters(f => ({ ...f, furnished: e.target.value }))}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              >
                <option value="">{t('all')}</option>
                <option value="true">{t('yes')}</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Rent Min */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterRentMin')}</label>
              <input
                type="number"
                value={filters.rentMin || ''}
                onChange={e => setFilters(f => ({ ...f, rentMin: Number(e.target.value) || 0 }))}
                placeholder="$0"
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              />
            </div>

            {/* Rent Max */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterRentMax')}</label>
              <input
                type="number"
                value={filters.rentMax || ''}
                onChange={e => setFilters(f => ({ ...f, rentMax: Number(e.target.value) || 0 }))}
                placeholder="∞"
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              />
            </div>

            {/* Min Samples per City */}
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">{t('filterMinSamples')}</label>
              <input
                type="number"
                value={filters.minSamples || ''}
                onChange={e => setFilters(f => ({ ...f, minSamples: Number(e.target.value) || 0 }))}
                placeholder="0"
                min={0}
                className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:border-propyte-brand focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Active filter count + filtered result count */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
          <span className="font-semibold text-gray-700">{filtered.length.toLocaleString()}</span>
          {t('ofTotal', { total: data.comparables.length.toLocaleString() })}
          {activeFilterCount > 0 && (
            <span className="text-[#0F766E] font-medium">
              ({activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'})
            </span>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label={t('count')} value={metrics.count.toLocaleString()} />
            <MetricCard label={t('avgRent')} value={formatPrice(metrics.avg)} highlight />
            <MetricCard label={t('medianRent')} value={formatPrice(metrics.median)} highlight />
            <MetricCard label={t('p25')} value={formatPrice(metrics.p25)} />
            <MetricCard label={t('p75')} value={formatPrice(metrics.p75)} />
            <MetricCard label={t('minRent')} value={formatPrice(metrics.min)} />
            <MetricCard label={t('maxRent')} value={formatPrice(metrics.max)} />
          </div>

          {metrics.avgM2 && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 text-sm">
                <span className="text-gray-600">{t('rentPerM2')}:</span>
                <span className="font-bold text-[#0F766E]">${metrics.avgM2}/m&sup2;</span>
              </span>
            </div>
          )}

          {/* Rent Distribution Histogram */}
          <RentHistogram rents={filtered.map(c => c.rent)} />
        </div>
      )}

      {/* Breakdowns */}
      {metrics && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BreakdownCard
            title={t('filterCity')}
            data={metrics.byCity}
            icon={<MapPin size={14} className="text-gray-600" />}
            activeKey={filters.city}
            onSelect={key => setFilters(f => ({ ...f, city: f.city === key ? '' : key, zone: '' }))}
          />
          <BreakdownCard
            title={t('filterZone')}
            data={metrics.byZone}
            icon={<MapPin size={14} className="text-gray-600" />}
            activeKey={filters.zone}
            onSelect={key => setFilters(f => ({ ...f, zone: f.zone === key ? '' : key }))}
          />
          <BreakdownCard
            title={t('filterType')}
            data={metrics.byType}
            icon={<Building2 size={14} className="text-gray-600" />}
            activeKey={filters.propertyType}
            onSelect={key => setFilters(f => ({ ...f, propertyType: f.propertyType === key ? '' : key }))}
            formatKey={k => k.replace('_', ' ')}
          />
          <BreakdownCard
            title={t('filterBeds')}
            data={metrics.byBeds}
            activeKey={filters.bedrooms}
            onSelect={key => setFilters(f => ({ ...f, bedrooms: f.bedrooms === key ? '' : key }))}
            formatKey={k => k === 'N/A' ? 'N/A' : `${k} rec`}
          />
        </div>
      )}

      {/* Development Rankings */}
      {hasDevelopments && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1A2F3F]">{t('rankingTitle')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('rankingSubtitle')}</p>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:border-propyte-brand focus:outline-none cursor-pointer"
              >
                <option value="rent_yield_gross">{t('sortYield')}</option>
                <option value="irr_5yr">{t('sortIrr')}</option>
                <option value="cap_rate">{t('sortCapRate')}</option>
                <option value="cash_on_cash_pct">{t('sortCashOnCash')}</option>
                <option value="estimated_rent">{t('sortRent')}</option>
                <option value="price_min">{t('sortPrice')}</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">#</th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">{t('thDevelopment')}</th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">{t('thPrice')}</th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">{t('thEstRent')}</th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3 hidden md:table-cell">{t('thYield')}</th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3 hidden md:table-cell">{t('thCapRate')}</th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('thIrr5')}</th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('thCashFlow')}</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDevelopments.map((dev, i) => (
                    <tr key={dev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-600 font-mono">{i + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {dev.image && <Image src={dev.image} alt={dev.name} width={40} height={40} unoptimized className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#1A2F3F] truncate max-w-[200px]">{dev.name}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1"><MapPin size={10} />{dev.zone ? `${dev.zone}, ` : ''}{dev.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-gray-700">{dev.price_min ? formatPrice(dev.price_min) : '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-semibold text-[#0F766E]">{dev.estimated_rent ? formatPrice(dev.estimated_rent) : '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-700 hidden md:table-cell">{dev.rent_yield_gross != null ? formatPercentage(dev.rent_yield_gross) : '—'}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-gray-700 hidden md:table-cell">{dev.cap_rate != null ? formatPercentage(dev.cap_rate) : '—'}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-gray-700 hidden lg:table-cell">{dev.irr_5yr != null ? formatPercentage(dev.irr_5yr) : '—'}</td>
                      <td className={`px-5 py-4 text-right text-sm font-medium hidden lg:table-cell ${(dev.monthly_net_flow ?? 0) >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                        {dev.monthly_net_flow != null ? formatPrice(dev.monthly_net_flow) : '—'}
                      </td>
                      <td className="px-3 py-4">
                        <Link href={`/${locale}/desarrollos/${dev.slug}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-propyte-cyan-100 text-gray-600 hover:text-[#0F766E] transition-colors">
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="pb-2">
        <p className="text-xs text-gray-600 text-center">
          {t('disclaimer')}
          {data.model && ` · ${t('modelVersion')}: ${data.model.version}`}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────

function RentHistogram({ rents }: { rents: number[] }) {
  if (rents.length < 10) return null;

  const BUCKETS = 12;
  const min = Math.min(...rents);
  const max = Math.max(...rents);
  const range = max - min;
  if (range <= 0) return null;

  const bucketSize = range / BUCKETS;
  const buckets = Array(BUCKETS).fill(0);
  for (const r of rents) {
    const idx = Math.min(Math.floor((r - min) / bucketSize), BUCKETS - 1);
    buckets[idx]++;
  }
  const maxCount = Math.max(...buckets);

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Distribucion de rentas</div>
      <div className="flex items-end gap-1 h-24">
        {buckets.map((count, i) => {
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const bucketMin = min + i * bucketSize;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-propyte-brand/60 hover:bg-propyte-brand rounded-t transition-colors cursor-default"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`$${Math.round(bucketMin / 1000)}K–$${Math.round((bucketMin + bucketSize) / 1000)}K: ${count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-2xs text-gray-600 mt-1">
        <span>${Math.round(min / 1000)}K</span>
        <span>${Math.round((min + max) / 2000)}K</span>
        <span>${Math.round(max / 1000)}K</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-[#1A2F3F] border-[#1A2F3F] text-white' : 'bg-white border-gray-100'}`}>
      <div className={`text-2xs font-semibold uppercase tracking-wider mb-1 ${highlight ? 'text-[#0F766E]' : 'text-gray-600'}`}>{label}</div>
      <div className={`text-lg font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function BreakdownCard({
  title, data, icon, activeKey, onSelect, formatKey,
}: {
  title: string;
  data: Record<string, { count: number; avg: number; median: number }>;
  icon?: React.ReactNode;
  activeKey?: string;
  onSelect: (key: string) => void;
  formatKey?: (key: string) => string;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
  const fk = formatKey || ((k: string) => k);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-[#1A2F3F] mb-3">{title}</h3>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {sorted.map(([key, stat]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${
              activeKey === key
                ? 'bg-propyte-cyan-100 border border-propyte-brand/30'
                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {icon}
              <span className="text-sm capitalize truncate">{fk(key)}</span>
              <span className="text-2xs text-gray-600 flex-shrink-0">({stat.count})</span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-sm font-semibold">{formatPrice(stat.median)}</div>
              <div className="text-2xs text-gray-600">prom: {formatPrice(stat.avg)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
