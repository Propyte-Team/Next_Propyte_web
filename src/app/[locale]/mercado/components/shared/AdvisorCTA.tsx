'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TabId } from '@/lib/rental-data/types';

interface AdvisorCTAProps {
  activeTab: TabId;
  locale: string;
}

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354';

export function AdvisorCTA({ activeTab, locale }: AdvisorCTAProps) {
  const isEn = locale === 'en';
  const tMer = useTranslations('mercado');

  const waMessage = activeTab === 'vacacional'
    ? isEn
      ? 'Hi, I was looking at the vacation rental market data on Propyte and I would like advice on the best short-term rental investment opportunities.'
      : 'Hola, estuve revisando los datos del mercado de rentas vacacionales en Propyte y me gustaría asesoría sobre las mejores oportunidades de inversión en renta corto plazo.'
    : isEn
      ? 'Hi, I was looking at the traditional rental market data on Propyte and I would like advice on the best long-term rental investment opportunities.'
      : 'Hola, estuve revisando los datos del mercado de rentas tradicionales en Propyte y me gustaría asesoría sobre las mejores oportunidades de inversión en renta largo plazo.';

  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-propyte-cyan-100 border-2 border-propyte-brand rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-lg font-bold text-[#1A2F3F] mb-1">
            {isEn
              ? 'Need help interpreting the data?'
              : '¿Necesitas ayuda interpretando los datos?'}
          </h3>
          <p className="text-sm text-gray-600">
            {activeTab === 'vacacional'
              ? isEn
                ? 'Our Propyte advisors can help you find the best vacation rental investment based on occupancy, rates, and projected returns.'
                : 'Los asesores Propyte te ayudan a encontrar la mejor inversión en renta vacacional basándose en ocupación, tarifas y rendimientos proyectados.'
              : isEn
                ? 'Our Propyte advisors can help you compare rental yields, cap rates, and cash flow projections for any development.'
                : 'Los asesores Propyte te ayudan a comparar yields de renta, cap rates y proyecciones de flujo para cualquier desarrollo.'}
          </p>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#22BF5B] text-[#0F1923] font-semibold rounded-xl transition-colors shadow-lg shadow-[#25D366]/20 whitespace-nowrap"
        >
          <MessageCircle size={18} />
          {tMer('talkToAdvisor')}
        </a>
      </div>
    </section>
  );
}
