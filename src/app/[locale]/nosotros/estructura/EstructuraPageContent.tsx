'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown, ChevronUp,
  Building2, Users, Monitor, DollarSign, Briefcase, Megaphone,
  HelpCircle, type LucideIcon,
} from '@/lib/icons';
import type { OrgNodeRow } from '@/lib/supabase/queries';

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Users, Monitor, DollarSign, Briefcase, Megaphone,
};

function resolveIcon(name: string | null): LucideIcon {
  if (!name) return HelpCircle;
  return ICON_MAP[name] ?? HelpCircle;
}

interface DeptView {
  id: string;
  name: string;
  iconName: string | null;
  isCorporate: boolean;
  directorRoleCode: string | null;
  members: OrgNodeRow[];
}

function buildView(nodes: OrgNodeRow[]) {
  const ceo = nodes.find((n) => n.level === 'ceo') ?? null;
  const directors = nodes
    .filter((n) => n.level === 'director')
    .sort((a, b) => a.sort_order - b.sort_order);

  const directorById = new Map(directors.map((d) => [d.id, d.role_code]));

  const departments = nodes.filter((n) => n.level === 'department');
  const departmentsById = new Map(departments.map((d) => [d.id, d]));

  const members = nodes.filter((n) => n.level === 'member');

  const depts: DeptView[] = departments
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => ({
      id: d.id,
      name: d.name,
      iconName: d.icon_name,
      isCorporate: d.is_corporate,
      directorRoleCode: d.reports_to_id ? directorById.get(d.reports_to_id) ?? null : null,
      members: members
        .filter((m) => m.reports_to_id === d.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));

  // Miembros que no están bajo un departamento conocido — fallback al final
  for (const m of members) {
    if (m.reports_to_id && !departmentsById.has(m.reports_to_id)) {
      // huérfano: lo metemos en el primer departamento que matche por department_name
      const target = depts.find((d) => d.name === m.department_name);
      if (target && !target.members.includes(m)) target.members.push(m);
    }
  }

  return { ceo, directors, depts };
}

interface PageProps {
  nodes: OrgNodeRow[];
  content: Record<string, string>;
  fallback: {
    statsTitle?: string;
    philosophyTitle: string;
    philosophyText: string;
    philosophyHighlight: string;
    statValues: string[];
    statLabels: string[];
  };
}

function OrgCard({ role, title, name, color }: { role: string; title: string; name: string; color: string }) {
  return (
    <div
      className="bg-white rounded-xl shadow-md p-5 text-center min-w-[180px]"
      style={{ borderTopWidth: 4, borderTopColor: color, borderTopStyle: 'solid' }}
    >
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
        {role}
      </span>
      <p className="text-xs text-gray-600 mt-1">{title}</p>
      <p className="font-semibold text-gray-900 mt-1 text-sm">{name}</p>
    </div>
  );
}

function DeptAccordion({ dept }: { dept: DeptView }) {
  const [open, setOpen] = useState(false);
  const Icon = resolveIcon(dept.iconName);
  const t = useTranslations('about');

  return (
    <div className="bg-[#F4F6F8] rounded-xl border border-gray-200 overflow-hidden relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors text-left cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-[#1A2F3F]" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-[#1A2F3F]">
            {dept.name}
            {dept.isCorporate && <span className="ml-2 text-xs font-normal text-gray-600">(Corp.)</span>}
          </h3>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {dept.members.length === 0 && (
            <p className="text-xs text-gray-500 italic py-2">{t('hiring')}</p>
          )}
          {dept.members.map((m) => (
            <div key={m.id} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{m.role}</span>
              {m.is_vacant ? (
                <span className="text-[#0E7490] text-xs font-medium">{t('hiring')}</span>
              ) : (
                <span className="font-medium text-gray-900">
                  {m.name}
                  {m.is_corporate && <span className="ml-1 text-xs text-gray-600">(Corp.)</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function pickStat(content: Record<string, string>, key: string, fallback: string) {
  return content[`stats.${key}`] ?? fallback;
}

function pickPhilosophy(content: Record<string, string>, key: string, fallback: string) {
  return content[`philosophy.${key}`] ?? fallback;
}

export default function EstructuraPageContent({ nodes, content, fallback }: PageProps) {
  const { ceo, directors, depts } = buildView(nodes);

  const stats = [
    { value: pickStat(content, 'stat1_value', fallback.statValues[0] ?? ''), label: pickStat(content, 'stat1_label', fallback.statLabels[0] ?? '') },
    { value: pickStat(content, 'stat2_value', fallback.statValues[1] ?? ''), label: pickStat(content, 'stat2_label', fallback.statLabels[1] ?? '') },
    { value: pickStat(content, 'stat3_value', fallback.statValues[2] ?? ''), label: pickStat(content, 'stat3_label', fallback.statLabels[2] ?? '') },
    { value: pickStat(content, 'stat4_value', fallback.statValues[3] ?? ''), label: pickStat(content, 'stat4_label', fallback.statLabels[3] ?? '') },
  ];

  const philosophyTitle = pickPhilosophy(content, 'title', fallback.philosophyTitle);
  const philosophyText = pickPhilosophy(content, 'text', fallback.philosophyText);
  const philosophyHighlight = pickPhilosophy(content, 'highlight', fallback.philosophyHighlight);

  const directorRoleCodes = directors.map((d) => d.role_code).filter((c): c is string => !!c);

  return (
    <>
      {/* Org Chart */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          {nodes.length === 0 ? (
            <p className="text-center text-gray-500 italic">Cargando organigrama…</p>
          ) : (
            <>
              {/* Desktop: visual org chart */}
              <div className="hidden md:block">
                {ceo && (
                  <div className="flex justify-center mb-8">
                    <OrgCard
                      role={ceo.role_code ?? 'CEO'}
                      title={ceo.role}
                      name={ceo.name}
                      color={ceo.role_color ?? '#1D4ED8'}
                    />
                  </div>
                )}
                {ceo && directors.length > 0 && (
                  <div className="flex justify-center mb-8">
                    <div className="w-px h-8 bg-gray-300" />
                  </div>
                )}
                {directors.length > 0 && (
                  <div className="flex justify-center gap-8 mb-8 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gray-300" />
                    {directors.map((d) => (
                      <div key={d.id} className="relative pt-4">
                        <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-300" />
                        <OrgCard
                          role={d.role_code ?? d.role}
                          title={d.role}
                          name={d.name}
                          color={d.role_color ?? '#1A2F3F'}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                  {directorRoleCodes.map((code) => (
                    <div key={code} className="space-y-3">
                      {depts.filter((d) => d.directorRoleCode === code).map((dept) => (
                        <DeptAccordion key={dept.id} dept={dept} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile: stacked accordion */}
              <div className="md:hidden space-y-6">
                <div className="space-y-3">
                  {ceo && (
                    <OrgCard
                      role={ceo.role_code ?? 'CEO'}
                      title={ceo.role}
                      name={ceo.name}
                      color={ceo.role_color ?? '#1D4ED8'}
                    />
                  )}
                  {directors.map((d) => (
                    <OrgCard
                      key={d.id}
                      role={d.role_code ?? d.role}
                      title={d.role}
                      name={d.name}
                      color={d.role_color ?? '#1A2F3F'}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  {depts.map((dept) => <DeptAccordion key={dept.id} dept={dept} />)}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#F4F6F8] border-t border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1A2F3F]">{value}</div>
                <div className="text-sm text-gray-600 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-6">{philosophyTitle}</h2>
          <p className="text-gray-600 leading-relaxed mb-8">{philosophyText}</p>
          <div className="bg-[#F4F6F8] border-l-4 border-propyte-brand rounded-r-xl p-6">
            <p className="text-[#1A2F3F] font-medium italic">&ldquo;{philosophyHighlight}&rdquo;</p>
          </div>
        </div>
      </section>
    </>
  );
}
