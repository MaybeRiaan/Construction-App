import type { LatLng, LeaderboardEntry, Place, PlaceSubmission, RejectReason, Spot, SubmissionReview, VibeCheck } from '../../domain/types';

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
  /** Places parents added that a reviewer approved. */
  places: Place[];
  /** Review decisions by submission id: your own, plus everyone's for reviewers. */
  reviews: Record<string, SubmissionReview>;
  /** Places waiting for a decision. Only filled for reviewers. */
  queue: PlaceSubmission[];
  /** This viewer can approve or reject places. */
  canReview: boolean;
  /** False when this viewer can't send places, e.g. a read-only shared preview. */
  canSubmit: boolean;
  /** Scout points from the server's ledger, when the backend keeps one. */
  points?: number;
}

export interface PlayerStats {
  teamName: string;
  xp: number;
  spots: number;
  types: number;
}

export type Verdict = { status: 'approved' } | { status: 'rejected'; reason: RejectReason };

export interface Backend {
  kind: BackendKind;
  start(center: LatLng, emit: (patch: Partial<CommunityState>) => void): () => void;
  publishSpot(spot: Spot): Promise<void>;
  unpublishSpot(id: string): Promise<void>;
  syncVotes(spotIds: string[]): Promise<void>;
  syncVibes(vibes: VibeCheck[]): Promise<void>;
  syncPlayer(stats: PlayerStats): Promise<void>;
  /**
   * Send this family's place submissions for review (the full list; the
   * backend keeps what's new). Resolves the ids it accepted.
   */
  syncSubmissions(subs: PlaceSubmission[]): Promise<string[]>;
  /** Approve or reject a submission. Reviewers only; resolves false if refused. */
  review(sub: PlaceSubmission, verdict: Verdict): Promise<boolean>;
  /** Forget anything this backend keeps on the device (Reset demo data). */
  resetLocal(): Promise<void>;
}
