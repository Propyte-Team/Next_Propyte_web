'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Download } from '@/lib/icons';
import { useTranslations } from 'next-intl';
import GlossaryLeadGateModal from '@/components/glosario/GlossaryLeadGateModal';
import { useCssHeightVar } from '@/hooks/useCssHeightVar';

// Espacio reservado arriba de cada sección de letra para que su <h2> no quede
// tapado por el header fijo + esta barra sticky (search + nav de letras) al
// saltar con el ancla `#letter-X`. `--glosario-sticky-height` es el alto real
// de la barra (medido, cambia si el contador de búsqueda aparece o si la fila
// de letras da un salto de línea distinto); los otros dos vars ya existen
// para el header global (ver MainPadding.tsx).
const SCROLL_MARGIN =
  'scroll-mt-[calc(var(--mobile-header-height,122px)_+_var(--glosario-sticky-height,180px))] ' +
  'lg:scroll-mt-[calc(var(--desktop-header-height,80px)_+_var(--glosario-sticky-height,140px))]';

interface Term {
  name: string;
  def: string;
  link?: string;
}

interface GlosarioClientProps {
  terms: Term[];
  locale: string;
  labels: {
    learnMore: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    noResults: string;
    downloadPdf: string;
    downloadPdfShort: string;
  };
}

