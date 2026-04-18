'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface TrustBannerProps {
  logos: Array<{ src: string; alt: string; href?: string }>;
  title?: string;
}

export default function TrustBanner({ logos, title }: TrustBannerProps) {
  const t = useTranslations('trustBanner');
  const displayTitle = title || t('title');

  if (logos.length === 0) {
    return (
      <section className="py-10 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-gray-400">{t('comingSoon')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <p className="text-center text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">
          {displayTitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo) => {
            const img = (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={120}
                height={40}
                className="h-8 w-auto object-contain grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
              />
            );
            return logo.href ? (
              <a key={logo.alt} href={logo.href} target="_blank" rel="noopener noreferrer">
                {img}
              </a>
            ) : (
              <div key={logo.alt}>{img}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
