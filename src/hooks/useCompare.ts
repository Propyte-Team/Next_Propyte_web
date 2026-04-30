'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'propyte:compare';
const CHANGE_EVENT = 'propyte:compare-changed';
export const MAX_COMPARE = 4;

export type CompareKind = 'unit' | 'development';

interface CompareSnapshot {
  kind: CompareKind | null;
  ids: readonly string[];
}

const EMPTY_SNAPSHOT: CompareSnapshot = Object.freeze({ kind: null, ids: Object.freeze([]) });

let cachedSnapshot: CompareSnapshot = EMPTY_SNAPSHOT;
let subscriberCount = 0;

function readSnapshot(): CompareSnapshot {
  if (typeof window === 'undefined') return EMPTY_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw);
    // Legacy shape: bare string[] (pre cross-kind support). Assume 'development'.
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE);
      return ids.length > 0
        ? Object.freeze({ kind: 'development' as CompareKind, ids: Object.freeze(ids) })
        : EMPTY_SNAPSHOT;
    }
    if (parsed && typeof parsed === 'object') {
      const kind = parsed.kind === 'unit' || parsed.kind === 'development' ? parsed.kind : null;
      const ids = Array.isArray(parsed.ids)
        ? parsed.ids.filter((x: unknown): x is string => typeof x === 'string').slice(0, MAX_COMPARE)
        : [];
      if (!kind || ids.length === 0) return EMPTY_SNAPSHOT;
      return Object.freeze({ kind, ids: Object.freeze(ids) });
    }
    return EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function writeSnapshot(snap: CompareSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    if (snap.ids.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      cachedSnapshot = EMPTY_SNAPSHOT;
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind: snap.kind, ids: snap.ids }));
      cachedSnapshot = Object.freeze({ kind: snap.kind, ids: Object.freeze([...snap.ids]) });
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage may be unavailable
  }
}

function subscribe(callback: () => void): () => void {
  if (subscriberCount === 0) {
    cachedSnapshot = readSnapshot();
  }
  subscriberCount++;

  const sync = () => {
    cachedSnapshot = readSnapshot();
    callback();
  };
  window.addEventListener('storage', sync);
  window.addEventListener(CHANGE_EVENT, sync);

  if (subscriberCount === 1 && cachedSnapshot.ids.length > 0) {
    queueMicrotask(callback);
  }

  return () => {
    subscriberCount--;
    window.removeEventListener('storage', sync);
    window.removeEventListener(CHANGE_EVENT, sync);
  };
}

const getSnapshot = () => cachedSnapshot;
const getServerSnapshot = () => EMPTY_SNAPSHOT;

export function useCompare() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { kind, ids } = snap;

  const isComparing = useCallback((id: string) => ids.includes(id), [ids]);
  const isFull = ids.length >= MAX_COMPARE;

  const toggle = useCallback(
    (
      id: string,
      newKind: CompareKind,
    ): { ok: boolean; reason?: 'full'; switched?: boolean; switchedFrom?: CompareKind } => {
      const current = cachedSnapshot;

      // Cross-kind: reset and start fresh with the new item.
      if (current.kind && current.kind !== newKind && current.ids.length > 0) {
        const previousKind = current.kind;
        writeSnapshot({ kind: newKind, ids: [id] });
        return { ok: true, switched: true, switchedFrom: previousKind };
      }

      if (current.ids.includes(id)) {
        const nextIds = current.ids.filter((x) => x !== id);
        writeSnapshot({ kind: nextIds.length > 0 ? newKind : null, ids: nextIds });
        return { ok: true };
      }
      if (current.ids.length >= MAX_COMPARE) {
        return { ok: false, reason: 'full' };
      }
      writeSnapshot({ kind: newKind, ids: [...current.ids, id] });
      return { ok: true };
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const current = cachedSnapshot;
    if (current.ids.includes(id)) {
      const nextIds = current.ids.filter((x) => x !== id);
      writeSnapshot({ kind: nextIds.length > 0 ? current.kind : null, ids: nextIds });
    }
  }, []);

  const clear = useCallback(() => {
    if (cachedSnapshot.ids.length > 0) writeSnapshot(EMPTY_SNAPSHOT);
  }, []);

  return { ids, kind, isComparing, isFull, toggle, remove, clear, count: ids.length };
}
