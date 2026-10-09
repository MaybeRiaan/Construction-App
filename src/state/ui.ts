import { create } from 'zustand';
import type { ChallengeStatus } from '../domain/game';
import type { Spot } from '../domain/types';
import type { IconName } from '../ui/iconRegistry';
import type { HuntSummary } from './hunt';

export interface Toast {
  id: number;
  text: string;
  icon?: IconName;
  tone?: 'default' | 'success' | 'accent' | 'danger';
}

export interface Celebration {
  kind: 'spot' | 'found' | 'hunt';
  spot?: Spot;
  xp: number;
  firstOfType?: boolean;
  completed: ChallengeStatus[];
  xpBefore: number;
  xpAfter: number;
  hunt?: HuntSummary;
  hadPeople?: boolean;
}

interface UiState {
  toasts: Toast[];
  celebration: Celebration | null;
  setCelebration: (c: Celebration | null) => void;
  /** Selected pin on the Explore map. */
  selectedPlaceId: string | null;
  showToast: (text: string, opts?: Omit<Toast, 'id' | 'text'>) => void;
  dismissToast: (id: number) => void;
  selectPlace: (id: string | null) => void;
}

let seq = 1;

export const useUi = create<UiState>()((set, get) => ({
  toasts: [],
  celebration: null,
  setCelebration: (celebration) => set({ celebration }),
  selectedPlaceId: null,
  showToast: (text, opts) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, ...opts }] }));
    setTimeout(() => get().dismissToast(id), 2800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  selectPlace: (selectedPlaceId) => set({ selectedPlaceId }),
}));

export const toast = (text: string, opts?: Omit<Toast, 'id' | 'text'>) => useUi.getState().showToast(text, opts);
