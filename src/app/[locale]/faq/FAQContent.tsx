'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export default function FAQContent({
  faqs,
  categories,
  locale,
}: {
  faqs: Array<{ cat: string; q: string; a: string }>;
  categories: string[];
  locale: string;
}) {
  const t = useTranslations('faq');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = activeCategory === categories[0]
    ? faqs
    : faqs.filter((f) => f.cat === activeCategory);

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              aria-pressed={activeCategory === cat}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeCategory === cat
                  ? 'bg-[#5CE0D2] text-[#0F1923]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {filtered.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-[#1A2F3F] pr-4">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 mb-4">{t('ctaStillHave')}</p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
