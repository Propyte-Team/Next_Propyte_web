import type { ComponentType } from 'react';
import { getSiteMedia } from '@/lib/hub-content';
import SiteMediaView from '@/components/shared/SiteMediaView';

interface SiteMediaProps {
  /** Slug del slot en el catálogo (ej. "city.tulum"). */
  mediaKey: string;
  label?: string;
  className?: string;
  tone?: 'light' | 'dark';
  icon?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  locale?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Server wrapper: resuelve el material del Hub por `mediaKey` y delega el render
 * a SiteMediaView (con fallback a placeholder). Para páginas server (async).
 * En páginas client, obtener el mapa con getSiteMedia() en el page.tsx server y
 * pasar `entry` directo a <SiteMediaView>.
 */
export default async function SiteMedia({ mediaKey, ...rest }: SiteMediaProps) {
  const media = await getSiteMedia();
  return <SiteMediaView entry={media[mediaKey]} {...rest} />;
}
