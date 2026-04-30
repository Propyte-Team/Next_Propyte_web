'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'propyte:compare';
const CHANGE_EVENT = 'propyte:compare-changed';
export const MAX_COMPARE = 4;

const EMPTY_LIST: readonly string[] = Object.freeze([]);

let cachedSnapshot: readonly string[] = EMPTY_LIST;
let subscriberCount = 0;

function readList(): readonly string[] {
  if (typeof window === 'undefined') return EMPTY_LIST;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_LIST;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return EMPTY_LIST;
    const cleaned = arr.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE);
    return cleaned.length > 0 ? Object.freeze(cleaned) : EMPTY_LIST;
  } catch {
    return EMPTY_LIST;
  }
}

function writeList(list: readonly string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    cachedSnapshot = list.length > 0 ? Object.freeze([...list]) : EMPTY_LIST;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage may be unavailable
  }
}

function subscribe(callback: () => void): () => void {
  if (subscriberCount === 0) {
    cachedSnapshot = readList();
  }
  subscriberCount++;

  const sync = () => {
    cachedSnapshot = readList();
    callback();
  };
  window.addEventListener('storage', sync);
  window.addEventListener(CHANGE_EVENT, sync);

  if (subscriberCount === 1 && cachedSnapshot.length > 0) {
    queueMicrotask(callback);
  }

  return () => {
    subscriberCount--;
    window.removeEventListener('storage', sync);
    window.removeEventListener(CHANGE_EVENT, sync);
  };
}

const getSnapshot = () => cachedSnapshot;
const getServerSnapshot = () => EMPTY_LIST;

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isComparing = useCallback((id: string) => ids.includes(id), [ids]);
  const isFull = ids.length >= MAX_COMPARE;

  const toggle = useCallback((id: string): { ok: boolean; reason?: 'full' } => {
    if (cachedSnapshot.includes(id)) {
      writeList(cachedSnapshot.filter((x) => x !== id));
      return { ok: true };
    }
    if (cachedSnapshot.length >= MAX_COMPARE) {
      return { ok: false, reason: 'full' };
    }
    writeList([...cachedSnapshot, id]);
    return { ok: true };
  }, []);

  const remove = useCallback((id: string) => {
    if (cachedSnapshot.includes(id)) {
      writeList(cachedSnapshot.filter((x) => x !== id));
    }
  }, []);

  const clear = useCallback(() => {
    if (cachedSnapshot.length > 0) writeList(EMPTY_LIST);
  }, []);

  return { ids, isComparing, isFull, toggle, remove, clear, count: ids.length };
}
