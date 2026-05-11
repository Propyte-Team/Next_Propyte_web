import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Calculator, BarChart3, TrendingUp, ArrowUpRight, DollarSign, Clock } from 'lucide-react';

export default function AppDownloadBanner() {
  const t = useTranslations('roiSimulator');
  const locale = useLocale();

  const metrics = [
    { value: t('metric1Value'), label: t('metric1Label'), Icon: TrendingUp, color: '#A2F9FF' },
    { value: t('metric2Value'), label: t('metric2Label'), Icon: ArrowUpRight, color: '#22C55E' },
    { value: t('metric3Value'), label: t('metric3Label'), Icon: DollarSign, color: '#81EAF1' },
    { value: t('metric4Value'), label: t('metric4Label'), Icon: Clock, color: '#C7FAFF' },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="relative bg-gradient-to-br from-[#132B2E] to-[#0B1C1E] rounded-2xl overflow-hidden">
          {/* Decorative blobs — brand cyan en dark */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#A2F9FF]/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#A2F9FF]/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center gap-10 p-8 md:p-14">
            {/* Left: text + CTAs */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block text-[#A2F9FF] text-xs font-bold tracking-widest uppercase mb-4">
                {t('eyebrow')}
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-snug">
                {t('title')}
              </h2>
              <p className="text-white/70 mb-8 max-w-lg text-base leading-relaxed">
                {t('subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href={`/${locale}/propiedades#simulador`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-[8px] transition-colors text-sm"
                >
                  <Calculator size={18} strokeWidth={1.75} />
                  {t('ctaPrimary')}
                </Link>
                <Link
                  href={`/${locale}/mercado`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-[8px] border border-white/20 transition-colors text-sm"
                >
                  <BarChart3 size={18} strokeWidth={1.75} />
                  {t('ctaSecondary')}
                </Link>
              </div>
            </div>

            {/* Right: metrics grid */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-3 lg:w-72">
                {metrics.map((m) => {
                  const Icon = m.Icon;
                  return (
                    <div
                      key={m.label}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
                    >
                      <div className="flex justify-center mb-1.5">
                        <Icon size={18} strokeWidth={1.75} style={{ color: m.color }} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: m.color }}>
                        {m.value}
                      </div>
                      <p className="text-white/60 text-xs leading-snug">{m.label}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/65 text-xs text-center mt-3">{t('footnote')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
