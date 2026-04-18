import { useTranslations } from 'next-intl';

export default function B2BProcess() {
  const t = useTranslations('developers');

  const steps = [
    { num: '01', title: t('step1'), desc: t('step1Desc') },
    { num: '02', title: t('step2'), desc: t('step2Desc') },
    { num: '03', title: t('step3'), desc: t('step3Desc') },
    { num: '04', title: t('step4'), desc: t('step4Desc') },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-[#2C2C2C] mb-12">{t('processTitle')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center md:text-left">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-[#5CE0D2]/30" />
              )}
              <div className="w-12 h-12 mx-auto md:mx-0 mb-4 bg-[#1A2F3F] text-white rounded-full flex items-center justify-center font-bold text-sm relative z-10">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
