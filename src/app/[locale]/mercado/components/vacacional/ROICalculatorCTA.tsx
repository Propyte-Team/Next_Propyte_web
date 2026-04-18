'use client';

import { Calculator } from 'lucide-react';

interface ROICalculatorCTAProps {
  locale: string;
}

export function ROICalculatorCTA({ locale }: ROICalculatorCTAProps) {
  const isEn = locale === 'en';

  return (
    <div className="bg-[#1A2F3F] rounded-2xl px-6 py-10 sm:px-10 sm:py-12 text-center">
      <Calculator className="w-10 h-10 text-[#5CE0D2] mx-auto mb-4" />

      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        {isEn
          ? 'Calculate your vacation rental ROI'
          : 'Calcula el ROI de tu renta vacacional'}
      </h2>

      <p className="text-gray-300 max-w-xl mx-auto mb-6 text-sm sm:text-base">
        {isEn
          ? 'Enter your property price, expected occupancy and nightly rate to estimate your annual return. Our calculator uses real market data from +2M records.'
          : 'Ingresa el precio de tu propiedad, ocupación esperada y tarifa por noche para estimar tu retorno anual. Nuestra calculadora usa datos reales de +2M registros.'}
      </p>

      <a
        href={`/${locale}/contacto`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#5CE0D2] text-[#1A2F3F] font-semibold rounded-lg hover:bg-[#4BCEC0] transition-colors text-sm sm:text-base"
      >
        <Calculator className="w-4 h-4" />
        {isEn ? 'Open free calculator' : 'Abrir calculadora gratuita'}
      </a>
    </div>
  );
}
