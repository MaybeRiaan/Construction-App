import { useMemo } from 'react';
import { scoutPoints, scoutRank, submissionState, type PointsLine, type SubmissionState } from '../domain/contribute';
import type { PlaceSubmission, SubmissionReview } from '../domain/types';
import { useCommunity } from './CommunityProvider';
import { useContribute } from './contribute';
import { usePlaceData } from './PlacesProvider';

export interface ScoutItem {
  submission: PlaceSubmission;
  state: SubmissionState;
  review?: SubmissionReview;
}

export interface Scout {
  points: number;
  lines: PointsLine[];
  rank: ReturnType<typeof scoutRank>;
  items: ScoutItem[];
  /** Waiting for a decision, sent or not. */
  waiting: number;
  live: number;
}

/** Your added places, where each one stands, and the Scout points they earned. */
export function useScout(): Scout {
  const community = useCommunity();
  const { vibesFor } = usePlaceData();
  const submissions = useContribute((s) => s.submissions);
  const sent = useContribute((s) => s.sent);
  return useMemo(() => {
    const local = scoutPoints(submissions, community.reviews, vibesFor);
    // A backend with a points ledger is the source of truth for the total.
    const points = community.points ?? local.total;
    const items = submissions.map((s) => ({ submission: s, state: submissionState(s, community.reviews, Boolean(sent[s.id])), review: community.reviews[s.id] }));
    return {
      points,
      lines: local.lines,
      rank: scoutRank(points),
      items,
      waiting: items.filter((i) => i.state === 'pending' || i.state === 'local').length,
      live: items.filter((i) => i.state === 'approved').length,
    };
  }, [submissions, sent, community.reviews, community.points, vibesFor]);
}
