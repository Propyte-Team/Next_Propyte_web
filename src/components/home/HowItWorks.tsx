import { useTranslations } from 'next-intl';
import { Search, BarChart3, CheckCircle } from 'lucide-react';

export default function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    { icon: Search, title: t('step1Title'), desc: t('step1Desc') },
    { icon: BarChart3, title: t('step2Title'), desc: t('step2Desc') },
    { icon: CheckCircle, title: t('step3Title'), desc: t('step3Desc') },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-[#2C2C2C] mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#5CE0D2]/10 rounded-full flex items-center justify-center">
                <step.icon size={28} className="text-[#5CE0D2]" />
              </div>
              <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
