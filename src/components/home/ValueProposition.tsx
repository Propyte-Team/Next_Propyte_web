import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { TrendingUp, Building2, Users } from 'lucide-react';

export default function ValueProposition() {
  const t = useTranslations('valueProp');
  const locale = useLocale();

  const cards = [
    {
      icon: TrendingUp,
      title: t('investorsTitle'),
      desc: t('investorsDesc'),
      cta: t('investorsCta'),
      href: `/${locale}/propiedades`,
    },
    {
      icon: Building2,
      title: t('developersTitle'),
      desc: t('developersDesc'),
      cta: t('developersCta'),
      href: `/${locale}/desarrolladores`,
    },
    {
      icon: Users,
      title: t('advisorsTitle'),
      desc: t('advisorsDesc'),
      cta: t('advisorsCta'),
      href: '#',
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, i) => (
            <div key={i} className="p-6 md:p-8 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mb-4 bg-[#1A2F3F]/10 rounded-lg flex items-center justify-center">
                <card.icon size={24} className="text-[#1A2F3F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4">{card.desc}</p>
              <Link href={card.href} className="text-[#5CE0D2] font-medium hover:underline">
                {card.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
