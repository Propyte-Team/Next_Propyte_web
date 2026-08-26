'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Outside-click to close, Escape to close + return focus to the trigger, and
 * focus-into-panel on open — the behavior a button-triggered popover menu
 * needs (ARIA APG menu-button pattern). Extracted from the identical effects
 * that used to be copy-pasted into ActionsPill and MobileHeader's language
 * dropdown.
 */
export function useDropdownMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const firstItem = panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus({ preventScroll: true });
  }, [open]);

  return { open, setOpen, containerRef, triggerRef, panelRef };
}
