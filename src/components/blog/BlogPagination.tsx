'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from '@/lib/icons';
import { useCallback } from 'react';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  locale: string;
  prevLabel: string;
  nextLabel: string;
}

export default function BlogPagination({
  currentPage,
  totalPages,
  locale,
  prevLabel,
  nextLabel,
}: BlogPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete('pagina');
      } else {
        params.set('pagina', String(page));
      }
      router.push(`/${locale}/blog?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Paginación">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={prevLabel}
      >
        <ChevronLeft size={16} /> {prevLabel}
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-[#1A2F3F] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={nextLabel}
      >
        {nextLabel} <ChevronRight size={16} />
      </button>
    </nav>
  );
}
