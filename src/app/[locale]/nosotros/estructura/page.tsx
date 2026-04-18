'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, ChevronUp, Building2, Users, Monitor, DollarSign, Briefcase, Megaphone } from 'lucide-react';

// ── Org data ────────────────────────────────────
const cSuite = [
  { role: 'CEO', title: 'Director General', name: 'José Benjamín Paredes', color: '#4285F4' },
];

const directors = [
  { role: 'CSO', title: 'Director Comercial', name: 'Felipe Luksic', color: '#1A2F3F' },
  { role: 'COO', title: 'Director de Operaciones', name: 'Landy López', color: '#E67C00' },
  { role: 'CFO', title: 'Director de Finanzas', name: 'Mario Caamal', color: '#EA4335' },
];

const departments = [
  {
    name: 'Marketing', icon: Megaphone, director: 'CSO',
    members: [
      { role: 'Coordinador de Marketing', name: 'Luis Flores' },
      { role: 'Diseñadora Gráfica', name: 'Laura UC' },
      { role: 'Becario 1', name: null },
      { role: 'Becario 2', name: null },
    ],
  },
  {
    name: 'Ventas — PDC y Tulum', icon: Building2, director: 'CSO',
    members: [
      { role: 'Gerente de Ventas', name: null },
      { role: 'Team Leader 1', name: null },
      { role: 'Team Leader 2', name: null },
      { role: 'Hostess', name: null },
      { role: 'Asesores de Ventas (5 activos)', name: '5 asesores' },
    ],
  },
  {
    name: 'Tecnología', icon: Monitor, director: 'COO', corp: true,
    members: [
      { role: 'Gerente de TI', name: 'Kenny Mex' },
      { role: 'Auxiliar de TI', name: 'Fernando Mukul' },
    ],
  },
  {
    name: 'Capital Humano', icon: Users, director: 'COO', corp: true,
    members: [
      { role: 'Gerente de RRHH', name: 'Montserrat Alonso' },
      { role: 'Auxiliar de Reclutamiento', name: 'Angélica Tec' },
    ],
  },
  {
    name: 'Finanzas y Contabilidad', icon: DollarSign, director: 'CFO', corp: true,
    members: [
      { role: 'Tesorería', name: 'Daniel EK' },
    ],
  },
  {
    name: 'Administración', icon: Briefcase, director: 'CFO',
    members: [
      { role: 'Asistente Administrativo', name: 'Haydee Nolasco' },
      { role: 'Gestor Jurídico', name: 'Jorge Alonso', corp: true },
      { role: 'Gestora', name: 'Dana Martínez' },
      { role: 'Auxiliar de limpieza', name: null },
    ],
  },
];

function OrgCard({ role, title, name, color }: { role: string; title: string; name: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 text-center min-w-[180px]" style={{ borderTopWidth: 4, borderTopColor: color, borderTopStyle: 'solid' }}>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{role}</span>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      <p className="font-semibold text-gray-900 mt-1 text-sm">{name}</p>
    </div>
  );
}

function DeptAccordion({ dept }: { dept: typeof departments[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = dept.icon;
  const t = useTranslations('about');

  return (
    <div className="bg-[#F4F6F8] rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-[#1A2F3F]" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-[#1A2F3F]">
            {dept.name}
            {dept.corp && <span className="ml-2 text-xs font-normal text-gray-400">(Corp.)</span>}
          </h3>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {dept.members.map((m, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{m.role}</span>
              {m.name ? (
                <span className="font-medium text-gray-900">
                  {m.name}
                  {(m as { corp?: boolean }).corp && <span className="ml-1 text-xs text-gray-400">(Corp.)</span>}
                </span>
              ) : (
                <span className="text-[#F5A623] text-xs font-medium">{t('hiring')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EstructuraPage() {
  const t = useTranslations('about');

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
    { value: t('stat4Value'), label: t('stat4Label') },
  ];

  return (
    <div>
      {/* Org Chart */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] text-center mb-4">{t('structureTitle')}</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">{t('structureSubtitle')}</p>

          {/* Desktop: visual org chart */}
          <div className="hidden md:block">
            {/* CEO */}
            <div className="flex justify-center mb-8">
              <OrgCard {...cSuite[0]} />
            </div>
            {/* Connector */}
            <div className="flex justify-center mb-8">
              <div className="w-px h-8 bg-gray-300" />
            </div>
            {/* Directors */}
            <div className="flex justify-center gap-8 mb-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gray-300" />
              {directors.map(d => (
                <div key={d.role} className="relative pt-4">
                  <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-300" />
                  <OrgCard {...d} />
                </div>
              ))}
            </div>
            {/* Departments grid under directors */}
            <div className="grid md:grid-cols-3 gap-6 mt-4">
              {['CSO', 'COO', 'CFO'].map(dir => (
                <div key={dir} className="space-y-3">
                  {departments.filter(d => d.director === dir).map(dept => (
                    <DeptAccordion key={dept.name} dept={dept} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: accordion list */}
          <div className="md:hidden space-y-6">
            {/* C-Suite cards */}
            <div className="space-y-3">
              <OrgCard {...cSuite[0]} />
              {directors.map(d => <OrgCard key={d.role} {...d} />)}
            </div>
            {/* Departments */}
            <div className="space-y-3">
              {departments.map(dept => <DeptAccordion key={dept.name} dept={dept} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#F4F6F8] border-t border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1A2F3F]">{value}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-6">{t('structurePhilosophyTitle')}</h2>
          <p className="text-gray-600 leading-relaxed mb-8">{t('structurePhilosophyText')}</p>
          <div className="bg-[#F4F6F8] border-l-4 border-[#5CE0D2] rounded-r-xl p-6">
            <p className="text-[#1A2F3F] font-medium italic">&ldquo;{t('structurePhilosophyHighlight')}&rdquo;</p>
          </div>
        </div>
      </section>
    </div>
  );
}
