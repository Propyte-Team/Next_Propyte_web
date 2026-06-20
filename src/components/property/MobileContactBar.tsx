'use client';

import { MessageCircle } from '@/lib/icons';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';
import { useSiteContact } from '@/context/SiteConfigContext';

interface MobileContactBarProps {
  price: number;
  propertyName: string;
  propertyUrl: string;
  contactTargetId?: string;
  locale: string;
  /** Optional ROI badge to show next to price */
  roiPct?: number;
}

/**
 * Fixed floating bar shown below md breakpoint on detail pages.
 * Price left + WhatsApp CTA (decisión 2026-05-22: simplificar a un solo
 * CTA — el botón "Contactar" se eliminó porque WhatsApp es el canal
 * directo y reduce fricción mobile). Parent debe agregar pb-20 md:pb-0.
 */
export default function MobileContactBar({
  price, propertyName, propertyUrl, roiPct,
}: MobileContactBarProps) {
  const tProp = useTranslations('property');
  const { whatsapp: phone } = useSiteContact();

  const msg = `${tProp('whatsappInterestText', { name: propertyName })} ${propertyUrl}`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-none min-w-0">
          <div className="text-2xs text-gray-600 uppercase tracking-wider">
            {tProp('startingFrom')}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-[#2C2C2C] leading-none">
              {price > 0 ? formatPrice(price) : '—'}
            </span>
            {roiPct != null && roiPct > 0 && (
              <span className="text-2xs font-bold px-1.5 py-0.5 bg-[#5CE0D2]/10 text-[#0E7490] rounded-full whitespace-nowrap">
                ROI {roiPct}%
              </span>
            )}
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] propyte-cta-whatsapp font-bold rounded-xl transition-colors text-sm"
          aria-label={tProp('whatsappContact')}
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
