'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Property, PropertyStage, PropertyUsage } from '@/types/property';
import { MAX_PRICE } from '@/shared/constants/marketplace';

export interface Filters {
  search: string;
  city: string;
  zone: string;
  type: string;
  priceMin: number;
  priceMax: number;
  roiMin: number;
  stage: PropertyStage | '';
  usage: PropertyUsage | '';
  /** Filtro recámaras: 0 = sin filtro; 1/2/3 = exactamente N; 4 = 4 o más. */
  bedroomsMin: number;
  /** Solo /desarrollos. Tipo de desarrollo canónico (Manual de Identidad). */
  developmentType: string;
}

const defaultFilters: Filters = {
  search: '',
  city: '',
  zone: '',
  type: '',
  priceMin: 0,
  priceMax: MAX_PRICE,
  roiMin: 0,
  stage: '',
  usage: '',
  bedroomsMin: 0,
  developmentType: '',
};

const VALID_STAGES: PropertyStage[] = ['preventa', 'construccion', 'entrega_inmediata'];
const VALID_USAGES: PropertyUsage[] = ['residencial', 'vacacional', 'renta', 'mixto'];

/**
 * Tope de precio dinámico para el filtro: el inmueble más caro del catálogo
 * cargado, redondeado al millón superior, con piso en MAX_PRICE para conservar
 * granularidad en catálogos baratos. Antes el default era fijo en MAX_PRICE
 * (50M) y escondía silenciosamente cualquier desarrollo arriba de ese monto
 * (p.ej. Dhamar a $75.1M no aparecía en /desarrollos). Caso 2026-06-03.
 */
export function computePriceCeiling(properties: Property[]): number {
  let max = 0;
  for (const p of properties) {
    const hi = p.priceMax && p.priceMax > p.price.mxn ? p.priceMax : p.price.mxn;
    if (typeof hi === 'number' && hi > max) max = hi;
  }
  if (max <= 0) return MAX_PRICE;
  return Math.max(MAX_PRICE, Math.ceil(max / 1_000_000) * 1_000_000);
}

