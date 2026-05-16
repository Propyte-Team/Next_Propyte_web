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
    <section className="py-16 md:py-20 bg-[var(--color-gray-light)]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-[var(--propyte-dark-900)] mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => {
            const num = String(i + 1).padStart(2, '0');
            return (
              <div key={i} className="text-center">
                <span className="propyte-step-number block text-sm text-[var(--propyte-dark-600)] mb-3">{num}</span>
                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--propyte-cyan-50)] rounded-full flex items-center justify-center border border-[var(--propyte-cyan-100)]/40">
                  <step.icon size={28} className="propyte-amenity-icon" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--propyte-dark-900)] mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
