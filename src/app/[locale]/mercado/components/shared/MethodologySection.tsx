'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight, Info } from '@/lib/icons';
import type { TabId } from '@/lib/rental-data/types';

interface MethodologySectionProps {
  activeTab: TabId;
  locale: string;
}

export function MethodologySection({ activeTab }: MethodologySectionProps) {
  const t = useTranslations('methodology');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-[#F4F6F8] rounded-xl p-7">
        {/* Summary */}
        <div className="flex items-start gap-3 mb-3">
          <Info size={18} className="text-[#1A2F3F] mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[#1A2F3F] mb-1">
              {t('title')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {activeTab === 'vacacional' ? t('summaryStr') : t('summaryLtr')}
            </p>
          </div>
        </div>

        {/* Detalle expandible con <details>, NO con {open && …}: el patrón anterior
            dejaba el contenido FUERA del DOM hasta el primer clic, y la metodología es
            justamente el activo de E-E-A-T que un rastreador tiene que poder leer.
            <details> vive en el HTML cerrado y funciona sin JavaScript. */}
        <details className="group">
          <summary className="inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 text-sm font-medium text-[#0E7490] hover:text-[#134E4A] transition-colors ml-7 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            {t('seeFull')}
            <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
          </summary>

          <div className="mt-4 ml-7 bg-white rounded-lg border border-gray-200 p-5 text-sm text-gray-600 leading-relaxed space-y-3">
            {activeTab === 'vacacional' ? (
              <>
                <p className="font-semibold text-[#1A2F3F]">
                  {t('strFormulaTitle')}
                </p>
                <div className="bg-[#F4F6F8] rounded-lg p-4 font-mono text-xs">
                  Score = (Occupancy × 0.30) + (Rate Growth × 0.25) + (RevPAR × 0.25) + (Competition × 0.20)
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>{t('strFactorOccupancy')}</strong> — {t('strFactorOccupancyDesc')}
                  </li>
                  <li>
                    <strong>{t('strFactorRateGrowth')}</strong> — {t('strFactorRateGrowthDesc')}
                  </li>
                  <li>
                    <strong>RevPAR (25%)</strong> — {t('strFactorRevparDesc')}
                  </li>
                  <li>
                    <strong>{t('strFactorCompetition')}</strong> — {t('strFactorCompetitionDesc')}
                  </li>
                </ul>
                <p className="font-semibold text-[#1A2F3F] pt-2">{t('methodPoolTitle')}</p>
                <p>{t('methodPool')}</p>
                <p className="font-semibold text-[#1A2F3F] pt-2">{t('methodSampleTitle')}</p>
                <p>{t('methodSample')}</p>
                <p>{t('methodMissing')}</p>
                <p className="font-semibold text-[#1A2F3F] pt-2">{t('methodGrossTitle')}</p>
                <p>{t('methodGross')}</p>
                <p className="font-semibold text-[#1A2F3F] pt-2">{t('methodProvenanceTitle')}</p>
                <p>{t('methodProvenance')}</p>
                <p className="text-xs text-gray-600">
                  {t('strFooter')}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[#1A2F3F]">
                  {t('ltrSourcesTitle')}
                </p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>{t('ltrSource1')}</li>
                  <li>{t('ltrSource2')}</li>
                  <li>{t('ltrSource3')}</li>
                  <li>{t('ltrSource4')}</li>
                  <li>{t('ltrSource5')}</li>
                  <li>{t('ltrSource6')}</li>
                  <li>{t('ltrSource7')}</li>
                </ul>
                <p className="font-semibold text-[#1A2F3F] mt-4">
                  {t('ltrPipelineTitle')}
                </p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>{t('ltrStep1')}</li>
                  <li>{t('ltrStep2')}</li>
                  <li>{t('ltrStep3')}</li>
                  <li>{t('ltrStep4')}</li>
                  <li>{t('ltrStep5')}</li>
                  <li>{t('ltrStep6')}</li>
                </ol>
                <p className="text-xs text-gray-600 mt-3">
                  {t('ltrFooter')}
                </p>
              </>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
