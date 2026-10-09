import type { Backend } from './types';
import { sampleCommunity } from './samples';

/** Offline backend: the sample community only. Your own activity stays on this device. */
export function createDemoBackend(): Backend {
  return {
    kind: 'demo',
    start(center, emit) {
      emit({ backend: 'demo', status: 'local', ...sampleCommunity(center) });
      return () => {};
    },
    async publishSpot() {},
    async unpublishSpot() {},
    async syncVotes() {},
    async syncVibes() {},
    async syncPlayer() {},
  };
}
