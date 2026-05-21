import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, ScrollText, Calendar, Tag, Hammer, TrendingUp } from '@/lib/icons';

export default function MetodologiaTeaser() {
  const t = useTranslations('metodologiaTeaser');
  const locale = useLocale();

  const criteria = [
    { num: '01', icon: ScrollText, title: t('criterion1Title'), desc: t('criterion1Desc') },
    { num: '02', icon: Calendar, title: t('criterion2Title'), desc: t('criterion2Desc') },
    { num: '03', icon: Tag, title: t('criterion3Title'), desc: t('criterion3Desc') },
    { num: '04', icon: Hammer, title: t('criterion4Title'), desc: t('criterion4Desc') },
    { num: '05', icon: TrendingUp, title: t('criterion5Title'), desc: t('criterion5Desc') },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#0B1C1E] relative overflow-hidden">
      {/* Decorative blob — sutil */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-96 h-96 bg-[#A2F9FF]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="inline-block text-[#A2F9FF] text-xs font-bold tracking-widest uppercase mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug mb-5">
            {t('title')}
          </h2>
          <p className="text-base md:text-lg text-white/70 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {criteria.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.num}
                className="bg-[#132B2E]/80 border border-white/10 rounded-2xl p-6 hover:border-[#A2F9FF]/40 transition-colors backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#A2F9FF]/50 text-xs font-bold tracking-widest">
                    {c.num}
                  </span>
                  <Icon size={20} strokeWidth={1.75} className="text-[#A2F9FF]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">{c.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Link
            href={`/${locale}/metodologia`}
            className="inline-flex items-center gap-2 min-h-[44px] px-7 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors text-sm"
          >
            {t('cta')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
