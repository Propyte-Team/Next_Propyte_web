import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Calculator, BarChart3 } from 'lucide-react';

export default function AppDownloadBanner() {
  const t = useTranslations('roiSimulator');
  const locale = useLocale();

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="relative bg-gradient-to-br from-[#132B2E] to-[#0B1C1E] rounded-2xl overflow-hidden">
          {/* Decorative blobs — brand cyan en dark */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#A2F9FF]/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#A2F9FF]/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative flex flex-col items-center text-center gap-6 p-8 md:p-14">
            <span className="inline-block text-[#A2F9FF] text-xs font-bold tracking-widest uppercase">
              {t('eyebrow')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug max-w-2xl">
              {t('title')}
            </h2>
            <p className="text-white/70 max-w-2xl text-base leading-relaxed">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
            {/* Disclaimer YMYL canónico Manual §6.3.2 — link a /aviso-legal-inversion pendiente B4 */}
            <p className="text-white/55 text-xs max-w-2xl leading-relaxed mt-2">
              {t('footnote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
