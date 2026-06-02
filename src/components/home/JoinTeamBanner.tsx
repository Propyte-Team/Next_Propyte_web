'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export interface JoinTeamBannerCta {
  title: string;
  buttonLabel: string | null;
  buttonHref: string | null;
}

export default function JoinTeamBanner({ cta }: { cta?: JoinTeamBannerCta | null }) {
  const t = useTranslations('joinTeam');
  const locale = useLocale();

  const titleText = cta?.title ?? t('title');
  const ctaLabel = cta?.buttonLabel ?? t('cta');
  const href = cta?.buttonHref ?? `/${locale}/unete`;

  return (
    <section className="relative bg-[#0B1C1E] py-16 md:py-20 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(162, 249, 255, 0.10), transparent 65%)',
        }}
      />
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">{titleText}</h2>
        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-8">
          {t('subtitle')}
        </p>
        <Link
          href={href}
          className="inline-flex items-center h-12 px-8 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-semibold rounded-[8px] transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
