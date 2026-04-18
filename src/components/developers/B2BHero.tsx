import { useTranslations } from 'next-intl';

export default function B2BHero() {
  const t = useTranslations('developers');

  return (
    <section className="bg-gradient-to-br from-[#1A2F3F] to-[#1A3550] text-white py-20 md:py-28">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('heroTitle')}</h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">{t('heroSubtitle')}</p>
      </div>
    </section>
  );
}
