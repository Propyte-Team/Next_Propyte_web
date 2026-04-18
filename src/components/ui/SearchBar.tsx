'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('hero');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/propiedades?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/${locale}/propiedades`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full h-12 md:h-14 pl-12 pr-4 rounded-l-lg border-2 border-r-0 border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:outline-none focus:border-white/60 backdrop-blur-sm"
        />
      </div>
      <button
        type="submit"
        className="h-12 md:h-14 px-6 md:px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-r-lg transition-colors whitespace-nowrap"
      >
        {t('searchButton')}
      </button>
    </form>
  );
}
