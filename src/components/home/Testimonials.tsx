'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

interface TestimonialItem {
  name: string;
  city: string;
  rating: number;
  text: string;
}

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const testimonials = t.raw('items') as TestimonialItem[];
  const [startIndex, setStartIndex] = useState(0);

  const visibleCount = 3;
  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount < testimonials.length;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F]">{t('title')}</h2>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => canPrev && setStartIndex(startIndex - 1)}
              disabled={!canPrev}
              aria-label={t('prev')}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#5CE0D2] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => canNext && setStartIndex(startIndex + 1)}
              disabled={!canNext}
              aria-label={t('next')}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#5CE0D2] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(startIndex, startIndex + visibleCount).map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} size={16} className="fill-[#F5A623] text-[#F5A623]" />
                ))}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">
                &ldquo;{item.text}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.city}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#22C55E]">
                  <ShieldCheck size={12} strokeWidth={2} />
                  {t('verified')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile dots: active = cualquier index dentro del rango visible */}
        <div className="md:hidden mt-4 flex justify-center gap-2">
          {testimonials.map((_, i) => {
            const active = i >= startIndex && i < startIndex + visibleCount;
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setStartIndex(Math.min(i, Math.max(0, testimonials.length - visibleCount)))
                }
                aria-label={`${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  active ? 'bg-[#5CE0D2]' : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
