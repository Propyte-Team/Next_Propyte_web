import { DollarSign, Square, Bed, Bath } from 'lucide-react';

interface FloatingKeyDataProps {
  price: string | null;
  area: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  labels: {
    title: string;
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
  };
}

export default function FloatingKeyData({ price, area, bedrooms, bathrooms, labels }: FloatingKeyDataProps) {
  const items = [
    price ? { icon: DollarSign, label: labels.price, value: price } : null,
    area ? { icon: Square, label: labels.area, value: area } : null,
    bedrooms ? { icon: Bed, label: labels.bedrooms, value: bedrooms } : null,
    bathrooms ? { icon: Bath, label: labels.bathrooms, value: bathrooms } : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) return null;

  return (
    <div className="hidden md:block">
      <div className="bg-[#1A2F3F] text-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/10">
          <span className="text-2xs font-bold uppercase tracking-wider text-[#5CE0D2]">
            {labels.title}
          </span>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={13} className="text-[#5CE0D2] shrink-0" />
              <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
                <span className="text-2xs text-white/55 shrink-0">{label}</span>
                <span className="text-sm font-bold text-white truncate text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
