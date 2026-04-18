'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type SearchType = 'desarrollos' | 'propiedades';

interface SearchContextValue {
  type: SearchType;
  setType: (type: SearchType) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children, defaultType = 'desarrollos' }: { children: ReactNode; defaultType?: SearchType }) {
  const [type, setType] = useState<SearchType>(defaultType);
  return <SearchContext.Provider value={{ type, setType }}>{children}</SearchContext.Provider>;
}

export function useSearchType(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearchType must be used within a SearchProvider');
  }
  return ctx;
}
