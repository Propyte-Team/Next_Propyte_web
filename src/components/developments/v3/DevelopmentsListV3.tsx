'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, X } from '@/lib/icons';
import { useFilters } from '@/hooks/useFilters';
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';
import { trackSearch } from '@/lib/analytics/track';
import { gsap, SplitText, useGSAP, MOTION_OK, prefersReducedMotion } from '@/lib/gsap-client';
import DevCardV3, { type DevCardV3Data } from '@/components/v3/DevCardV3';
import { compactMoney, placeLabel } from '@/components/v3/format';
import type { Property, PropertyStage } from '@/types/property';

const PAGE = 12;
const STAGES: PropertyStage[] = ['preventa', 'construccion', 'entrega_inmediata'];
/** Topes del filtro de precio (MXN). Escalones redondos que un comprador dice en voz alta. */
const PRICE_STEPS = [2_000_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000];

interface Props {
  properties: Property[];
  title: string;
  /** Texto bajo el título. Si no llega, se arma con los conteos reales. */
  lead?: string;
  /** Páginas de ciudad: el servidor ya filtró, así que no se ofrecen pestañas de ciudad. */
  lockedCity?: boolean;
  /** Bloque opcional bajo el encabezado (foto de ciudad, por ejemplo). */
  children?: React.ReactNode;
}

/**
 * Listado de desarrollos v3. Encabezado editorial con conteos reales, filtros en
 * una sola franja con filetes (ciudad como pestañas de texto, etapa, tipo, zona,
 * precio y orden) y rejilla de tarjetas donde la primera ocupa dos columnas.
 *
 * Mismo patrón SSR que MarketplaceContent: el fallback del <Suspense> pinta el
 * catálogo sin filtros para que el HTML servido traiga H1 y tarjetas; en el
 * cliente lo reemplaza la versión que lee la querystring.
 */
export default function DevelopmentsListV3(props: Props) {
  return (
    <Suspense fallback={<ListBody {...props} searchParams={null} />}>
      <WithParams {...props} />
    </Suspense>
  );
}

function WithParams(props: Props) {
  const searchParams = useSearchParams();
  return <ListBody {...props} searchParams={searchParams} />;
}

