import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { config } from '../config';
import type { Units } from '../domain/geo';
import { newId } from '../domain/id';
import type { AvatarId, CategoryId, Kid } from '../domain/types';
import { appStorage } from '../services/storage';

export type ThemePref = 'system' | 'light' | 'dark';
export type DataMode = 'demo' | 'live';

interface SettingsState {
  onboarded: boolean;
  themePref: ThemePref;
  units: Units;
  radiusKm: number;
  kids: Kid[];
  teamName: string;
  interests: CategoryId[];
  dataMode: DataMode;
  /** Share named machines with other hunters (rounded location, no faces). */
  sharePublicly: boolean;
  /** Which child is holding the phone during a hunt. null = whole family. */
  activeKidId: string | null;

  completeOnboarding: (input: { kids: Kid[]; interests: CategoryId[]; dataMode: DataMode; teamName?: string }) => void;
  setThemePref: (p: ThemePref) => void;
  setUnits: (u: Units) => void;
  setRadiusKm: (km: number) => void;
  addKid: (name: string, age: number, avatar: AvatarId) => void;
  updateKid: (id: string, patch: Partial<Omit<Kid, 'id'>>) => void;
  removeKid: (id: string) => void;
  setTeamName: (name: string) => void;
  setInterests: (ids: CategoryId[]) => void;
  setDataMode: (m: DataMode) => void;
  setSharePublicly: (v: boolean) => void;
  setActiveKid: (id: string | null) => void;
  resetAll: () => void;
}

const initial = {
  onboarded: false,
  themePref: 'system' as ThemePref,
  units: 'km' as Units,
  radiusKm: config.defaultRadiusKm,
  kids: [] as Kid[],
  teamName: 'Team Explorer',
  interests: [] as CategoryId[],
  dataMode: 'demo' as DataMode,
  sharePublicly: true,
  activeKidId: null as string | null,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initial,
      completeOnboarding: ({ kids, interests, dataMode, teamName }) =>
        set((s) => ({
          onboarded: true,
          kids,
          interests,
          dataMode,
          teamName: teamName?.trim() || s.teamName,
          activeKidId: kids[0]?.id ?? null,
        })),
      setThemePref: (themePref) => set({ themePref }),
      setUnits: (units) => set({ units }),
      setRadiusKm: (km) => set({ radiusKm: Math.max(config.minRadiusKm, Math.min(config.maxRadiusKm, Math.round(km))) }),
      addKid: (name, age, avatar) =>
        set((s) => {
          const kid = { id: newId('kid_'), name: name.trim() || 'Explorer', age, avatar };
          return { kids: [...s.kids, kid], activeKidId: s.activeKidId ?? kid.id };
        }),
      updateKid: (id, patch) => set((s) => ({ kids: s.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)) })),
      removeKid: (id) =>
        set((s) => ({ kids: s.kids.filter((k) => k.id !== id), activeKidId: s.activeKidId === id ? null : s.activeKidId })),
      setTeamName: (teamName) => set({ teamName: teamName.slice(0, 28) }),
      setInterests: (interests) => set({ interests }),
      setDataMode: (dataMode) => set({ dataMode }),
      setSharePublicly: (sharePublicly) => set({ sharePublicly }),
      setActiveKid: (activeKidId) => set({ activeKidId }),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'playdar.settings.v1',
      storage: createJSONStorage(() => appStorage),
    },
  ),
);
