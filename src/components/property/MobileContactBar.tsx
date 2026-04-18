'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Calendar, Phone } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import type { Property } from '@/types/property';

interface MobileContactBarProps {
  property: Property;
}

export default function MobileContactBar({ property }: MobileContactBarProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';

  const msg = locale === 'es'
    ? `Hola, me interesa ${property.name} (Ref: ${property.id}).`
    : `Hi, I'm interested in ${property.name} (Ref: ${property.id}).`;

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 lg:hidden">
      {/* Price strip */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div>
          <div className="text-lg font-bold text-[#2C2C2C]">{formatPrice(property.price.mxn)}</div>
          <div className="text-xs text-gray-500">{property.name}</div>
        </div>
        {property.roi.projected > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 bg-[#5CE0D2]/10 text-[#4BCEC0] rounded-full">
            ROI {property.roi.projected}%
          </span>
        )}
      </div>
      {/* CTA buttons */}
      <div className="flex gap-2 p-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold rounded-lg transition-colors text-sm"
        >
          <MessageCircle size={16} />
          WhatsApp
        </a>
        <button className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-lg transition-colors text-sm">
          <Calendar size={16} />
          {t('scheduleVisit')}
        </button>
        <a
          href={`tel:+${phone}`}
          className="flex items-center justify-center w-11 h-11 bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] rounded-lg transition-colors"
        >
          <Phone size={16} />
        </a>
      </div>
    </div>
  );
}
