'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Property, PropertyStage, PropertyUsage } from '@/types/property';

export interface Filters {
  search: string;
  city: string;
  type: string;
  priceMin: number;
  priceMax: number;
  roiMin: number;
  stage: PropertyStage | '';
  usage: PropertyUsage | '';
}

const defaultFilters: Filters = {
  search: '',
  city: '',
  type: '',
  priceMin: 0,
  priceMax: 50_000_000,
  roiMin: 0,
  stage: '',
  usage: '',
};

const VALID_STAGES: PropertyStage[] = ['preventa', 'construccion', 'entrega_inmediata'];
const VALID_USAGES: PropertyUsage[] = ['residencial', 'vacacional', 'renta', 'mixto'];

function parseFiltersFromParams(params: URLSearchParams): Partial<Filters> {
  const parsed: Partial<Filters> = {};

  const search = params.get('search');
  if (search) parsed.search = search;

  const city = params.get('city');
  if (city) parsed.city = city;

  const type = params.get('type');
  if (type) parsed.type = type;

  const priceMin = params.get('priceMin');
  if (priceMin) { const n = Number(priceMin); if (n > 0) parsed.priceMin = n; }

  const priceMax = params.get('priceMax');
  if (priceMax) { const n = Number(priceMax); if (n > 0 && n < 50_000_000) parsed.priceMax = n; }

  const roiMin = params.get('roiMin');
  if (roiMin) { const n = Number(roiMin); if (n > 0) parsed.roiMin = n; }

  const stage = params.get('stage');
  if (stage && VALID_STAGES.includes(stage as PropertyStage)) parsed.stage = stage as PropertyStage;

  const usage = params.get('usage');
  if (usage && VALID_USAGES.includes(usage as PropertyUsage)) parsed.usage = usage as PropertyUsage;

  return parsed;
}

export function useFilters(properties: Property[]) {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    ...parseFiltersFromParams(searchParams),
  }));

  // Re-apply URL params if they change (e.g. AI redirect)
  useEffect(() => {
    const fromUrl = parseFiltersFromParams(searchParams);
    if (Object.keys(fromUrl).length > 0) {
      setFilters(prev => ({ ...prev, ...fromUrl }));
    }
  }, [searchParams]);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date'>('relevance');

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.city) count++;
    if (filters.type) count++;
    if (filters.priceMin > 0) count++;
    if (filters.priceMax < 50_000_000) count++;
    if (filters.roiMin > 0) count++;
    if (filters.stage) count++;
    if (filters.usage) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => {
    let result = properties.filter(p => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.zone.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.city && p.location.city !== filters.city) return false;
      if (filters.type && p.specs.type !== filters.type) return false;
      if (p.price.mxn < filters.priceMin) return false;
      if (p.price.mxn > filters.priceMax) return false;
      if (filters.roiMin && p.roi.projected < filters.roiMin) return false;
      if (filters.stage && p.stage !== filters.stage) return false;
      if (filters.usage && !p.usage.includes(filters.usage)) return false;
      return true;
    });

    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price.mxn - b.price.mxn);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price.mxn - a.price.mxn);
        break;
      case 'roi':
        result.sort((a, b) => b.roi.projected - a.roi.projected);
        break;
      case 'date':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [properties, filters, sortBy]);

  return { filters, filtered, updateFilter, clearFilters, activeFilterCount, sortBy, setSortBy };
}
