'use client';
import { useTranslations } from 'next-intl';

export interface DataSourceRow { label: string; value: string; source: string; period?: string; }

export default function DataSourceTable({ rows, footnote }: { rows: DataSourceRow[]; footnote?: string }) {
  const t = useTranslations('simulator');
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 text-2xs font-semibold uppercase tracking-wider text-gray-600">{t('dataSourceTitle')}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-3 py-1.5 font-medium">{t('dsData')}</th>
              <th className="px-3 py-1.5 font-medium">{t('dsValue')}</th>
              <th className="px-3 py-1.5 font-medium">{t('dsSource')}</th>
              <th className="px-3 py-1.5 font-medium">{t('dsPeriod')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-1.5 text-gray-700">{r.label}</td>
                <td className="px-3 py-1.5 font-semibold text-[#1A2F3F]">{r.value}</td>
                <td className="px-3 py-1.5 text-gray-600">{r.source}</td>
                <td className="px-3 py-1.5 text-gray-500">{r.period ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <div className="px-3 py-1.5 text-2xs text-gray-500 border-t border-gray-100">{footnote}</div>}
    </div>
  );
}
