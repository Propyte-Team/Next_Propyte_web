import { useTranslations } from 'next-intl';
import { Shield, BarChart3, Headphones, Zap, Award, Globe } from 'lucide-react';

export default function WhyPropyte() {
  const t = useTranslations('whyPropyte');

  const features = [
    { icon: BarChart3, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: Shield, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: Zap, title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: Headphones, title: t('feature4Title'), desc: t('feature4Desc') },
    { icon: Award, title: t('feature5Title'), desc: t('feature5Desc') },
    { icon: Globe, title: t('feature6Title'), desc: t('feature6Desc') },
  ];

  return (
    <section className="py-12 md:py-16 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-4">
                <feat.icon size={24} className="text-[#5CE0D2]" />
              </div>
              <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