const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export default function GlosarioClient({ terms, locale, labels }: GlosarioClientProps) {
  const tG = useTranslations('glosario');
  const [query, setQuery] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  useCssHeightVar(stickyBarRef, '--glosario-sticky-height');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return terms;
    const needle = stripDiacritics(q);
    return terms.filter(
      (t) =>
        stripDiacritics(t.name).includes(needle) ||
        stripDiacritics(t.def).includes(needle),
    );
  }, [terms, query]);

  const grouped = useMemo(() => {
    const g: Record<string, Term[]> = {};
    for (const t of filtered) {
      const letter = t.name[0]?.toUpperCase() ?? '#';
      if (!g[letter]) g[letter] = [];
      g[letter].push(t);
    }
    return g;
  }, [filtered]);

  // useMemo (no solo `const letters = ...`): sin esto, cada render produce un
  // array nuevo (misma letra, distinta referencia) y el efecto del observer
  // de abajo depende de `letters` — se re-crea en cada `setActiveLetter`,
  // reinicia el observer a mitad de scroll y el resaltado nunca se estabiliza.
  const letters = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const hasResults = letters.length > 0;
  const isSearching = query.trim().length > 0;
  const counterLabel = tG('resultsCount', { count: filtered.length });

  // Resalta en la nav la letra de la sección que está "debajo" del header +
  // la barra sticky. `rootMargin` top toma el mismo `scrollMarginTop` ya
  // calculado en CSS para las secciones (ver SCROLL_MARGIN arriba) — así el
  // límite de activación coincide exactamente con lo que scroll-margin-top ya
  // despeja, sin duplicar la lógica de breakpoints en JS. `bottom: -60%`
  // restringe la "zona activa" a la franja superior del viewport, patrón
  // scrollspy estándar (evita que 2-3 secciones largas cuenten como activas
  // a la vez).
  useEffect(() => {
    if (!hasResults) return;
    const sections = letters
      .map((letter) => document.getElementById(`letter-${letter}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visible = new Set<string>();
    let observer: IntersectionObserver | null = null;

    // Recrea el observer con el `scrollMarginTop` actual — necesario porque
    // `rootMargin` es inmutable tras crear el IntersectionObserver, y ese
    // valor cambia al cruzar el breakpoint `lg` o si la barra sticky cambia
    // de alto (aparece/desaparece el contador de búsqueda).
    //
    // El margen inferior NO puede ser un porcentaje del viewport (`-60%` como
    // en un desktop típico): en un celular real, header + barra sticky ya
    // ocupan ~300-380px de un viewport visible de ~550-700px (más corto que
    // en desktop por la barra de direcciones), así que top(px) + 60%(alto) ya
    // supera el 100% del viewport — la "zona activa" queda invertida (su
    // límite inferior por encima del superior) y el observer nunca marca
    // ninguna sección como intersecando. En su lugar, se reserva una franja
    // fija de `ACTIVE_BAND` px justo debajo del header+barra, recortada al
    // alto real del viewport para nunca invertirse.
    const setup = () => {
      observer?.disconnect();
      const topOffset = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
      const ACTIVE_BAND = 80;
      const bottomMargin = Math.max(0, window.innerHeight - topOffset - ACTIVE_BAND);
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const letter = (entry.target as HTMLElement).dataset.letter;
            if (!letter) return;
            if (entry.isIntersecting) visible.add(letter);
            else visible.delete(letter);
          });
          const firstVisible = letters.find((l) => visible.has(l));
          if (firstVisible) setActiveLetter(firstVisible);
        },
        { rootMargin: `-${topOffset}px 0px -${bottomMargin}px 0px`, threshold: 0 },
      );
      sections.forEach((el) => observer!.observe(el));
    };

    setup();
    setActiveLetter(letters[0]);

    window.addEventListener('resize', setup);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', setup);
    };
  }, [letters, hasResults]);

  return (
    <>
      {/* Sticky search + letter nav (combined) */}
      {/* `top` toma las MISMAS variables que SCROLL_MARGIN (alto real medido
          del header, no un número fijo) — así la barra siempre queda pegada
          justo debajo del header real, sin importar locale/fuente/banners que
          cambien su alto. Un valor hardcodeado (ej. 108px o 126px) se
          desincroniza apenas el header mide distinto. */}
      <div ref={stickyBarRef} className="sticky top-[var(--mobile-header-height,122px)] lg:top-[var(--desktop-header-height,80px)] z-30 bg-white/10 backdrop-blur-md border-gray-100 shadow-sm">
      {/* le quité "border-b" justo antes de border-gray */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 space-y-3">
          {/* Search bar + Download PDF */}
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.searchPlaceholder}
                aria-label={labels.searchAriaLabel}
                className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1A2F3F] placeholder:text-gray-600 focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/30 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 sm:px-4 rounded-xl bg-[#1A2F3F] text-white text-xs sm:text-sm font-bold hover:bg-[#0F1923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors flex-shrink-0 touch-manipulation"
              aria-label={labels.downloadPdf}
              title={labels.downloadPdf}
            >
              <Download size={14} strokeWidth={2.25} />
              <span className="hidden sm:inline">{labels.downloadPdfShort}</span>
            </button>
          </div>

          {/* Counter (only while searching) */}
          {isSearching && (
            <p
              className="text-center text-xs font-semibold text-gray-600 tabular-nums"
              role="status"
            >
              {counterLabel}
            </p>
          )}

          {/* Letter navigation with counts */}
          <nav aria-label={tG('lettersAriaLabel')}>
            <div className="flex flex-wrap gap-2 justify-center">
              {hasResults ? (
                letters.map((letter) => {
                  const isActive = activeLetter === letter;
                  return (
                    <a
                      key={letter}
                      href={`#letter-${letter}`}
                      aria-current={isActive ? 'true' : undefined}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] min-w-[44px] text-sm font-bold rounded-lg transition-colors touch-manipulation ${
                        isActive
                          ? 'bg-propyte-brand text-[#0F1923]'
                          : 'text-[#1A2F3F] bg-gray-100 hover:bg-propyte-brand hover:text-[#0F1923]'
                      }`}
                    >
                      <span>{letter}</span>
                      <span className="text-2xs font-semibold opacity-60 tabular-nums">
                        {grouped[letter].length}
                      </span>
                    </a>
                  );
                })
              ) : (
                <span className="text-sm text-gray-600" role="status">
                  {labels.noResults}
                </span>
              )}
            </div>
          </nav>
        </div>
      </div>

      <GlossaryLeadGateModal open={gateOpen} onClose={() => setGateOpen(false)} />

      {/* Terms */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-10">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`} data-letter={letter} className={SCROLL_MARGIN}>
                <h2 className="text-3xl font-bold text-[#0E7490] mb-4 border-b border-gray-100 pb-2">
                  {letter}
                </h2>
                <dl className="space-y-4">
                  {grouped[letter].map((term) => (
                    <div
                      key={term.name}
                      className="bg-white p-4 rounded-xl border border-gray-100"
                    >
                      <dt className="font-bold text-[#1A2F3F] mb-1">{term.name}</dt>
                      <dd className="text-sm text-gray-600 leading-relaxed">
                        {term.def}
                        {term.link && (
                          <Link
                            href={`/${locale}${term.link}`}
                            className="ml-2 inline-flex items-center min-h-[44px] md:min-h-0 text-[#0E7490] hover:underline text-xs font-semibold"
                          >
                            {labels.learnMore}
                          </Link>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
