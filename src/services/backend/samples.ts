import { demoCommunitySpots, SAMPLE_LEADERBOARD } from '../../data/demoCommunity';
import { demoReviews } from '../../data/demoTown';
import type { LatLng } from '../../domain/types';
import type { CommunityState } from './types';

/** The demo town's sample community, used on its own or underneath live data. */
export function sampleCommunity(center: LatLng): Pick<CommunityState, 'spots' | 'votes' | 'vibes' | 'players'> {
  const { spots, votes } = demoCommunitySpots(center);
  return { spots, votes, vibes: demoReviews(), players: SAMPLE_LEADERBOARD };
}
