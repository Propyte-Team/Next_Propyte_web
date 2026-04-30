'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

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
  };
}

const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export default function GlosarioClient({ terms, locale, labels }: GlosarioClientProps) {
  const [query, setQuery] = useState('');

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

  return (
    <>
      {/* Search bar */}
      <div className="py-6 bg-white border-b">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchAriaLabel}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#1A2F3F] placeholder:text-gray-400 focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Letter navigation with counts */}
      <nav
        className="py-4 border-b bg-white sticky top-16 z-10"
        aria-label="Glossary letters"
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {hasResults ? (
              letters.map((letter) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-bold text-[#1A2F3F] bg-gray-100 hover:bg-[#5CE0D2] hover:text-[#0F1923] rounded-lg transition-colors"
                >
                  <span>{letter}</span>
                  <span className="text-[11px] font-semibold opacity-60 tabular-nums">
                    {grouped[letter].length}
                  </span>
                </a>
              ))
            ) : (
              <span className="text-sm text-gray-500" role="status">
                {labels.noResults}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Terms */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-10">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <h2 className="text-3xl font-bold text-[#0D9488] mb-4 border-b border-gray-100 pb-2">
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
                            className="ml-2 text-[#0D9488] hover:underline text-xs font-semibold"
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
