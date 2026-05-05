'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import ColorSection from './sections/ColorSection';
import TypographySection from './sections/TypographySection';
import SpacingSection from './sections/SpacingSection';
import RadiusSection from './sections/RadiusSection';
import ShadowSection from './sections/ShadowSection';
import MediaSection from './sections/MediaSection';
import QuickEditPanel from './QuickEditPanel';

interface Section {
  id: string;
  label: string;
  keywords: string[];   // for search matching
  component: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'colors',
    label: 'Colores',
    keywords: ['color', 'palette', 'teal', 'navy', 'background', 'foreground', 'muted', 'border', 'semantic', 'brand', 'status', 'wcag', 'contraste'],
    component: <ColorSection />,
  },
  {
    id: 'typography',
    label: 'Tipografía',
    keywords: ['font', 'typeface', 'fuente', 'size', 'weight', 'line-height', 'letter-spacing', 'heading', 'body', 'rem', 'px', 'scale'],
    component: <TypographySection />,
  },
  {
    id: 'spacing',
    label: 'Espaciado',
    keywords: ['spacing', 'space', 'gap', 'padding', 'margin', 'container', 'section', 'layout', 'grid'],
    component: <SpacingSection />,
  },
  {
    id: 'radii',
    label: 'Bordes y radios',
    keywords: ['radius', 'border', 'rounded', 'corner', 'card', 'btn', 'badge', 'pill', 'sm', 'md', 'lg', 'xl', 'full'],
    component: <RadiusSection />,
  },
  {
    id: 'shadows',
    label: 'Sombras',
    keywords: ['shadow', 'sombra', 'box-shadow', 'elevation', 'blur', 'offset', 'spread', 'sm', 'md', 'lg', 'xl'],
    component: <ShadowSection />,
  },
  {
    id: 'media',
    label: 'Imágenes / Media',
    keywords: ['image', 'media', 'aspect', 'ratio', 'object-fit', 'cover', 'card', 'hero', 'portrait', 'radius', 'height'],
    component: <MediaSection />,
  },
];

interface SectionBlockProps {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}

function SectionBlock({ section, isOpen, onToggle }: SectionBlockProps) {
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-semibold text-neutral-700">{section.label}</span>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1">
          {section.component}
        </div>
      )}
    </div>
  );
}

interface ControlPanelProps {
  forceOpen?: string | null;
  forceOpenLabel?: string;
  onForceOpenHandled?: () => void;
}

export default function ControlPanel({ forceOpen, forceOpenLabel = '', onForceOpenHandled }: ControlPanelProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['colors']));
  const [search, setSearch] = useState('');
  const [quickEdit, setQuickEdit] = useState<{ category: string; label: string } | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!forceOpen) return;
    setQuickEdit({ category: forceOpen, label: forceOpenLabel });
    setOpenSections((prev) => new Set([...prev, forceOpen]));
    setSearch('');
    onForceOpenHandled?.();
  }, [forceOpen, forceOpenLabel, onForceOpenHandled]);

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const query = search.toLowerCase().trim();
  const visibleSections = query
    ? SECTIONS.filter(
        (s) =>
          s.label.toLowerCase().includes(query) ||
          s.keywords.some((k) => k.includes(query)),
      )
    : SECTIONS;

  // When searching, expand all matching sections.
  const effectiveOpen = query
    ? new Set(visibleSections.map((s) => s.id))
    : openSections;

  return (
    <div className="flex flex-col h-full">
      {/* Quick edit panel — shown when inspector detects a click */}
      {quickEdit && (
        <QuickEditPanel
          category={quickEdit.category}
          label={quickEdit.label}
          onClose={() => setQuickEdit(null)}
        />
      )}

      {/* Search */}
      <div className="px-4 py-3 border-b border-neutral-100 sticky top-0 bg-white z-10">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar token…"
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-neutral-200 rounded-md bg-white focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {visibleSections.length === 0 ? (
          <p className="px-4 py-6 text-xs text-neutral-400 text-center">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
        ) : (
          visibleSections.map((section) => (
            <div key={section.id} ref={(el) => { sectionRefs.current[section.id] = el; }}>
              <SectionBlock
                section={section}
                isOpen={effectiveOpen.has(section.id)}
                onToggle={() => toggle(section.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
