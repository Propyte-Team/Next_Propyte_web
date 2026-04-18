'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Calendar, Clock, Phone, Shield } from 'lucide-react';
import type { Property } from '@/types/property';
import { formatPrice } from '@/lib/formatters';

interface ContactSidebarProps {
  property: Property;
  smartRentEstimate?: number | null;
}

export default function ContactSidebar({ property, smartRentEstimate }: ContactSidebarProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';

  const messages: Record<string, string> = {
    es: `Hola, me interesa ${property.name} (Ref: ${property.id}). Vi su sitio web.`,
    en: `Hi, I'm interested in ${property.name} (Ref: ${property.id}). I saw your website.`,
  };

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messages[locale] || messages.es)}`;

  return (
    <div className="sticky top-20 space-y-4">
      {/* Main contact card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Price reminder */}
        <div className="text-2xl font-bold text-[#2C2C2C] mb-1">{formatPrice(property.price.mxn)}</div>
        {(smartRentEstimate || property.roi.rentalMonthly) > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {locale === 'es' ? 'Renta estimada' : 'Est. rent'}: {formatPrice(smartRentEstimate || property.roi.rentalMonthly)}/mes
          </p>
        )}

        {/* Agent avatar + info */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1A2F3F] to-[#5CE0D2] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <div>
            <p className="font-bold text-[#2C2C2C]">{t('contactAdvisor')}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Shield size={10} className="text-[#22C55E]" />
              <span>{locale === 'es' ? 'Asesor verificado' : 'Verified advisor'}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold rounded-lg transition-colors mb-3 shadow-sm"
        >
          <MessageCircle size={20} />
          {t('whatsappContact')}
        </a>

        {/* Schedule visit */}
        <button className="flex items-center justify-center gap-2 w-full h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-lg transition-colors mb-3 shadow-sm">
          <Calendar size={20} />
          {t('scheduleVisit')}
        </button>

        {/* Call */}
        <a
          href={`tel:+${phone}`}
          className="flex items-center justify-center gap-2 w-full h-12 border-2 border-gray-200 hover:border-gray-300 text-[#2C2C2C] font-semibold rounded-lg transition-colors"
        >
          <Phone size={18} />
          {locale === 'es' ? 'Llamar ahora' : 'Call now'}
        </a>

        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-4">
          <Clock size={12} />
          {t('responseTime')}
        </div>
      </div>

      {/* Financing quick info */}
      <div className="bg-[#F4F6F8] rounded-xl p-5">
        <h4 className="font-bold text-sm text-[#2C2C2C] mb-3">
          {locale === 'es' ? 'Financiamiento' : 'Financing'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{locale === 'es' ? 'Enganche desde' : 'Down payment from'}</span>
            <span className="font-semibold">{property.financing.downPaymentMin}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{locale === 'es' ? 'Plazo hasta' : 'Term up to'}</span>
            <span className="font-semibold">{Math.max(...property.financing.months)} {locale === 'es' ? 'meses' : 'months'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{locale === 'es' ? 'Tasa de interés' : 'Interest rate'}</span>
            <span className="font-semibold">{property.financing.interestRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
