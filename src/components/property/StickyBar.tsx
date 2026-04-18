'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Calendar, Bed, Bath, Maximize } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import type { Property } from '@/types/property';

interface StickyBarProps {
  property: Property;
}

export default function StickyBar({ property }: StickyBarProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const [visible, setVisible] = useState(false);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 500);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const msg = locale === 'es'
    ? `Hola, me interesa ${property.name} (Ref: ${property.id}).`
    : `Hi, I'm interested in ${property.name} (Ref: ${property.id}).`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm hidden lg:block animate-slide-down">
      <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: price + specs */}
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-[#2C2C2C]">{formatPrice(property.price.mxn)}</span>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {property.specs.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bed size={14} /> {property.specs.bedrooms}
              </span>
            )}
            {property.specs.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath size={14} /> {property.specs.bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize size={14} /> {property.specs.area} m²
            </span>
          </div>
          <span className="text-sm text-gray-400 truncate max-w-[300px]">
            {property.location.zone}, {property.location.city}
          </span>
        </div>

        {/* Right: CTAs */}
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-9 px-4 bg-[#25D366] hover:bg-[#1EBE57] text-white text-sm font-bold rounded-lg transition-colors"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <button className="flex items-center gap-1.5 h-9 px-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white text-sm font-bold rounded-lg transition-colors">
            <Calendar size={14} />
            {t('scheduleVisit')}
          </button>
        </div>
      </div>
    </div>
  );
}
