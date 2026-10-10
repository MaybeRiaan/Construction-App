import { demoSubmissions } from '../../data/demoCommunity';
import { placeFromSubmission } from '../../domain/contribute';
import type { Place, PlaceSubmission, SubmissionReview } from '../../domain/types';
import { appStorage } from '../storage';
import { sampleCommunity } from './samples';
import type { Backend, CommunityState } from './types';

/**
 * Offline backend: the sample community only. Your own activity stays on this
 * device. The "Add a place" review queue runs on the device too, so the
 * prototype shows both sides: you add a place, then review it as the Playdar
 * team would, and approved places appear on your map.
 */

interface Queue {
  submissions: PlaceSubmission[];
  reviews: Record<string, SubmissionReview>;
  places: Place[];
}

const KEY = 'playdar.demo.queue.v1';
const empty = (): Queue => ({ submissions: [], reviews: {}, places: [] });

export function createDemoBackend(): Backend {
  let queue = empty();
  let samples: PlaceSubmission[] = [];
  let emit: ((patch: Partial<CommunityState>) => void) | null = null;
  const loaded = (async () => {
    try {
      const raw = await appStorage.getItem(KEY);
      if (raw) queue = { ...empty(), ...(JSON.parse(raw) as Partial<Queue>) };
    } catch {
      // start empty
    }
  })();

  // appStorage swallows its own errors.
  const save = () => void appStorage.setItem(KEY, JSON.stringify(queue));
  const push = () =>
    emit?.({
      places: queue.places,
      reviews: queue.reviews,
      queue: [...queue.submissions, ...samples].filter((s) => !queue.reviews[s.id]),
    });

  return {
    kind: 'demo',
    start(center, e) {
      emit = e;
      samples = demoSubmissions(center);
      e({ backend: 'demo', status: 'local', ...sampleCommunity(center), canReview: true, canSubmit: true });
      void loaded.then(push);
      return () => {
        emit = null;
      };
    },
    async publishSpot() {},
    async unpublishSpot() {},
    async syncVotes() {},
    async syncVibes() {},
    async syncPlayer() {},
    async syncSubmissions(subs) {
      await loaded;
      const known = new Set(queue.submissions.map((s) => s.id));
      const fresh = subs.filter((s) => !known.has(s.id));
      if (fresh.length) {
        queue = { ...queue, submissions: [...fresh, ...queue.submissions] };
        save();
        push();
      }
      return subs.map((s) => s.id);
    },
    async review(sub, verdict) {
      await loaded;
      const reviewedAt = new Date().toISOString();
      if (verdict.status === 'approved') {
        const place = placeFromSubmission(sub);
        queue = {
          ...queue,
          places: [place, ...queue.places.filter((p) => p.id !== place.id)],
          reviews: { ...queue.reviews, [sub.id]: { submissionId: sub.id, status: 'approved', placeId: place.id, reviewedAt } },
        };
      } else {
        queue = { ...queue, reviews: { ...queue.reviews, [sub.id]: { submissionId: sub.id, status: 'rejected', reason: verdict.reason, reviewedAt } } };
      }
      save();
      push();
      return true;
    },
    async resetLocal() {
      await loaded;
      queue = empty();
      await appStorage.removeItem(KEY);
      push();
    },
  };
}
