import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PlaceSubmission } from '../domain/types';
import { appStorage } from '../services/storage';

/** Places this family suggested. Kept on the device; the backend gets a copy for review. */
interface ContributeState {
  submissions: PlaceSubmission[];
  /** Submission ids the backend has accepted. Others are retried. */
  sent: Record<string, true>;
  add: (s: PlaceSubmission) => void;
  markSent: (ids: string[]) => void;
  resetAll: () => void;
}

export const useContribute = create<ContributeState>()(
  persist(
    (set) => ({
      submissions: [],
      sent: {},
      add: (s) => set((st) => ({ submissions: [s, ...st.submissions.filter((x) => x.id !== s.id)] })),
      markSent: (ids) =>
        set((st) => {
          if (ids.every((id) => st.sent[id])) return st;
          const sent = { ...st.sent };
          for (const id of ids) sent[id] = true;
          return { sent };
        }),
      resetAll: () => set({ submissions: [], sent: {} }),
    }),
    {
      name: 'playdar.contribute.v1',
      storage: createJSONStorage(() => appStorage),
      partialize: (s) => ({ submissions: s.submissions, sent: s.sent }),
    },
  ),
);
