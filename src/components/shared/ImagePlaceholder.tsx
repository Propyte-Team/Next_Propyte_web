import type { ComponentType } from 'react';
import { Maximize } from '@/lib/icons';

interface ImagePlaceholderProps {
  /** Texto que describe qué imagen va aquí (se reemplaza por foto real luego). */
  label?: string;
  /** Icono Lucide opcional. */
  icon?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  /** Clases de tamaño/aspect (ej. "aspect-[4/3]", "h-full"). */
  className?: string;
  /** Tono según el fondo donde se coloca. */
  tone?: 'light' | 'dark';
}

/**
 * Placeholder de imagen con estilo de marca. Marca un slot listo para que el
 * equipo suba la foto/render real. NO es una imagen final — es un hueco visible
 * y estético mientras llega el material. Decorativo (aria-hidden).
 */
export default function ImagePlaceholder({
  label,
  icon: Icon = Maximize,
  className = 'aspect-[4/3]',
  tone = 'light',
}: ImagePlaceholderProps) {
  const isDark = tone === 'dark';
  return (
    <div
      aria-hidden="true"
      className={[
        'relative w-full overflow-hidden rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center px-6',
        isDark
          ? 'border-white/15 bg-white/[0.04] text-white/55'
          : 'border-[#0E7490]/20 bg-gradient-to-br from-[#F4F6F8] to-[#E8F4F4] text-[#0E7490]/70',
        className,
      ].join(' ')}
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(92,224,210,0.08), transparent 70%)'
          : undefined,
      }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isDark ? 'bg-propyte-brand/15' : 'bg-white shadow-sm'
        }`}
      >
        <Icon size={22} strokeWidth={1.75} className={isDark ? 'text-propyte-brand' : 'text-[#0E7490]'} />
      </div>
      {label && <span className="text-xs font-semibold uppercase tracking-wider max-w-[24ch]">{label}</span>}
    </div>
  );
}