import type { LatLng, LeaderboardEntry, Spot, VibeCheck } from '../../domain/types';

export type BackendKind = 'demo' | 'artifact' | 'supabase';
export type SyncStatus = 'local' | 'connecting' | 'live' | 'readonly';

/** Everything other families contribute. The user's own data lives in the local stores. */
export interface CommunityState {
  backend: BackendKind;
  status: SyncStatus;
  spots: Spot[];
  /** Votes from other people, by spot id. */
  votes: Record<string, number>;
  vibes: VibeCheck[];
  players: LeaderboardEntry[];
}

export interface PlayerStats {
  teamName: string;
  xp: number;
  spots: number;
  types: number;
}

export interface Backend {
  kind: BackendKind;
  start(center: LatLng, emit: (patch: Partial<CommunityState>) => void): () => void;
  publishSpot(spot: Spot): Promise<void>;
  unpublishSpot(id: string): Promise<void>;
  syncVotes(spotIds: string[]): Promise<void>;
  syncVibes(vibes: VibeCheck[]): Promise<void>;
  syncPlayer(stats: PlayerStats): Promise<void>;
}
