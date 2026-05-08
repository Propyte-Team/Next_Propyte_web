'use client';

import { useCallback } from 'react';
import { MessageCircle, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';

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
 * Price left + WhatsApp + "Contactar" (scrolls smoothly to contact form).
 * Parent must add pb-20 md:pb-0 to avoid overlap.
 */
export default function MobileContactBar({
  price, propertyName, propertyUrl, contactTargetId = 'contact-form', roiPct,
}: MobileContactBarProps) {
  const tProp = useTranslations('property');
  const tNav = useTranslations('nav');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '';

  const msg = `${tProp('whatsappInterestText', { name: propertyName })} ${propertyUrl}`;
  const whatsappUrl = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  const onContactClick = useCallback(() => {
    const el = document.getElementById(contactTargetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = el.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus({ preventScroll: true }), 500);
      }
    }
  }, [contactTargetId]);

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
              <span className="text-2xs font-bold px-1.5 py-0.5 bg-[#5CE0D2]/10 text-[#0F766E] rounded-full whitespace-nowrap">
                ROI {roiPct}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold rounded-xl transition-colors text-sm"
            aria-label={tProp('whatsappContact')}
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={onContactClick}
            className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-[#0D9488] hover:bg-[#0B7F75] text-white font-bold rounded-xl transition-colors text-sm"
          >
            <ArrowDown size={16} />
            {tNav('contact')}
          </button>
        </div>
      </div>
    </div>
  );
}
