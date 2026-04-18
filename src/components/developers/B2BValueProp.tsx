import { useTranslations } from 'next-intl';
import { Users, Target, BarChart3, TrendingUp } from 'lucide-react';

export default function B2BValueProp() {
  const t = useTranslations('developers');

  const values = [
    { icon: Users, title: t('value1Title'), desc: t('value1Desc') },
    { icon: Target, title: t('value2Title'), desc: t('value2Desc') },
    { icon: BarChart3, title: t('value3Title'), desc: t('value3Desc') },
    { icon: TrendingUp, title: t('value4Title'), desc: t('value4Desc') },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {values.map((val, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mb-4 bg-[#5CE0D2]/10 rounded-lg flex items-center justify-center">
                <val.icon size={24} className="text-[#5CE0D2]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{val.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