function ListBody({ properties, title, lead, lockedCity = false, children, searchParams }: Props & { searchParams: URLSearchParams | null }) {
  const t = useTranslations('developmentsV3');
  const tTypes = useTranslations('types');
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(PAGE);
  // Móvil: los filtros van plegados para que la primera tarjeta entre en pantalla.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters, filtered, updateFilter, updateFilters, clearFilters, activeFilterCount, sortBy, setSortBy, priceCeiling } = useFilters(properties, searchParams);

  const cities = useMemo(() => {
    const s = new Set<string>();
    properties.forEach((p) => { if (p.location.city) s.add(p.location.city); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'));
  }, [properties]);
  const zones = useMemo(() => {
    const s = new Set<string>();
    properties.forEach((p) => {
      if (filters.city && p.location.city !== filters.city) return;
      if (p.location.zone && p.location.zone !== p.location.city) s.add(p.location.zone);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'));
  }, [properties, filters.city]);
  const types = useMemo(() => {
    const s = new Set<string>();
    properties.forEach((p) => (p.unitTypes?.length ? p.unitTypes : [p.specs.type]).forEach((x) => s.add(x)));
    return PRODUCT_TYPES.filter((x) => s.has(x));
  }, [properties]);

  // Lo que se pinta: tarjetas ya formateadas.
  const cards = useMemo<DevCardV3Data[]>(() => filtered.map((p) => {
    const amount = p.price.currency === 'USD' ? (p.price.usd ?? null) : p.price.mxn;
    const meta: string[] = [];
    const typeLabels = (p.unitTypes?.length ? p.unitTypes : [p.specs.type]).slice(0, 2).map((x) => tTypes(x));
    if (typeLabels.length) meta.push(typeLabels.join(', '));
    if (p.inventory?.available && p.inventory.available > 0) meta.push(t('available', { count: p.inventory.available }));
    if (p.stage !== 'entrega_inmediata' && p.delivery?.text) meta.push(t('delivery', { date: p.delivery.text }));
    return {
      id: p.id,
      href: `/${locale}/desarrollos/${p.slug}`,
      name: p.name,
      place: placeLabel(p.location.zone, p.location.city),
      image: p.images[0] ?? null,
      stageLabel: t(`stages.${p.stage}`),
      presale: p.stage === 'preventa',
      priceLabel: compactMoney(amount, p.price.currency, locale),
      meta,
    };
  }), [filtered, locale, t, tTypes]);

  const cityCount = cities.length;
  const leadText = lead ?? t('lead', { count: properties.length, cities: cityCount });
  const visible = cards.slice(0, shown);

  // Volver a la primera página de resultados cuando cambian los filtros
  // ("ajustar estado cuando cambia una prop", sin efecto).
  const filterKey = `${filters.city}|${filters.zone}|${filters.stage}|${filters.type}|${filters.priceMax}|${filters.search}|${sortBy}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setShown(PAGE);
  }

  // Evento GA4 `search` con debounce, igual que el marketplace anterior.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (activeFilterCount === 0) return;
    const id = window.setTimeout(() => {
      trackSearch({
        searchTerm: filters.search || undefined,
        filters: {
          city: filters.city || undefined,
          type: filters.type || undefined,
          stage: filters.stage || undefined,
          priceMax: filters.priceMax < priceCeiling ? filters.priceMax : undefined,
        },
        resultCount: filtered.length,
      });
    }, 600);
    return () => window.clearTimeout(id);
  }, [filterKey, activeFilterCount, filters, priceCeiling, filtered.length]);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const h1 = root.current?.querySelector('h1');
      if (h1) {
        SplitText.create(h1, {
          type: 'lines,words', mask: 'lines', autoSplit: true,
          onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.035 }),
        });
      }
    });
    return () => mm.revert();
  }, { scope: root });

  // Al filtrar, las tarjetas visibles entran con un desplazamiento corto.
  // fromTo termina siempre en visible: ninguna tarjeta puede quedarse oculta.
  useGSAP(() => {
    if (prefersReducedMotion() || !grid.current) return;
    gsap.fromTo(grid.current.querySelectorAll('article'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  }, { scope: grid, dependencies: [filterKey], revertOnUpdate: false });

  const selectCls = 'w-full bg-transparent border-0 border-b border-black/15 rounded-none py-2.5 pr-7 text-[15px] text-[#13222C] focus:outline-none focus:border-[#0F1923] appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%235B6B74%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_4px_center]';
  const labelCls = 'block text-[12px] font-medium text-[#5B6B74]';

  return (
    <div ref={root} className="bg-white text-[#13222C]">
      <header className="px-4 lg:px-10 pt-8 lg:pt-14 pb-8 lg:pb-12">
        <h1 className="font-display text-[40px] sm:text-[52px] lg:text-[clamp(56px,6.4vw,104px)] leading-[0.98] font-semibold tracking-[-0.04em] max-w-[14ch] text-balance">
          {title}
        </h1>
        <p className="mt-5 lg:mt-7 text-[16px] lg:text-[19px] leading-[1.5] text-[#5B6B74] max-w-[620px]">{leadText}</p>
      </header>

      {children}

      <section aria-label={t('filtersAria')} className="px-4 lg:px-10 border-t border-black/10">
        {!lockedCity && cities.length > 1 && (
          <div role="tablist" aria-label={t('citiesAria')} className="flex gap-6 lg:gap-9 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-black/10">
            {['', ...cities].map((c) => {
              const active = filters.city === c;
              return (
                <button
                  key={c || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => updateFilters({ city: c, zone: '' })}
                  className={`relative shrink-0 whitespace-nowrap py-4 lg:py-5 text-[15px] lg:text-base font-medium transition-colors ${active ? 'text-[#13222C]' : 'text-[#5B6B74] hover:text-[#13222C]'}`}
                >
                  {c || t('all')}
                  <span aria-hidden="true" className={`absolute left-0 right-0 -bottom-px h-0.5 bg-[#0F1923] transition-transform duration-300 origin-left ${active ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              );
            })}
          </div>
        )}

        <div className="lg:hidden flex items-center justify-between gap-4 py-4">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="dev-filters"
            onClick={() => setFiltersOpen((v) => !v)}
            className="h-11 px-4 rounded-md border border-black/15 text-[15px] font-semibold inline-flex items-center gap-2"
          >
            {t('filters')}{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            <span aria-hidden="true" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`}>⌄</span>
          </button>
          <span className="text-[14px] text-[#5B6B74]">{t('results', { count: filtered.length })}</span>
        </div>

        <div id="dev-filters" className={`${filtersOpen ? 'grid' : 'hidden'} lg:grid grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto] gap-x-5 lg:gap-x-8 gap-y-5 pb-5 lg:py-6 items-end`}>
          <label className="col-span-2 lg:col-span-1 relative">
            <span className={labelCls}>{t('searchLabel')}</span>
            <Search size={16} aria-hidden="true" className="absolute left-0 bottom-3 text-[#5B6B74]" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-transparent border-0 border-b border-black/15 rounded-none py-2.5 pl-6 text-[15px] placeholder:text-[#8A979E] focus:outline-none focus:border-[#0F1923]"
            />
          </label>
          <label>
            <span className={labelCls}>{t('stage')}</span>
            <select value={filters.stage} onChange={(e) => updateFilter('stage', e.target.value as PropertyStage | '')} className={selectCls}>
              <option value="">{t('stageAll')}</option>
              {STAGES.map((s) => <option key={s} value={s}>{t(`stages.${s}`)}</option>)}
            </select>
          </label>
          <label>
            <span className={labelCls}>{t('type')}</span>
            <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className={selectCls}>
              <option value="">{t('typeAll')}</option>
              {types.map((x) => <option key={x} value={x}>{tTypes(x)}</option>)}
            </select>
          </label>
          <label>
            <span className={labelCls}>{t('zone')}</span>
            <select value={filters.zone} onChange={(e) => updateFilter('zone', e.target.value)} className={selectCls} disabled={zones.length === 0}>
              <option value="">{t('zoneAll')}</option>
              {zones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
          <label>
            <span className={labelCls}>{t('price')}</span>
            <select
              value={filters.priceMax < priceCeiling ? String(filters.priceMax) : ''}
              onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : priceCeiling)}
              className={selectCls}
            >
              <option value="">{t('priceAll')}</option>
              {PRICE_STEPS.map((n) => <option key={n} value={n}>{t('priceUpTo', { amount: compactMoney(n, 'MXN', locale) ?? '' })}</option>)}
            </select>
          </label>
          <label className="col-span-2 lg:col-span-1 lg:w-[190px]">
            <span className={labelCls}>{t('sort')}</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={selectCls}>
              <option value="relevance">{t('sortRelevance')}</option>
              <option value="price_asc">{t('sortPriceAsc')}</option>
              <option value="price_desc">{t('sortPriceDesc')}</option>
              <option value="date">{t('sortDate')}</option>
            </select>
          </label>
        </div>

        <div className={`${filtersOpen || activeFilterCount > 0 ? 'flex' : 'hidden'} lg:flex items-center justify-between gap-4 pb-5 lg:pb-6 text-[14px] text-[#5B6B74]`} aria-live="polite">
          <span>{t('results', { count: filtered.length })}</span>
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 font-semibold text-[#13222C] hover:text-[#0E7490]">
              <X size={14} aria-hidden="true" /> {t('clear')}
            </button>
          )}
        </div>
      </section>

      <section className="px-4 lg:px-10 pt-6 lg:pt-10 pb-[72px] lg:pb-32">
        {visible.length > 0 ? (
          <>
            <div ref={grid} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-y-16">
              {visible.map((d, i) => (
                <DevCardV3 key={d.id} d={d} fromLabel={t('from')} wide={i === 0} priority={i < 2} />
              ))}
            </div>
            {cards.length > shown && (
              <div className="mt-14 lg:mt-20 flex flex-col items-center gap-4">
                <div className="w-full max-w-[320px] h-0.5 bg-black/10 relative" aria-hidden="true">
                  <i className="absolute left-0 top-0 h-0.5 bg-[#0F1923]" style={{ width: `${(shown / cards.length) * 100}%` }} />
                </div>
                <p className="text-[14px] text-[#5B6B74]">{t('showing', { shown, total: cards.length })}</p>
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className="mt-1 h-12 px-7 rounded-md bg-[#0F1923] text-white text-[15px] font-semibold hover:bg-[#1A2F3F] transition-colors"
                >
                  {t('more', { count: Math.min(PAGE, cards.length - shown) })}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 lg:py-24 max-w-[560px]">
            <p className="font-display text-[28px] lg:text-[36px] leading-[1.1] font-semibold tracking-[-0.03em]">{t('empty')}</p>
            <p className="mt-3 text-[#5B6B74]">{t('emptyBody')}</p>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="mt-6 h-12 px-6 rounded-md border border-[#0F1923] font-semibold hover:bg-[#0F1923] hover:text-white transition-colors">
                {t('clear')}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
