'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'propyte:favorites';
const CHANGE_EVENT = 'propyte:favorites-changed';

const EMPTY_SET: Set<string> = new Set();

let cachedSnapshot: Set<string> = EMPTY_SET;
let subscriberCount = 0;

function readSet(): Set<string> {
  if (typeof window === 'undefined') return EMPTY_SET;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    cachedSnapshot = set;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage may be unavailable (private mode quota, sandboxed iframe, etc.)
  }
}

function subscribe(callback: () => void): () => void {
  if (subscriberCount === 0) {
    cachedSnapshot = readSet();
  }
  subscriberCount++;

  const sync = () => {
    cachedSnapshot = readSet();
    callback();
  };
  window.addEventListener('storage', sync);
  window.addEventListener(CHANGE_EVENT, sync);

  // Defer to next tick so the first subscriber's hydrated snapshot triggers a render
  if (subscriberCount === 1 && cachedSnapshot.size > 0) {
    queueMicrotask(callback);
  }

  return () => {
    subscriberCount--;
    window.removeEventListener('storage', sync);
    window.removeEventListener(CHANGE_EVENT, sync);
  };
}

const getSnapshot = () => cachedSnapshot;
const getServerSnapshot = () => EMPTY_SET;

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    const next = new Set(cachedSnapshot);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeSet(next);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, isFavorite, toggle };
}
