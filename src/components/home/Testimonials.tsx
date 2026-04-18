'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Star, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const testimonialsEs = [
  { name: 'Carlos M.', city: 'CDMX', rating: 5, text: 'El simulador financiero me ayudó a comparar opciones de inversión que no había considerado. Compré en preventa en Tulum y ya tengo un 25% de plusvalía.' },
  { name: 'Patricia R.', city: 'Monterrey', rating: 5, text: 'Como extranjera, el proceso parecía complicado. El equipo de Propyte me explicó todo sobre el fideicomiso y me acompañó en cada paso. Excelente servicio.' },
  { name: 'Roberto L.', city: 'Guadalajara', rating: 5, text: 'Los datos de mercado son increíbles. Pude comparar rendimientos por zona antes de decidir. Mi departamento en Playa ya está generando ingresos en Airbnb.' },
  { name: 'Ana G.', city: 'Miami, FL', rating: 5, text: 'La búsqueda con IA es genial. Escribí exactamente lo que buscaba y me mostró opciones que no había encontrado en otros portales.' },
  { name: 'Fernando T.', city: 'Querétaro', rating: 5, text: 'Invertí en dos departamentos gracias al análisis de Cap Rate que ofrece la plataforma. Los datos de AirDNA me dieron confianza para tomar la decisión.' },
  { name: 'Laura S.', city: 'Cancún', rating: 5, text: 'Ya tenía experiencia comprando propiedades, pero Propyte me abrió los ojos con el análisis de zonas. Encontré oportunidades que no conocía.' },
];

const testimonialsEn = [
  { name: 'Carlos M.', city: 'Mexico City', rating: 5, text: 'The financial simulator helped me compare investment options I hadn\'t considered. I bought pre-sale in Tulum and already have 25% appreciation.' },
  { name: 'Patricia R.', city: 'Monterrey', rating: 5, text: 'As a foreigner, the process seemed complicated. The Propyte team explained everything about the fideicomiso and accompanied me every step. Excellent service.' },
  { name: 'Roberto L.', city: 'Guadalajara', rating: 5, text: 'The market data is incredible. I could compare yields by zone before deciding. My apartment in Playa is already generating Airbnb income.' },
  { name: 'Ana G.', city: 'Miami, FL', rating: 5, text: 'The AI search is amazing. I typed exactly what I was looking for and it showed me options I hadn\'t found on other portals.' },
  { name: 'Fernando T.', city: 'Querétaro', rating: 5, text: 'I invested in two apartments thanks to the Cap Rate analysis the platform offers. AirDNA data gave me confidence to make the decision.' },
  { name: 'Laura S.', city: 'Cancún', rating: 5, text: 'I already had experience buying properties, but Propyte opened my eyes with zone analysis. I found opportunities I didn\'t know existed.' },
];

export default function Testimonials() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const testimonials = isEn ? testimonialsEn : testimonialsEs;
  const [startIndex, setStartIndex] = useState(0);

  const visibleCount = 3;
  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount < testimonials.length;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F]">
              {isEn ? 'What Our Clients Say' : 'Lo que Dicen Nuestros Clientes'}
            </h2>
            <p className="text-gray-500 mt-1">
              {isEn ? 'Real experiences from real investors' : 'Experiencias reales de inversionistas reales'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => canPrev && setStartIndex(startIndex - 1)}
              disabled={!canPrev}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#5CE0D2] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => canNext && setStartIndex(startIndex + 1)}
              disabled={!canNext}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#5CE0D2] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(startIndex, startIndex + visibleCount).map((t, i) => (
            <div key={`${t.name}-${i}`} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="fill-[#F5A623] text-[#F5A623]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.city}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#22C55E]">
                  <ShieldCheck size={12} />
                  {isEn ? 'Verified' : 'Verificado'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: show all stacked */}
        <div className="md:hidden mt-4 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setStartIndex(Math.min(i, testimonials.length - 1))}
              className={`w-2 h-2 rounded-full transition-colors ${
                i >= startIndex && i < startIndex + 1 ? 'bg-[#5CE0D2]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
