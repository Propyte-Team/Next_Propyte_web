'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { GitCompare, X, ChevronUp } from 'lucide-react';
import { useCompare, MAX_COMPARE } from '@/hooks/useCompare';
import { useCurrency } from '@/context/CurrencyContext';
import type { Property } from '@/types/property';

interface ComparePanelProps {
  properties: Property[];
}

export default function ComparePanel({ properties }: ComparePanelProps) {
  const locale = useLocale();
  const tMkt = useTranslations('marketplace');
  const tStages = useTranslations('stages');
  const { format } = useCurrency();
  const { ids, remove, clear } = useCompare();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const safeStage = (s: string) => {
    try { return tStages(s as 'preventa'); } catch { return s; }
  };

  const selected = useMemo(() => {
    const byId = new Map(properties.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Property => Boolean(p));
  }, [ids, properties]);

  // Modal stays open only while we still have selections; derived to avoid
  // setState-in-effect lint when items drop to 0 from the sticky bar.
  const modalOpen = open && selected.length > 0;

  // Body scroll lock + ESC to close + focus trap when modal open
  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Save the element that had focus before opening so we can restore it.
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    // Focus the close button after mount so SR/keyboard users land inside.
    queueMicrotask(() => closeBtnRef.current?.focus());

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Edge case: focus drifted outside the dialog (overlay click, click-out
      // on something stepped on tab event ordering). Pull it back to first.
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      // Restore focus to the trigger that opened the modal (CTA in the bar).
      lastFocusedRef.current?.focus?.();
    };
  }, [modalOpen]);

  if (selected.length === 0) return null;

  const detailBase = (p: Property) => (p.kind === 'unit' ? 'propiedades' : 'desarrollos');

  return (
    <>
      {/* Sticky bottom bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 bg-[#0F1923] text-white shadow-[0_-8px_24px_rgba(0,0,0,0.18)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="region"
        aria-label={tMkt('comparePanelLabel')}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <GitCompare size={16} className="text-propyte-brand" />
            <span className="text-sm font-semibold tabular-nums">
              {selected.length}/{MAX_COMPARE}
            </span>
          </div>

          <div className="flex-1 flex flex-wrap gap-1.5 items-center min-w-0 overflow-x-auto no-scrollbar">
            {selected.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium"
              >
                <span className="truncate max-w-[160px]">{p.name}</span>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`${tMkt('removeFilter')}: ${p.name}`}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-propyte-brand/70"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={clear}
            className="hidden sm:inline-flex items-center h-9 px-3 rounded-full text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand"
          >
            {tMkt('clearAll')}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={selected.length < 2}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-propyte-brand text-[#0F1923] text-sm font-bold hover:bg-propyte-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <ChevronUp size={14} strokeWidth={2.5} />
            {tMkt('compareCta')}
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={tMkt('compareModalLabel')}
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            className="bg-white w-full sm:max-w-5xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1A2F3F]">{tMkt('compareModalTitle')}</h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={tMkt('closeModal')}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-[#1A2F3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 w-32">
                      {tMkt('compareSpec')}
                    </th>
                    {selected.map((p) => (
                      <th key={p.id} className="text-left px-4 py-3 min-w-[180px]">
                        <Link
                          href={`/${locale}/${detailBase(p)}/${p.slug}`}
                          className="block hover:text-[#0E7490]"
                        >
                          {p.images[0] && (
                            <div className="relative aspect-[16/10] w-full mb-2 rounded-lg overflow-hidden bg-gray-100">
                              <Image src={p.images[0]} alt={p.name} fill sizes="200px" className="object-cover" />
                            </div>
                          )}
                          <div className="font-bold text-[#1A2F3F] line-clamp-2">{p.name}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{p.location.city}</div>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">
                      {tMkt('comparePrice')}
                    </td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-4 py-3 font-bold text-[#1A2F3F] tabular-nums">
                        {p.price.mxn > 0 ? format(p.price.mxn) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">
                      {tMkt('compareArea')}
                    </td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-gray-700 tabular-nums">
                        {p.specs.area > 0 ? `${p.specs.area} m²` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">
                      {tMkt('compareRoi')}
                    </td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-gray-700 tabular-nums">
                        {p.roi.projected > 0 ? `${p.roi.projected}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">
                      {tMkt('compareCapRate')}
                    </td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-gray-700 tabular-nums">
                        {p.capRate != null && p.capRate > 0 ? `${p.capRate.toFixed(1)}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">
                      {tMkt('compareStage')}
                    </td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-gray-700">
                        {safeStage(p.stage)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">
                      {tMkt('compareDeveloper')}
                    </td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-gray-700 text-xs">
                        {p.developer || '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
