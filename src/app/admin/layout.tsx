/**
 * Layout /admin/*  —  Design Playground.
 *
 * Gate:
 *   - En producción devuelve 404 (Fase 1: acuerdo dev-only)
 *   - En desarrollo siempre accesible
 *
 * Hereda <html>/<body> del root layout (src/app/layout.tsx).
 * No monta Header/Footer/Sidebar — el playground tiene su propia chrome.
 */

import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Propyte Design Playground',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <>{children}</>;
}
