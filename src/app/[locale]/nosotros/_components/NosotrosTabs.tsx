import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type TabId = 'quienes-somos' | 'estructura' | 'equipo-comercial';

const TAB_ORDER: { id: TabId; key: 'tab1' | 'tab2' | 'tab3' }[] = [
  { id: 'quienes-somos', key: 'tab1' },
  { id: 'estructura', key: 'tab2' },
  { id: 'equipo-comercial', key: 'tab3' },
];

export default async function NosotrosTabs({
  locale,
  active,
}: {
  locale: string;
  active: TabId;
}) {
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <nav
      aria-label={t('label')}
      className="bg-white border-b border-gray-200 sticky top-0 z-20"
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          {TAB_ORDER.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Link
                key={tab.id}
                href={`/${locale}/nosotros/${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#0D9488] border-[#5CE0D2]'
                    : 'text-gray-500 border-transparent hover:text-[#0D9488] hover:border-[#5CE0D2]'
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