function parseFiltersFromParams(params: URLSearchParams): Partial<Filters> {
  const parsed: Partial<Filters> = {};

  const search = params.get('search');
  if (search) parsed.search = search;

  const city = params.get('city');
  if (city) parsed.city = city;

  const zone = params.get('zone');
  if (zone) parsed.zone = zone;

  const type = params.get('type');
  if (type) parsed.type = type;

  const bedrooms = params.get('bedrooms');
  if (bedrooms) { const n = Number(bedrooms); if (n > 0) parsed.bedroomsMin = n; }

  const devType = params.get('devType');
  if (devType) parsed.developmentType = devType;

  const priceMin = params.get('priceMin');
  if (priceMin) { const n = Number(priceMin); if (n > 0) parsed.priceMin = n; }

  const priceMax = params.get('priceMax');
  if (priceMax) { const n = Number(priceMax); if (n > 0) parsed.priceMax = n; }

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

  // Tope dinámico según el catálogo cargado (estable por carga de página).
  const priceCeiling = useMemo(() => computePriceCeiling(properties), [properties]);

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    priceMax: priceCeiling,
    ...parseFiltersFromParams(searchParams),
  }));

  // Re-apply URL params if they change (e.g. AI redirect).
  // React docs pattern "Adjusting state when a prop changes": setState during render,
  // gated by tracking the previous searchParams reference so we only re-merge once per change.
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    const fromUrl = parseFiltersFromParams(searchParams);
    if (Object.keys(fromUrl).length > 0) {
      setFilters(prev => ({ ...prev, ...fromUrl }));
    }
  }
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'roi' | 'date'>('relevance');

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...defaultFilters, priceMax: priceCeiling });
  }, [priceCeiling]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.city) count++;
    if (filters.zone) count++;
    if (filters.type) count++;
    if (filters.priceMin > 0) count++;
    if (filters.priceMax < priceCeiling) count++;
    if (filters.roiMin > 0) count++;
    if (filters.stage) count++;
    if (filters.usage) count++;
    if (filters.bedroomsMin > 0) count++;
    if (filters.developmentType) count++;
    return count;
  }, [filters, priceCeiling]);

  const filtered = useMemo(() => {
    // Diagnóstico Bloque A 2026-05-23 — Luis reportó "TODAS las pills fallan,
    // no despliega lista". Para reproducir sin contaminar prod: en devtools
    // ejecutar `localStorage.setItem('debug_filters','1')` y refrescar. El
    // hook imprime motivo de descarte por propiedad. Quitar tras root-causear.
    const debug =
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('debug_filters') === '1';
    if (debug) {
      console.debug('[useFilters] input', {
        propertiesCount: properties.length,
        filters,
        sample: properties[0]
          ? {
              id: properties[0].id,
              kind: properties[0].kind,
              city: properties[0].location.city,
              zone: properties[0].location.zone,
              type: properties[0].specs.type,
              stage: properties[0].stage,
              priceMxn: properties[0].price.mxn,
              developmentType: properties[0].developmentType,
              bedroomsMin: properties[0].bedroomsMin,
              bedroomsMax: properties[0].bedroomsMax,
            }
          : null,
      });
    }
    const reasons: Record<string, number> = {};
    const fail = (reason: string) => {
      if (debug) reasons[reason] = (reasons[reason] ?? 0) + 1;
      return false;
    };
    const result = properties.filter(p => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.zone.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q);
        if (!match) return fail('search');
      }
      if (filters.city && p.location.city !== filters.city) return fail(`city:'${p.location.city}'≠'${filters.city}'`);
      if (filters.zone && p.location.zone !== filters.zone) return fail(`zone:'${p.location.zone}'≠'${filters.zone}'`);
      if (filters.type && p.specs.type !== filters.type) return fail(`type:'${p.specs.type}'≠'${filters.type}'`);
      if (p.price.mxn < filters.priceMin) return fail('priceMin');
      if (p.price.mxn > filters.priceMax) return fail('priceMax');
      if (filters.roiMin && p.roi.projected < filters.roiMin) return fail('roiMin');
      if (filters.stage && p.stage !== filters.stage) return fail(`stage:'${p.stage}'≠'${filters.stage}'`);
      if (filters.usage && !p.usage.includes(filters.usage)) return fail('usage');
      if (filters.developmentType && p.developmentType !== filters.developmentType)
        return fail(`devType:'${p.developmentType}'≠'${filters.developmentType}'`);
      if (filters.bedroomsMin > 0) {
        // Para developments: usar el rango agregado bedroomsMin/Max desde
        // v_units. Para units: el campo directo specs.bedrooms.
        // bedroomsMin = 4 significa "4 o más" → matchea cualquier >= 4.
        const targetMin = filters.bedroomsMin;
        if (p.kind === 'development') {
          const min = p.bedroomsMin ?? 0;
          const max = p.bedroomsMax ?? min;
          if (targetMin === 4) {
            if (max < 4) return fail('bedrooms(dev)4+');
          } else if (min > targetMin || max < targetMin) {
            return fail(`bedrooms(dev):[${min},${max}]∌${targetMin}`);
          }
        } else {
          const b = p.specs.bedrooms;
          if (targetMin === 4) {
            if (b < 4) return fail('bedrooms(unit)4+');
          } else if (b !== targetMin) {
            return fail(`bedrooms(unit):${b}≠${targetMin}`);
          }
        }
      }
      return true;
    });

    if (debug) {
      console.debug('[useFilters] output', {
        filteredCount: result.length,
        discardReasons: reasons,
      });
    }

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

  return { filters, filtered, updateFilter, clearFilters, activeFilterCount, sortBy, setSortBy, priceCeiling };
}
