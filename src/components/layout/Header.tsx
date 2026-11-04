'use client';

import SiteNav from './SiteNav';
import type { HubSiteConfig } from '@/lib/hub-content';

// Rediseño v3 (2026-10): el nav es una píldora fija con menú desplegable
// (SiteNav). Sidebar, SearchBubble flotante, ActionsPill, MobileHeader y
// MobileMenu se dejan de montar; sus archivos siguen en el repo mientras se
// valida la v3 en develop. El skip link vive en [locale]/layout.tsx.
// siteConfig se conserva en la firma porque layout.tsx lo pasa.
export default function Header({ siteConfig: _siteConfig }: { siteConfig?: HubSiteConfig }) {
  return <SiteNav />;
}
