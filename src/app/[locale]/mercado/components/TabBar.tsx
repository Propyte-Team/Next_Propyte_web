'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Building2 } from 'lucide-react';
import { pickLang } from '@/lib/i18n/pickLang';
import type { TabId } from '@/lib/rental-data/types';

interface TabBarProps {
  activeTab: TabId;
  locale: string;
}

const TABS: { id: TabId; labelEs: string; labelEn: string; icon: typeof Plane }[] = [
  { id: 'vacacional', labelEs: 'Renta vacacional (corto plazo)', labelEn: 'Vacation rental (short-term)', icon: Plane },
  { id: 'tradicional', labelEs: 'Renta tradicional (largo plazo)', labelEn: 'Traditional rental (long-term)', icon: Building2 },
];

export function TabBar({ activeTab, locale }: TabBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/${locale}/mercado?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 justify-center">
          {TABS.map(({ id, labelEs, labelEn, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === id
                  ? 'text-[#1A2F3F] border-[#5CE0D2]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {pickLang(locale, labelEn, labelEs)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
