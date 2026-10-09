import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hasSupabase } from '../config';
import { fuzz } from '../domain/geo';
import type { LeaderboardEntry, Spot } from '../domain/types';
import { aiStatus, type AiStatus } from '../services/ai';
import { inArtifact } from '../services/artifactRuntime';
import { createArtifactBackend } from '../services/backend/artifact';
import { createDemoBackend } from '../services/backend/demo';
import { createSupabaseBackend } from '../services/backend/supabase';
import type { Backend, CommunityState } from '../services/backend/types';
import { totalXp, useHunt } from './hunt';
import { useLocation } from './LocationProvider';
import { usePlaces } from './places';
import { useSettings } from './settings';

export interface Community extends CommunityState {
  /** Other families' public spots plus your own public ones. */
  allSpots: Spot[];
  voteCount: (spotId: string) => number;
  hasVoted: (spotId: string) => boolean;
  toggleVote: (spotId: string) => boolean;
  leaderboard: LeaderboardEntry[];
  /** Share a spot (rounded location) if sharing is on. */
  publish: (spot: Spot) => void;
  unpublish: (spotId: string) => void;
  ai: AiStatus | null;
}

const Ctx = createContext<Community | null>(null);

function pickBackend(): Backend {
  if (inArtifact()) return createArtifactBackend();
  if (hasSupabase) return createSupabaseBackend();
  return createDemoBackend();
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { origin } = useLocation();
  const backend = useMemo(pickBackend, []);
  const [state, setState] = useState<CommunityState>({ backend: backend.kind, status: 'connecting', spots: [], votes: {}, vibes: [], players: [] });
  const [ai, setAi] = useState<AiStatus | null>(null);

  useEffect(() => backend.start(origin, (patch) => setState((s) => ({ ...s, ...patch }))), [backend, origin]);
  useEffect(() => {
    aiStatus().then(setAi, () => setAi({ provider: null, vision: false, ask: false }));
  }, []);

  const mySpots = useHunt((s) => s.spots);
  const claimed = useHunt((s) => s.claimed);
  const myVotes = useHunt((s) => s.myVotes);
  const toggleVoteLocal = useHunt((s) => s.toggleVote);
  const myVibes = usePlaces((s) => s.myVibes);
  const teamName = useSettings((s) => s.teamName);
  const sharePublicly = useSettings((s) => s.sharePublicly);

  // Push local changes to the shared backend, debounced.
  const voteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (voteTimer.current) clearTimeout(voteTimer.current);
    voteTimer.current = setTimeout(() => void backend.syncVotes(Object.keys(myVotes)), 700);
  }, [backend, myVotes]);

  const vibesSynced = useRef(false);
  useEffect(() => {
    if (!vibesSynced.current && !myVibes.length) return;
    vibesSynced.current = true;
    void backend.syncVibes(myVibes);
  }, [backend, myVibes]);

  const xp = totalXp({ spots: mySpots, claimed });
  const types = new Set(mySpots.map((s) => s.typeId)).size;
  useEffect(() => {
    if (!mySpots.length) return;
    const t = setTimeout(() => void backend.syncPlayer({ teamName, xp, spots: mySpots.length, types }), 1200);
    return () => clearTimeout(t);
  }, [backend, teamName, xp, mySpots.length, types]);

  const publish = useCallback(
    (spot: Spot) => {
      if (!spot.isPublic || !sharePublicly) return;
      void backend.publishSpot({ ...spot, coordinate: fuzz(spot.coordinate), kidId: undefined, teamName });
    },
    [backend, sharePublicly, teamName],
  );
  const unpublish = useCallback((id: string) => void backend.unpublishSpot(id), [backend]);

  const value = useMemo<Community>(() => {
    const mine = mySpots.filter((s) => s.isPublic && sharePublicly && !s.foundOf).map((s) => ({ ...s, ownerId: 'me', teamName }));
    const allSpots = [...mine, ...state.spots];
    const me: LeaderboardEntry = { id: 'me', teamName, xp, spots: mySpots.length, types, isMe: true };
    const leaderboard = [...state.players.filter((p) => p.id !== 'me'), me].sort((a, b) => b.xp - a.xp);
    return {
      ...state,
      allSpots,
      voteCount: (id) => (state.votes[id] ?? 0) + (myVotes[id] ? 1 : 0),
      hasVoted: (id) => Boolean(myVotes[id]),
      toggleVote: toggleVoteLocal,
      leaderboard,
      publish,
      unpublish,
      ai,
    };
  }, [state, mySpots, sharePublicly, teamName, xp, types, myVotes, toggleVoteLocal, publish, unpublish, ai]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommunity(): Community {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCommunity outside CommunityProvider');
  return v;
}
