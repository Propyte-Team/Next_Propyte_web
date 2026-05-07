'use client';

import { useUTMCapture } from '@/hooks/useUTMCapture';

/**
 * Mount-once side-effect component. Triggers `useUTMCapture` on the client
 * to persist UTM/click-id params from the landing URL into sessionStorage.
 * Renders nothing.
 */
export default function UTMCapture() {
  useUTMCapture();
  return null;
}
