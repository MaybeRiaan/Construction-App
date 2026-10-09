import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildDemoPlaces } from '../data/demoTown';
import { distanceM } from '../domain/geo';
import { decorate, type PlaceView } from '../domain/search';
import type { Place, VibeCheck } from '../domain/types';
import { mergeStats } from '../domain/vibe';
import { importNearby } from '../services/places/osm';
import { useCommunity } from './CommunityProvider';
import { useLocation } from './LocationProvider';
import { usePlaces } from './places';
import { useSettings } from './settings';

export interface PlacesData {
  places: PlaceView[];
  byId: Record<string, PlaceView>;
  /** All vibe checks per place (yours, other families', samples), newest first. */
  vibesFor: (placeId: string) => VibeCheck[];
  status: 'loading' | 'ready' | 'error';
  mode: 'demo' | 'live';
  error: string | null;
  reload: () => void;
}

const Ctx = createContext<PlacesData | null>(null);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const { origin, source } = useLocation();
  const dataMode = useSettings((s) => s.dataMode);
  const radiusKm = useSettings((s) => s.radiusKm);
  const community = useCommunity();
  const myVibes = usePlaces((s) => s.myVibes);
  const live = dataMode === 'live' && source === 'device';

  const [raw, setRaw] = useState<Place[]>(() => (live ? [] : buildDemoPlaces(origin)));
  const [status, setStatus] = useState<PlacesData['status']>(live ? 'loading' : 'ready');
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{ center: typeof origin; radiusKm: number } | null>(null);
  const [nonce, setNonce] = useState(0);
  const handledNonce = useRef(0);

  useEffect(() => {
    if (!live) {
      setRaw(buildDemoPlaces(origin));
      setStatus('ready');
      setError(null);
      return;
    }
    // Re-import only when we have moved or the range grew past what we have.
    const forced = nonce !== handledNonce.current;
    if (!forced && fetched && distanceM(fetched.center, origin) < 1500 && fetched.radiusKm >= Math.min(radiusKm, 15)) return;
    handledNonce.current = nonce;
    const ctl = new AbortController();
    setStatus('loading');
    importNearby(origin, radiusKm, ctl.signal)
      .then((places) => {
        setRaw(places);
        setFetched({ center: origin, radiusKm: Math.min(radiusKm, 15) });
        setStatus('ready');
        setError(null);
      })
      .catch((e: unknown) => {
        if (ctl.signal.aborted) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Could not load places');
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, origin, radiusKm, nonce]);

  const value = useMemo<PlacesData>(() => {
    const extra = new Map<string, VibeCheck[]>();
    const all = new Map<string, VibeCheck[]>();
    const add = (map: Map<string, VibeCheck[]>, v: VibeCheck) => map.set(v.placeId, [...(map.get(v.placeId) ?? []), v]);
    for (const v of community.vibes) {
      add(all, v);
      if (!v.sample) add(extra, v);
    }
    for (const v of myVibes) {
      add(all, v);
      add(extra, v);
    }
    const merged = raw.map((p) => {
      const checks = extra.get(p.id);
      return checks ? { ...p, stats: mergeStats(p.stats, checks) } : p;
    });
    const places = decorate(merged, origin);
    const byId = Object.fromEntries(places.map((p) => [p.id, p]));
    return {
      places,
      byId,
      vibesFor: (id) => [...(all.get(id) ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      status,
      mode: live ? 'live' : 'demo',
      error,
      reload: () => setNonce((n) => n + 1),
    };
  }, [raw, origin, community.vibes, myVibes, status, error, live]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlaceData(): PlacesData {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlaceData outside PlacesProvider');
  return v;
}
