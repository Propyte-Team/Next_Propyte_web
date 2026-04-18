interface BadgeProps {
  type: 'preventa' | 'nuevo' | 'entrega_inmediata' | 'construccion' | 'proximamente' | 'vendido';
  label: string;
  className?: string;
}

const badgeStyles: Record<string, string> = {
  preventa: 'bg-[#F5A623] text-white',
  nuevo: 'bg-[#5CE0D2] text-white',
  entrega_inmediata: 'bg-[#22C55E] text-white',
  construccion: 'bg-[#1A2F3F] text-white',
  proximamente: 'bg-[#6366F1] text-white',
  vendido: 'bg-gray-500 text-white',
};

export default function Badge({ type, label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded uppercase tracking-wide ${badgeStyles[type]} ${className}`}>
      {label}
    </span>
  );
}
