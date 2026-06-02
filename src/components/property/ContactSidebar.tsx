'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, MessageCircle, Calendar, Clock, Phone } from '@/lib/icons';
import type { Property } from '@/types/property';
import { formatPrice } from '@/lib/formatters';
import ContactForm from './ContactForm';

interface ContactSidebarProps {
  property: Property;
  smartRentEstimate?: number | null;
}

export default function ContactSidebar({ property, smartRentEstimate }: ContactSidebarProps) {
  const t = useTranslations('property');
  const [formOpen, setFormOpen] = useState(false);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354';

  const msg = t('whatsappMessageWithSource', { name: property.name, id: property.id });
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  const rentDisplay = smartRentEstimate || property.roi.rentalMonthly;

  return (
    <div className="sticky top-24 space-y-4">
      {/* Main contact card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Price reminder */}
        <div className="text-2xl font-bold text-[#2C2C2C] mb-1">{formatPrice(property.price.mxn)}</div>
        {rentDisplay > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            {t('estRent')}: {formatPrice(rentDisplay)}/mes
          </p>
        )}

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 propyte-cta-whatsapp font-bold rounded-lg transition-colors mb-3 shadow-sm"
        >
          <MessageCircle size={20} />
          {t('whatsappContact')}
        </a>

        {/* Request info — toggles ContactForm */}
        <button
          onClick={() => setFormOpen((v) => !v)}
          aria-expanded={formOpen}
          className="flex items-center justify-center gap-2 w-full h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-lg transition-colors mb-3 shadow-sm"
        >
          <Calendar size={20} />
          {t('scheduleVisit')}
          <ChevronDown size={16} className={`transition-transform ${formOpen ? 'rotate-180' : ''}`} />
        </button>

        {formOpen && (
          <div className="mt-2 mb-3 pt-3 border-t border-gray-100">
            <ContactForm propertyId={property.id} propertyName={property.name} />
          </div>
        )}

        {/* Call */}
        <a
          href={`tel:+${phone}`}
          className="flex items-center justify-center gap-2 w-full h-12 border-2 border-gray-200 hover:border-gray-300 text-[#2C2C2C] font-semibold rounded-lg transition-colors"
        >
          <Phone size={18} />
          {t('callNow')}
        </a>

        <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mt-4">
          <Clock size={12} />
          {t('responseTime')}
        </div>
      </div>

      {/* Financing quick info */}
      <div className="bg-[#F4F6F8] rounded-xl p-5">
        <h4 className="font-bold text-sm text-[#2C2C2C] mb-3">{t('financing')}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('downPaymentFrom')}</span>
            <span className="font-semibold">{property.financing.downPaymentMin}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('termUpTo')}</span>
            <span className="font-semibold">
              {Math.max(...property.financing.months)} {t('monthsSuffix')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('interestRate')}</span>
            <span className="font-semibold">{property.financing.interestRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
