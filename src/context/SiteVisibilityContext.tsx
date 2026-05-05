'use client';

import { createContext, useContext } from 'react';
import type { VisibilityMap } from '@/lib/visibility';

const SiteVisibilityContext = createContext<VisibilityMap>({});

export function SiteVisibilityProvider({
  flags,
  children,
}: {
  flags: VisibilityMap;
  children: React.ReactNode;
}) {
  return (
    <SiteVisibilityContext.Provider value={flags}>
      {children}
    </SiteVisibilityContext.Provider>
  );
}

// fail-open: key absent from map → visible
export function useIsVisible(key: string): boolean {
  const map = useContext(SiteVisibilityContext);
  return map[key] !== false;
}
