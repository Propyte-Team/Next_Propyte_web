import Image from 'next/image';
import type { ComponentType } from 'react';
import type { SiteMediaEntry } from '@/lib/hub-content';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';

interface SiteMediaViewProps {
  /** Entrada resuelta del Hub; si falta o no tiene url → placeholder de marca. */
  entry?: SiteMediaEntry | null;
  label?: string;
  className?: string;
  tone?: 'light' | 'dark';
  icon?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  locale?: string;
  sizes?: string;
  priority?: boolean;
}

function isExternalVideo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com/i.test(url);
}

function toEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;
  return url;
}

/**
 * Renderiza el material real de un slot (imagen/video) o, si no hay, el
 * placeholder de marca. Componente puro (sin hooks) → usable tanto en páginas
 * server como dentro de árboles client (recibe `entry` por prop).
 */
export default function SiteMediaView({
  entry,
  label,
  className = '',
  tone = 'light',
  icon,
  locale = 'es',
  sizes = '100vw',
  priority,
}: SiteMediaViewProps) {
  if (!entry?.url) {
    return <ImagePlaceholder label={label} className={className} tone={tone} icon={icon} />;
  }

  const alt = (locale === 'en' ? entry.alt_en : entry.alt_es) || label || '';

  if (entry.kind === 'video') {
    if (isExternalVideo(entry.url)) {
      return (
        <div className={`relative overflow-hidden rounded-2xl ${className}`}>
          <iframe
            src={toEmbed(entry.url)}
            title={alt}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        {/* Sin autoplay → respeta prefers-reduced-motion (el usuario inicia). */}
        <video
          src={entry.url}
          className="absolute inset-0 w-full h-full object-cover"
          controls
          muted
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <Image src={entry.url} alt={alt} fill className="object-cover" sizes={sizes} priority={priority} />
    </div>
  );
}
