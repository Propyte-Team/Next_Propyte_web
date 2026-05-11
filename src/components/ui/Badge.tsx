import type { PropertyBadge } from '@/types/property';

interface BadgeProps {
  type: Exclude<PropertyBadge, null>;
  label: string;
  className?: string;
}

const badgeStyles: Record<Exclude<PropertyBadge, null>, string> = {
  preventa: 'bg-[#0D9488] text-white',
  nuevo: 'bg-[#5CE0D2] text-[#0F1923]',
  entrega_inmediata: 'bg-[#22C55E] text-white',
  construccion: 'bg-[#1A2F3F] text-white',
  proximamente: 'bg-[#6366F1] text-white',
  reservado: 'bg-[#0D9488]/80 text-white',
  vendido: 'bg-gray-500 text-white',
};

export default function Badge({ type, label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded uppercase tracking-wide ${badgeStyles[type]} ${className}`}>
      {label}
    </span>
  );
}
