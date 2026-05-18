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
      // Audit 2026-05-18 (Luis): bg blanco sólido en flujo normal. NO sticky,
      // NO debe acompañar al scroll — se queda en su posición natural (debajo
      // del hero) y scrollea fuera con el contenido. Underline activo en
      // cyan-700 (#0E7490) canon para fondos claros.
      className="bg-white border-b border-gray-200"
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
                    ? 'text-[#0E7490] border-[#0E7490]'
                    : 'text-[var(--propyte-dark-600)] border-transparent hover:text-[#0E7490] hover:border-[#0E7490]/50'
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
