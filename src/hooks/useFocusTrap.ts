'use client';

import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  isOpen: boolean;
  /** Called when Escape is pressed. Omit if the caller already handles Escape itself. */
  onEscape?: () => void;
  /** Locks body scroll while open. Default true — omit if the caller already locks scroll itself. */
  lockScroll?: boolean;
}

/**
 * Traps Tab focus inside a dialog/drawer while open, moves focus in on open,
 * and restores it to the trigger on close. Extracted from the pattern first
 * proven in MobileMenu.tsx so overlays don't each reinvent it (or skip it).
 */
export function useFocusTrap<T extends HTMLElement>({
  isOpen,
  onEscape,
  lockScroll = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!lockScroll) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, lockScroll]);

  // Focus management: capture the trigger on open, move focus into the
  // container, and restore focus to the trigger when it closes.
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const raf = window.requestAnimationFrame(() => {
        (initialFocusRef.current ?? containerRef.current)?.focus({ preventScroll: true });
      });
      return () => window.cancelAnimationFrame(raf);
    }
    previouslyFocusedRef.current?.focus?.({ preventScroll: true });
    previouslyFocusedRef.current = null;
  }, [isOpen]);

  // Escape closes (if requested); Tab is trapped within the container while open.
  useEffect(() => {
    if (!isOpen) return;

    function getFocusable(): HTMLElement[] {
      const root = containerRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !containerRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEscape]);

  return { containerRef, initialFocusRef };
}
