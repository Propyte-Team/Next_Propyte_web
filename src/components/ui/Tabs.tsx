'use client';

import { useState, useRef, type ReactNode, type KeyboardEvent } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  panel: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
  tablistLabel?: string;
}

/**
 * Generic, accessible Tabs primitive with ARIA roles + keyboard navigation.
 * Arrow Left/Right cycles tabs; Home/End jumps to first/last.
 */
export default function Tabs({
  items,
  defaultTab,
  onChange,
  variant = 'underline',
  className = '',
  tablistLabel,
}: TabsProps) {
  const [active, setActive] = useState(defaultTab || items[0]?.id);
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // React docs pattern "Adjusting state when a prop changes" — runs setState during render,
  // React unwinds the current render. Avoids set-state-in-effect lint + cascading renders.
  if (defaultTab !== prevDefaultTab) {
    setPrevDefaultTab(defaultTab);
    if (defaultTab) setActive(defaultTab);
  }

  const handleSelect = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const count = items.length;
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % count;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + count) % count;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = count - 1;
    if (nextIdx !== null) {
      e.preventDefault();
      const nextId = items[nextIdx].id;
      handleSelect(nextId);
      tabRefs.current[nextId]?.focus();
    }
  };

  const activePanel = items.find((t) => t.id === active)?.panel;

  const isPill = variant === 'pill';
  const tablistCls = isPill
    ? 'inline-flex bg-gray-100 rounded-full p-1'
    : 'border-b border-gray-200 flex gap-1 overflow-x-auto no-scrollbar';

  return (
    <div className={className}>
      <div role="tablist" aria-label={tablistLabel} className={tablistCls}>
        {items.map((item, idx) => {
          const isActive = item.id === active;
          const btnCls = isPill
            ? `px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive ? 'bg-white text-[#1A2F3F] shadow-sm' : 'text-gray-600 hover:text-[#1A2F3F]'
              }`
            : `relative px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'text-[#1A2F3F] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[#5CE0D2]'
                  : 'text-gray-600 hover:text-[#1A2F3F]'
              }`;
          return (
            <button
              key={item.id}
              ref={(el) => { tabRefs.current[item.id] = el; }}
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(item.id)}
              onKeyDown={(e) => handleKey(e, idx)}
              className={btnCls}
            >
              {item.icon}
              {item.label}
              {item.badge != null && (
                <span className="ml-1 px-1.5 py-0.5 text-2xs font-bold bg-[#5CE0D2]/15 text-[#0F766E] rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="mt-6"
      >
        {activePanel}
      </div>
    </div>
  );
}
