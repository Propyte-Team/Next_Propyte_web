'use client';

import { useState } from 'react';
import PropertyCard from '@/components/ui/PropertyCard';
import type { Property } from '@/types/property';

interface MobileBottomSheetProps {
  properties: Property[];
}

export default function MobileBottomSheet({ properties }: MobileBottomSheetProps) {
  const [state, setState] = useState<'peek' | 'half' | 'full'>('peek');

  const heights = {
    peek: 'h-[120px]',
    half: 'h-[50vh]',
    full: 'h-[85vh]',
  };

  function handleToggle() {
    if (state === 'peek') setState('half');
    else if (state === 'half') setState('full');
    else setState('peek');
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/92 backdrop-blur-md rounded-t-3xl shadow-xl border-t border-[rgba(11,28,30,0.06)] z-20 transition-all duration-300 ${heights[state]}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Expandir o contraer la lista de propiedades"
        className="flex justify-center items-center w-full min-h-[44px] py-3 cursor-pointer"
      >
        <span className="w-10 h-1 bg-propyte-brand/40 rounded-full" />
      </button>
      <div className="overflow-y-auto px-4 pb-4" style={{ height: 'calc(100% - 28px)' }}>
        <div className="space-y-4">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}
