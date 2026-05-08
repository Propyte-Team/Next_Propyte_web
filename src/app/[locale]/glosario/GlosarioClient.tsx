'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import GlossaryLeadGateModal from '@/components/glosario/GlossaryLeadGateModal';

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

  const letters = Object.keys(grouped).sort();
  const hasResults = letters.length > 0;
  const isSearching = query.trim().length > 0;
  const counterLabel = tG('resultsCount', { count: filtered.length });

  return (
    <>
      {/* Sticky search + letter nav (combined) */}
      <div className="sticky top-[108px] lg:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
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
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1A2F3F] placeholder:text-gray-600 focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/30 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="inline-flex items-center gap-1.5 h-[42px] px-3 sm:px-4 rounded-xl bg-[#1A2F3F] text-white text-xs sm:text-sm font-bold hover:bg-[#0F1923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors flex-shrink-0"
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
          <nav aria-label="Glossary letters">
            <div className="flex flex-wrap gap-2 justify-center">
              {hasResults ? (
                letters.map((letter) => (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-bold text-[#1A2F3F] bg-gray-100 hover:bg-[#5CE0D2] hover:text-[#0F1923] rounded-lg transition-colors"
                  >
                    <span>{letter}</span>
                    <span className="text-2xs font-semibold opacity-60 tabular-nums">
                      {grouped[letter].length}
                    </span>
                  </a>
                ))
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
              <div key={letter} id={`letter-${letter}`}>
                <h2 className="text-3xl font-bold text-[#0F766E] mb-4 border-b border-gray-100 pb-2">
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
                            className="ml-2 text-[#0F766E] hover:underline text-xs font-semibold"
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
