'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Info } from 'lucide-react';
import type { TabId } from '@/lib/rental-data/types';

interface MethodologySectionProps {
  activeTab: TabId;
  locale: string;
}

export function MethodologySection({ activeTab }: MethodologySectionProps) {
  const [open, setOpen] = useState(false);
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

        {/* Expandable detail */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#5CE0D2] hover:text-[#0D9488] transition-colors ml-7"
        >
          {t('seeFull')}
          <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>

        {open && (
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
                <p className="text-xs text-gray-400">
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
                <p className="text-xs text-gray-400 mt-3">
                  {t('ltrFooter')}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
