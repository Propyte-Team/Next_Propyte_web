import { useTranslations, useLocale } from 'next-intl';
import { Smartphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AppDownloadBanner() {
  const t = useTranslations('appBanner');
  const locale = useLocale();

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="relative bg-gradient-to-br from-[#1A2F3F] to-[#0D2740] rounded-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5CE0D2]/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#5CE0D2]/5 rounded-full translate-y-1/3 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('title')}
              </h2>
              <p className="text-white/70 mb-6 max-w-lg">
                {t('subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href={`/${locale}/propiedades`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-lg transition-colors"
                >
                  {t('ctaPrimary')} <ArrowRight size={18} />
                </Link>
                <Link
                  href={`/${locale}/contacto`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-colors"
                >
                  {t('ctaSecondary')}
                </Link>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex-shrink-0">
              <div className="w-48 h-80 md:w-56 md:h-96 bg-white/10 rounded-3xl border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <Smartphone size={48} className="text-white/40 mx-auto mb-3" />
                  <div className="flex items-baseline justify-center">
                    <span className="text-xl font-bold text-white">PROP</span>
                    <span className="text-xl font-bold text-[#5CE0D2]">YTE</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">{t('comingSoon')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
