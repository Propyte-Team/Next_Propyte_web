import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FileText, Mail, Clock } from 'lucide-react';

interface LegalPlaceholderProps {
  locale: string;
  titleKey: 'privacyTitle' | 'termsTitle' | 'cookiesTitle';
  descriptionKey: 'privacyDescription' | 'termsDescription' | 'cookiesDescription';
}

export default async function LegalPlaceholder({ locale, titleKey, descriptionKey }: LegalPlaceholderProps) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <section className="min-h-[60vh] py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[720px] mx-auto px-4 md:px-6">
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08),_0_1px_2px_rgba(0,0,0,0.06)] p-8 md:p-12 border border-gray-100">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-[#5CE0D2]/10 flex items-center justify-center mb-6">
            <FileText size={24} strokeWidth={1.75} className="text-[#0D9488]" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-3">
            {t(titleKey)}
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-[#2C2C2C]/70 leading-relaxed mb-6">
            {t(descriptionKey)}
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5A623]/10 text-[#F5A623] rounded-full text-sm font-semibold mb-8">
            <Clock size={14} strokeWidth={2} />
            {t('inReview')}
          </div>

          {/* Body */}
          <div className="prose prose-sm max-w-none text-[#2C2C2C]/80 space-y-4 mb-10">
            <p>{t('reviewBody1')}</p>
            <p>{t('reviewBody2')}</p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-[8px] transition-colors"
            >
              <Mail size={16} strokeWidth={2} />
              {t('contactLegal')}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center h-11 px-6 border border-gray-200 text-[#2C2C2C] hover:bg-gray-50 font-semibold rounded-[8px] transition-colors"
            >
              {tNav('home')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
