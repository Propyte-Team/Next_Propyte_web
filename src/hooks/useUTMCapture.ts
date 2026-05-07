'use client';

import { useEffect } from 'react';

/**
 * Standard UTM + click ID parameters captured from the landing URL.
 * Stored in sessionStorage so they persist for the visitor's session and
 * can be auto-filled into any form submission (lead/contact/supplier/built).
 */
export interface CapturedUTMs {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  /** Google Click ID (gclid) — needed for Google Ads conversion attribution. */
  gclid?: string;
  /** Facebook Click ID (fbclid) — needed for Meta Ads attribution. */
  fbclid?: string;
  /** First page the visitor landed on. */
  landing_page?: string;
  /** External referrer (document.referrer at landing). */
  referrer?: string;
  /** ISO timestamp when capture happened. */
  captured_at?: string;
}

const STORAGE_KEY = 'propyte_utm_v1';
const TRACKED_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const;

function readStored(): CapturedUTMs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CapturedUTMs;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(data: CapturedUTMs) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage may be unavailable (private mode, quota) — silently skip.
  }
}

/**
 * Reads UTM/click params from the current URL and persists them into
 * sessionStorage on the FIRST navigation of the session. Subsequent
 * navigations within the same session preserve the original capture
 * (don't overwrite with empty values from internal links).
 */
export function useUTMCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const fresh: CapturedUTMs = {};
    let hasAny = false;
    for (const key of TRACKED_KEYS) {
      const value = params.get(key);
      if (value) {
        fresh[key] = value;
        hasAny = true;
      }
    }

    const existing = readStored();
    if (existing && !hasAny) {
      // Visitor already had UTMs from earlier in session → keep them.
      return;
    }

    if (!existing && !hasAny) {
      // First visit, no UTMs in URL → still record landing for context.
      writeStored({
        landing_page: window.location.pathname + window.location.search,
        referrer: document.referrer || undefined,
        captured_at: new Date().toISOString(),
      });
      return;
    }

    // Either first visit with UTMs, or existing visitor revisiting with
    // new campaign params → overwrite with the latest attribution.
    writeStored({
      ...fresh,
      landing_page: window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
      captured_at: new Date().toISOString(),
    });
  }, []);
}

/**
 * Synchronous accessor for forms / submitForm. Returns whatever was
 * captured during this session (or empty object if none / SSR).
 */
export function getCapturedUTMs(): CapturedUTMs {
  return readStored() ?? {};
}
