'use client';

import { Calculator } from '@/lib/icons';
import { useTranslations } from 'next-intl';

interface ROICalculatorCTAProps {
  locale: string;
}

export function ROICalculatorCTA({ locale }: ROICalculatorCTAProps) {
  const isEn = locale === 'en';
  const tMer = useTranslations('mercado');

  return (
    <div className="bg-[#1A2F3F] rounded-2xl px-6 py-10 sm:px-10 sm:py-12 text-center">
      <Calculator className="w-10 h-10 text-propyte-brand mx-auto mb-4" />

      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        {isEn
          ? 'Simulate financing for your next investment'
          : 'Simula el financiamiento de tu próxima inversión'}
      </h2>

      <p className="text-gray-300 max-w-xl mx-auto mb-6 text-sm sm:text-base">
        {isEn
          ? 'Enter the property price, down payment and term to estimate your monthly payment and compare bank financing options before you buy.'
          : 'Ingresa el precio de la propiedad, tu enganche y plazo para estimar tu pago mensual y comparar opciones de financiamiento bancario antes de comprar.'}
      </p>

      <a
        href={`/${locale}/financiamiento`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-propyte-brand text-[#1A2F3F] font-semibold rounded-lg hover:bg-propyte-cyan-200 transition-colors text-sm sm:text-base"
      >
        <Calculator className="w-4 h-4" />
        {tMer('openFinancingCalculator')}
      </a>
    </div>
  );
}
