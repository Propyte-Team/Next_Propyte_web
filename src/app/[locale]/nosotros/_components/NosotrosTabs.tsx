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
      // Audit 2026-05-15 (D4.2): barra secundaria con strip glass para que no
      // se vea "incrustada" sobre el contenido al hacer scroll. Shadow sutil
      // marca la elevación y separa visualmente del bloque inferior.
      className="propyte-strip-glass sticky top-[108px] lg:top-20 z-30"
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
                    ? 'text-[var(--propyte-dark-900)] border-propyte-brand'
                    : 'text-[var(--propyte-dark-600)] border-transparent hover:text-[var(--propyte-dark-900)] hover:border-propyte-brand'
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
