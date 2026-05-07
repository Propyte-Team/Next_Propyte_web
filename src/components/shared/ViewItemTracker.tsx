'use client';

import { useEffect, useRef } from 'react';
import { trackViewItem } from '@/lib/analytics/track';

interface ViewItemTrackerProps {
  itemId: string;
  itemName: string;
  itemKind: 'development' | 'unit';
  city?: string;
  zone?: string;
  priceMxn?: number;
}

/**
 * Mount-once `view_item` emitter for property detail pages. Renders nothing.
 * Server detail pages drop this in once the slug resolves and bail out
 * silently when consent is denied (gtag/fbq queue calls until consent).
 */
export default function ViewItemTracker(props: ViewItemTrackerProps) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackViewItem(props);
    // We track this exactly once per mount (per detail page navigation).
    // Subsequent prop changes within the same mount are ignored on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
