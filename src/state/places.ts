import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_FILTERS, type Filters } from '../domain/search';
import type { VibeCheck } from '../domain/types';
import { appStorage } from '../services/storage';

export type SavedList = 'favourites' | 'rainy' | 'try';

export const SAVED_LISTS: { id: SavedList; label: string }[] = [
  { id: 'favourites', label: 'Favourites' },
  { id: 'try', label: 'Want to try' },
  { id: 'rainy', label: 'Rainy day' },
];

interface PlacesState {
  saved: Record<string, { list: SavedList; at: string }>;
  myVibes: VibeCheck[];
  filters: Filters;
  recentSearches: string[];

  toggleSave: (placeId: string, list?: SavedList) => boolean;
  moveSaved: (placeId: string, list: SavedList) => void;
  addVibe: (v: VibeCheck) => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: (keepCategories?: boolean) => void;
  addRecentSearch: (q: string) => void;
  resetAll: () => void;
}

export const usePlaces = create<PlacesState>()(
  persist(
    (set, get) => ({
      saved: {},
      myVibes: [],
      filters: DEFAULT_FILTERS,
      recentSearches: [],

      toggleSave: (placeId, list = 'favourites') => {
        const isSaved = Boolean(get().saved[placeId]);
        set((s) => {
          const saved = { ...s.saved };
          if (isSaved) delete saved[placeId];
          else saved[placeId] = { list, at: new Date().toISOString() };
          return { saved };
        });
        return !isSaved;
      },
      moveSaved: (placeId, list) =>
        set((s) => (s.saved[placeId] ? { saved: { ...s.saved, [placeId]: { ...s.saved[placeId], list } } } : s)),
      addVibe: (v) => set((s) => ({ myVibes: [v, ...s.myVibes.filter((x) => x.placeId !== v.placeId)] })),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: (keepCategories = true) =>
        set((s) => ({ filters: { ...DEFAULT_FILTERS, categories: keepCategories ? s.filters.categories : [] } })),
      addRecentSearch: (q) =>
        set((s) => {
          const t = q.trim();
          if (!t) return s;
          return { recentSearches: [t, ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6) };
        }),
      resetAll: () => set({ saved: {}, myVibes: [], filters: DEFAULT_FILTERS, recentSearches: [] }),
    }),
    {
      name: 'playdar.places.v1',
      storage: createJSONStorage(() => appStorage),
      partialize: (s) => ({ saved: s.saved, myVibes: s.myVibes, filters: s.filters, recentSearches: s.recentSearches }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PlacesState>;
        return { ...current, ...p, filters: { ...DEFAULT_FILTERS, ...(p.filters ?? {}) } };
      },
    },
  ),
);
