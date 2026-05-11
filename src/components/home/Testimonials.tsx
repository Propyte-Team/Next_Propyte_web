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

// Si `items` se pasa como prop (desde el server fetch de Hub), úsalo.
// Si no, cae al listado hardcoded en i18n (`testimonials.items`).
export default function Testimonials({ items }: { items?: TestimonialItem[] }) {
  const t = useTranslations('testimonials');
  const fromI18n = t.raw('items') as TestimonialItem[];
  const testimonials = items && items.length > 0 ? items : fromI18n;
  const [startIndex, setStartIndex] = useState(0);

  const visibleCount = 3;
  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount < testimonials.length;

  return (
    <section className="relative py-16 md:py-20 bg-[#132B2E] overflow-hidden">
      {/* Glow brand sutil — radial superior derecha + suave bottom-left teal. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 90% 10%, rgba(162, 249, 255, 0.10), transparent 60%), radial-gradient(ellipse 40% 35% at 10% 90%, rgba(92, 224, 210, 0.06), transparent 65%)',
        }}
      />
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{t('title')}</h2>
            <p className="text-white/70 mt-1">{t('subtitle')}</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => canPrev && setStartIndex(startIndex - 1)}
              disabled={!canPrev}
              aria-label={t('prev')}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white hover:border-[#A2F9FF] hover:text-[#A2F9FF] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => canNext && setStartIndex(startIndex + 1)}
              disabled={!canNext}
              aria-label={t('next')}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white hover:border-[#A2F9FF] hover:text-[#A2F9FF] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(startIndex, startIndex + visibleCount).map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              // Ficha 02 oficial: glass premium con border 1px white/30, shadow
              // stack inset + drop, blur 52px. Padding 28px (vs 24px).
              className="propyte-card-glass-lg p-7 transition-transform hover:-translate-y-1"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} size={16} className="fill-[#A2F9FF] text-[#A2F9FF]" />
                ))}
              </div>

              <p className="text-sm md:text-base text-white/90 leading-relaxed mb-4 italic">
                &ldquo;{item.text}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/15">
                <div>
                  <div className="font-bold text-white text-sm">{item.name}</div>
                  <div className="text-xs text-white/60">{item.city}</div>
                </div>
                <div className="flex items-center gap-1 text-2xs font-semibold text-[#A2F9FF]">
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
                className="relative flex items-center justify-center w-11 h-11 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A2F9FF]"
              >
                <span
                  aria-hidden="true"
                  className={`block w-2 h-2 rounded-full transition-colors ${
                    active ? 'bg-[#A2F9FF]' : 'bg-white/25'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
