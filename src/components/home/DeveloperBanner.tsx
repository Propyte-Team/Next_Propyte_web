'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export interface DeveloperBannerCta {
  title: string;
  buttonLabel: string | null;
  buttonHref: string | null;
}

export default function DeveloperBanner({ cta }: { cta?: DeveloperBannerCta | null }) {
  const t = useTranslations('developerBanner');
  const locale = useLocale();

  const titleText = cta?.title ?? t('title');
  const ctaLabel = cta?.buttonLabel ?? t('cta');
  const href = cta?.buttonHref ?? `/${locale}/desarrolladores`;

  return (
    <section className="bg-gradient-to-r from-[#132B2E] to-[#1C3A3D] py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">{titleText}</h2>
        <Link
          href={href}
          className="inline-flex items-center h-12 px-8 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-semibold rounded-lg transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
