import { useTranslations } from 'next-intl';
import { ImageIcon } from 'lucide-react';

export default function ProcessInfographic() {
  const t = useTranslations('processInfographic');

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="inline-block text-[#0F766E] text-xs font-bold tracking-widest uppercase mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A2F3F] leading-snug">
            {t('title')}
          </h2>
        </div>

        <div
          className="relative w-full rounded-2xl border-2 border-dashed border-[#A2F9FF]/40 bg-gradient-to-br from-[#F4F6F8] to-white flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 min-h-[420px]"
          role="img"
          aria-label={t('placeholderText')}
        >
          <div className="w-16 h-16 mb-6 rounded-2xl bg-[#A2F9FF]/20 flex items-center justify-center">
            <ImageIcon size={28} strokeWidth={1.5} className="text-[#0D9488]" />
          </div>
          <span className="text-[#0F766E] text-xs font-bold tracking-widest uppercase mb-3">
            {t('placeholderHint')}
          </span>
          <p className="text-base md:text-lg text-gray-700 max-w-xl leading-relaxed">
            {t('placeholderText')}
          </p>
        </div>
      </div>
    </section>
  );
}
