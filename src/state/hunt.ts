import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { distanceM } from '../domain/geo';
import {
  claimedXp,
  newlyCompleted,
  spotsXp,
  spotXp,
  type ChallengeStatus,
} from '../domain/game';
import { newId } from '../domain/id';
import type { HuntSession, LatLng, Spot } from '../domain/types';
import { appStorage } from '../services/storage';

export interface SpotResult {
  spot: Spot;
  xp: number;
  firstOfType: boolean;
  completed: ChallengeStatus[];
  totalXpBefore: number;
  totalXpAfter: number;
}

export interface HuntSummary {
  session: HuntSession;
  spots: Spot[];
  newTypes: number;
  completed: ChallengeStatus[];
}

interface HuntState {
  spots: Spot[];
  hunts: HuntSession[];
  activeHunt: HuntSession | null;
  /** `${challengeId}@${period}` → ISO time it was completed. */
  claimed: Record<string, string>;
  myVotes: Record<string, true>;

  addSpot: (input: Omit<Spot, 'id' | 'createdAt'> & { createdAt?: string }) => SpotResult;
  updateSpot: (id: string, patch: Partial<Spot>) => void;
  removeSpot: (id: string) => void;
  startHunt: (at: LatLng | null) => HuntSession;
  appendPath: (p: LatLng) => void;
  endHunt: () => HuntSummary | null;
  toggleVote: (spotId: string) => boolean;
  resetAll: () => void;
}

export function totalXp(s: Pick<HuntState, 'spots' | 'claimed'>): number {
  return spotsXp(s.spots) + claimedXp(s.claimed);
}

function claimNew(spots: Spot[], hunts: HuntSession[], claimed: Record<string, string>) {
  const now = new Date();
  const completed = newlyCompleted({ spots, hunts, now }, claimed);
  if (!completed.length) return { claimed, completed };
  const next = { ...claimed };
  for (const c of completed) next[`${c.def.id}@${c.period}`] = now.toISOString();
  return { claimed: next, completed };
}

export const useHunt = create<HuntState>()(
  persist(
    (set, get) => ({
      spots: [],
      hunts: [],
      activeHunt: null,
      claimed: {},
      myVotes: {},

      addSpot: (input) => {
        const state = get();
        const spot: Spot = { ...input, id: newId('spot_'), createdAt: input.createdAt ?? new Date().toISOString() };
        const firstOfType = !state.spots.some((s) => s.typeId === spot.typeId);
        const xp = spotXp(spot, firstOfType);
        const spots = [...state.spots, spot];
        const hunts = state.activeHunt ? [...state.hunts, state.activeHunt] : state.hunts;
        const { claimed, completed } = claimNew(spots, hunts, state.claimed);
        const before = totalXp(state);
        const activeHunt = state.activeHunt
          ? { ...state.activeHunt, spotIds: [...state.activeHunt.spotIds, spot.id], xpEarned: state.activeHunt.xpEarned + xp + completed.reduce((a, c) => a + c.def.xp, 0) }
          : null;
        set({ spots, claimed, activeHunt });
        return {
          spot,
          xp,
          firstOfType,
          completed,
          totalXpBefore: before,
          totalXpAfter: totalXp({ spots, claimed }),
        };
      },
      updateSpot: (id, patch) => set((s) => ({ spots: s.spots.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSpot: (id) => set((s) => ({ spots: s.spots.filter((x) => x.id !== id) })),

      startHunt: (at) => {
        const session: HuntSession = {
          id: newId('hunt_'),
          startedAt: new Date().toISOString(),
          path: at ? [at] : [],
          spotIds: [],
          distanceM: 0,
          xpEarned: 0,
        };
        const hunts = [...get().hunts, session];
        const { claimed } = claimNew(get().spots, hunts, get().claimed);
        set({ activeHunt: session, claimed });
        return session;
      },
      appendPath: (p) =>
        set((s) => {
          if (!s.activeHunt) return s;
          const last = s.activeHunt.path.at(-1);
          const step = last ? distanceM(last, p) : 0;
          if (last && step < 8) return s;
          return { activeHunt: { ...s.activeHunt, path: [...s.activeHunt.path, p].slice(-2000), distanceM: s.activeHunt.distanceM + step } };
        }),
      endHunt: () => {
        const s = get();
        if (!s.activeHunt) return null;
        const session = { ...s.activeHunt, endedAt: new Date().toISOString() };
        const hunts = [...s.hunts, session];
        const { claimed, completed } = claimNew(s.spots, hunts, s.claimed);
        const spots = s.spots.filter((x) => session.spotIds.includes(x.id));
        const earlier = new Set(s.spots.filter((x) => !session.spotIds.includes(x.id)).map((x) => x.typeId));
        const newTypes = new Set(spots.map((x) => x.typeId).filter((t) => !earlier.has(t))).size;
        set({ hunts, activeHunt: null, claimed });
        return { session, spots, newTypes, completed };
      },
      toggleVote: (spotId) => {
        const has = Boolean(get().myVotes[spotId]);
        set((s) => {
          const myVotes = { ...s.myVotes };
          if (has) delete myVotes[spotId];
          else myVotes[spotId] = true;
          return { myVotes };
        });
        return !has;
      },
      resetAll: () => set({ spots: [], hunts: [], activeHunt: null, claimed: {}, myVotes: {} }),
    }),
    {
      name: 'playdar.hunt.v1',
      storage: createJSONStorage(() => appStorage),
      partialize: (s) => ({ spots: s.spots, hunts: s.hunts, activeHunt: s.activeHunt, claimed: s.claimed, myVotes: s.myVotes }),
    },
  ),
);
