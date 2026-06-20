'use client';

import { createContext, useContext } from 'react';
import type { HubSiteConfig } from '@/lib/hub-content';
import { resolveSiteContact, type SiteContact } from '@/lib/site-contact';

// Provee el site-config del Hub a todo el árbol cliente. Se hidrata una vez
// en layout.tsx desde getSiteConfig() (server). Cualquier componente cliente
// que necesite datos de contacto usa useSiteContact() y reacciona al Hub.
const SiteConfigContext = createContext<HubSiteConfig>({});

export function SiteConfigProvider({
  config,
  children,
}: {
  config: HubSiteConfig;
  children: React.ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/** Config cruda del Hub (key/value). */
export function useSiteConfig(): HubSiteConfig {
  return useContext(SiteConfigContext);
}

/** Datos de contacto ya resueltos (whatsapp, teléfono, email, presets). */
export function useSiteContact(): SiteContact {
  return resolveSiteContact(useContext(SiteConfigContext));
}
