import type { StateStorage } from 'zustand/middleware';

/**
 * Browser storage can be missing or throw (private windows, sandboxed
 * previews), so every access is guarded and the app keeps working in memory.
 */
const memory = new Map<string, string>();

function local(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = '__playdar_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const store = typeof window !== 'undefined' ? local() : null;

export const appStorage: StateStorage = {
  getItem: (key) => {
    try {
      return store ? store.getItem(key) : memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem: (key, value) => {
    memory.set(key, value);
    try {
      store?.setItem(key, value);
    } catch {
      // quota or blocked: memory copy still serves this session
    }
  },
  removeItem: (key) => {
    memory.delete(key);
    try {
      store?.removeItem(key);
    } catch {
      // ignore
    }
  },
};
