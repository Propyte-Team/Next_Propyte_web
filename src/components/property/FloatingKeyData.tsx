'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Square, Bed, Bath, Minimize2, Maximize2 } from 'lucide-react';

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
  const [minimized, setMinimized] = useState(false);

  const items = [
    price ? { icon: DollarSign, label: labels.price, value: price } : null,
    area ? { icon: Square, label: labels.area, value: area } : null,
    bedrooms ? { icon: Bed, label: labels.bedrooms, value: bedrooms } : null,
    bathrooms ? { icon: Bath, label: labels.bathrooms, value: bathrooms } : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: 0, y: 0 }}
      whileDrag={{ scale: 1.03 }}
      className="fixed bottom-24 right-5 z-40 select-none cursor-grab active:cursor-grabbing hidden md:block"
    >
      <div className="bg-[#1A2F3F] text-white rounded-2xl shadow-2xl overflow-hidden w-52">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5CE0D2]">
            {labels.title}
          </span>
          <button
            onClick={() => setMinimized((v) => !v)}
            className="text-white/50 hover:text-white transition-colors"
            aria-label={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>

        {!minimized && (
          <div className="px-4 py-3 space-y-2.5">
            {items.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={13} className="text-[#5CE0D2] shrink-0" />
                <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
                  <span className="text-[11px] text-white/55 shrink-0">{label}</span>
                  <span className="text-sm font-bold text-white truncate text-right">{value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
