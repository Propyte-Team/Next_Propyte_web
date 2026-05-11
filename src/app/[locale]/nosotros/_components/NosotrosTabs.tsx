import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { isVisible, VISIBILITY_KEYS, type VisibilityMap } from '@/lib/visibility';

type TabId = 'quienes-somos' | 'estructura' | 'equipo-comercial';

const TAB_ORDER: { id: TabId; key: 'tab1' | 'tab2' | 'tab3'; visKey: string }[] = [
  { id: 'quienes-somos', key: 'tab1', visKey: VISIBILITY_KEYS.NOSOTROS_QUIENES_SOMOS },
  { id: 'estructura', key: 'tab2', visKey: VISIBILITY_KEYS.NOSOTROS_ESTRUCTURA },
  { id: 'equipo-comercial', key: 'tab3', visKey: VISIBILITY_KEYS.NOSOTROS_EQUIPO_COMERCIAL },
];

export default async function NosotrosTabs({
  locale,
  active,
  visibility,
}: {
  locale: string;
  active: TabId;
  visibility: VisibilityMap;
}) {
  const t = await getTranslations({ locale, namespace: 'about' });
  const tabs = TAB_ORDER.filter((tab) => isVisible(visibility, tab.visKey));

  return (
    <nav
      aria-label={t('label')}
      className="bg-white border-b border-gray-200 sticky top-[108px] lg:top-20 z-30"
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Link
                key={tab.id}
                href={`/${locale}/nosotros/${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#0F766E] border-propyte-brand'
                    : 'text-gray-600 border-transparent hover:text-[#0F766E] hover:border-propyte-brand'
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
