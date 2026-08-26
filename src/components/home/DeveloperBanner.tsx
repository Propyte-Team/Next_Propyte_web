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
    <section className="bg-gradient-to-r from-propyte-dark-800 to-propyte-dark-700 py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <span className="inline-block text-propyte-brand text-xs font-bold tracking-widest uppercase mb-4">
          {t('eyebrow')}
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">{titleText}</h2>
        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-8">
          {t('body')}
        </p>
        <Link
          href={href}
          className="inline-flex items-center h-12 px-8 bg-propyte-brand hover:bg-propyte-cyan-300 text-propyte-dark-900 font-semibold rounded-lg transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
