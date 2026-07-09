'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface CategoryFilterProps {
  categories: string[];
  active: string | null;
  allLabel: string;
  filterAriaLabel: string;
  locale: string;
}

export default function CategoryFilter({ categories, active, allLabel, filterAriaLabel, locale }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setCategory = useCallback(
    (cat: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (cat) {
        params.set('categoria', cat);
      } else {
        params.delete('categoria');
      }
      params.delete('pagina');
      router.push(`/${locale}/blog?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={filterAriaLabel}>
      <button
        onClick={() => setCategory(null)}
        className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
          !active
            ? 'bg-[#1A2F3F] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-pressed={!active}
      >
        {allLabel}
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
            active === cat
              ? 'bg-[#5CE0D2] text-[#0F1923]'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-pressed={active === cat}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
