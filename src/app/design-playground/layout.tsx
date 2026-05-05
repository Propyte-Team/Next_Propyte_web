/**
 * Layout /design-playground/*
 *
 * Gate: sólo accesible si NODE_ENV !== 'production' O si
 * NEXT_PUBLIC_ENABLE_PLAYGROUND=true (para staging con NODE_ENV=production).
 *
 * No monta Header/Footer — tiene su propia chrome.
 */

import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Design Playground — Propyte',
  robots: { index: false, follow: false },
};

export default function DesignPlaygroundLayout({ children }: { children: ReactNode }) {
  const isDev = process.env.NODE_ENV !== 'production';
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND === 'true';

  if (!isDev && !isEnabled) {
    notFound();
  }

  return <>{children}</>;
}
