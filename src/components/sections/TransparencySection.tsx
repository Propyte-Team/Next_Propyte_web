import { useTranslations } from 'next-intl';
import { DollarSign, ShieldCheck, FileCheck } from 'lucide-react';

export default function TransparencySection() {
  const t = useTranslations('transparency');

  const columns = [
    {
      icon: DollarSign,
      title: t('col1Title'),
      desc: t('col1Desc'),
    },
    {
      icon: ShieldCheck,
      title: t('col2Title'),
      desc: t('col2Desc'),
    },
    {
      icon: FileCheck,
      title: t('col3Title'),
      desc: t('col3Desc'),
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#1A2F3F]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          {t('title')}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {columns.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-[#5CE0D2]/20 rounded-xl flex items-center justify-center">
                <Icon size={28} className="text-[#5CE0D2]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
