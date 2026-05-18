import { ReactNode } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FileText, AlertCircle, Mail } from 'lucide-react';
import { PRIVACY_EMAIL } from '@/lib/legal/contacts';

interface LegalPageProps {
  locale: string;
  titleKey: 'privacyTitle' | 'termsTitle' | 'cookiesTitle';
  descriptionKey: 'privacyDescription' | 'termsDescription' | 'cookiesDescription';
  lastUpdated: string;
  children: ReactNode;
}

export default async function LegalPage({
  locale,
  titleKey,
  descriptionKey,
  lastUpdated,
  children,
}: LegalPageProps) {
  const t = await getTranslations({ locale, namespace: 'legal' });

  return (
    <article className="bg-white">
      {/* Hero */}
      <header className="border-b border-gray-100 bg-[#F4F6F8]">
        <div className="max-w-[840px] mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="w-12 h-12 rounded-full bg-[#5CE0D2]/10 flex items-center justify-center mb-5">
            <FileText size={20} strokeWidth={1.75} className="text-[#0E7490]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-3">{t(titleKey)}</h1>
          <p className="text-base md:text-lg text-[#2C2C2C]/70 leading-relaxed mb-5 max-w-2xl">
            {t(descriptionKey)}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              <AlertCircle size={12} strokeWidth={2.5} />
              {t('draftBadge')}
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 text-[#2C2C2C]/70 rounded-full text-xs font-medium">
              {t('lastUpdatedLabel')}: {lastUpdated}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-[840px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="legal-prose">{children}</div>

        {/* ARCO / contact footer */}
        <footer className="mt-16 pt-10 border-t border-gray-100">
          <div className="bg-[#F4F6F8] rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-[#1A2F3F] mb-2">{t('contactBlockTitle')}</h2>
            <p className="text-sm text-[#2C2C2C]/75 mb-5 leading-relaxed">{t('contactBlockBody')}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${PRIVACY_EMAIL}`}
                className="inline-flex items-center gap-2 h-10 px-5 bg-[#1A2F3F] hover:bg-[#0F1923] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Mail size={14} strokeWidth={2} />
                {PRIVACY_EMAIL}
              </a>
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center h-10 px-5 border border-gray-200 text-[#1A2F3F] hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
              >
                {t('contactGeneric')}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
