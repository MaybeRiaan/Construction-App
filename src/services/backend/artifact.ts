import type { LatLng, LeaderboardEntry, MachineColour, Place, PlaceSubmission, Spot, SubmissionReview, VehicleTypeId, VibeCheck } from '../../domain/types';
import { VEHICLE_BY_ID } from '../../data/vehicles';
import { communityPlaceId, parseReview, parseSubmission, placeFromSubmission, submissionWire } from '../../domain/contribute';
import { capability, type ArtifactDb, type ArtifactUser, type DbDocSnapshot } from '../artifactRuntime';
import { sampleCommunity } from './samples';
import type { Backend, CommunityState, PlayerStats } from './types';

/**
 * Shared prototype backend on the claude.ai artifact `db` capability.
 *
 * Layout (each viewer writes only their own docs, enforced by the
 * artifact's {self} rules; spots are a flat shared collection):
 *   spots/<spotId>      one public spot, with a ~320px thumbnail
 *   votes/<viewerId>    { ids: string[] }  the spots this viewer likes
 *   vibes/<viewerId>    { checks: [...] }  this viewer's vibe checks
 *   players/<viewerId>  { teamName, xp, spots, types }
 *   submissions/<viewerId>  { items: [...] }  places this viewer suggested;
 *                       readable by editors (admin) and the viewer only
 *   reviews/<submissionId>  { status, reason?, placeId? }  written by editors
 *   places/<placeId>    an approved place, written by editors
 *
 * Shared data is untrusted input: every field is validated on read and
 * rendered as plain text.
 */

const COLOURS = new Set(['yellow', 'orange', 'red', 'green', 'blue', 'white', 'other']);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

function readSpot(doc: DbDocSnapshot): Spot | null {
  const d = doc.data();
  if (!d) return null;
  const typeId = str(d.typeId, 40) as VehicleTypeId | undefined;
  const lat = num(d.lat);
  const lng = num(d.lng);
  const ownerId = str(d.ownerId, 120);
  if (!typeId || !VEHICLE_BY_ID[typeId] || lat == null || lng == null || !ownerId) return null;
  const photo = str(d.photo, 400_000);
  return {
    id: doc.id,
    typeId,
    nickname: str(d.nickname, 40),
    colour: COLOURS.has(String(d.colour)) ? (d.colour as MachineColour) : undefined,
    coordinate: { latitude: lat, longitude: lng },
    createdAt: str(d.createdAt, 40) ?? new Date(0).toISOString(),
    photo: photo && photo.startsWith('data:image/') ? photo : undefined,
    ownerId,
    teamName: str(d.teamName, 28),
    isPublic: true,
    area: str(d.area, 40),
  };
}

function readVibes(doc: DbDocSnapshot): VibeCheck[] {
  const d = doc.data();
  const list = Array.isArray(d?.checks) ? d.checks : [];
  const out: VibeCheck[] = [];
  for (const raw of list.slice(0, 200)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const score = num(r.score);
    const placeId = str(r.placeId, 120);
    if (!placeId || !score || score < 1 || score > 5) continue;
    out.push({
      id: `${doc.id}:${placeId}`,
      placeId,
      author: str(r.author, 40) || 'A parent',
      authorId: doc.id,
      score: Math.round(score) as VibeCheck['score'],
      tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string').slice(0, 8) : [],
      note: str(r.note, 280),
      createdAt: str(r.createdAt, 40) ?? new Date(0).toISOString(),
    });
  }
  return out;
}

/**
 * Serialises writes per document and coalesces bursts into the latest value.
 * Resolves whether the value landed; a value replaced before it was sent
 * reports the outcome of the one that replaced it.
 */
function writer(db: ArtifactDb) {
  const pending = new Map<string, { data: Record<string, unknown> | null; done: ((ok: boolean) => void)[] }>();
  const running = new Set<string>();
  async function pump(path: string) {
    if (running.has(path)) return;
    running.add(path);
    try {
      while (pending.has(path)) {
        const job = pending.get(path)!;
        pending.delete(path);
        let ok = true;
        try {
          if (job.data === null) await db.doc(path).delete();
          else await db.doc(path).set(job.data);
        } catch {
          // Refused or offline: the local copy is still the source of truth.
          ok = false;
        }
        job.done.forEach((d) => d(ok));
      }
    } finally {
      running.delete(path);
    }
  }
  return (path: string, data: Record<string, unknown> | null) =>
    new Promise<boolean>((resolve) => {
      pending.set(path, { data, done: [...(pending.get(path)?.done ?? []), resolve] });
      void pump(path);
    });
}

function readSubmissions(doc: DbDocSnapshot): PlaceSubmission[] {
  const items = doc.data()?.items;
  if (!Array.isArray(items)) return [];
  return items
    .slice(0, 30)
    .map(parseSubmission)
    .filter((s): s is PlaceSubmission => Boolean(s));
}

export function createArtifactBackend(): Backend {
  let db: ArtifactDb | null = null;
  let me: string | null = null;
  let write: ReturnType<typeof writer> | null = null;
  let lastPlayer = '';
  let canEdit = false;
  let canWrite: boolean | null = null;
  const ready = (async () => {
    db = await capability<ArtifactDb>('db');
    const user = await capability<ArtifactUser>('user');
    me = (await user?.id().catch(() => null)) ?? null;
    canEdit = (await user?.canEdit().catch(() => false)) ?? false;
    canWrite = (await user?.can('data.write').catch(() => null)) ?? null;
    if (db) write = writer(db);
    return Boolean(db && me);
  })();

  return {
    kind: 'artifact',
    start(center: LatLng, emit) {
      const samples = sampleCommunity(center);
      emit({ backend: 'artifact', status: 'connecting', ...samples });
      const unsubs: (() => void)[] = [];
      let alive = true;
      let remoteSpots: Spot[] = [];
      let remoteVotes: Record<string, number> = {};
      let remoteVibes: VibeCheck[] = [];
      let remotePlayers: LeaderboardEntry[] = [];
      let remotePlaces: Place[] = [];
      let remoteReviews: Record<string, SubmissionReview> = {};
      let remoteQueue: PlaceSubmission[] = [];

      const push = () => {
        const patch: Partial<CommunityState> = {
          spots: [...remoteSpots, ...samples.spots],
          votes: { ...samples.votes, ...remoteVotes },
          vibes: [...remoteVibes, ...samples.vibes],
          players: remotePlayers.length >= 3 ? remotePlayers : [...remotePlayers, ...samples.players],
          places: remotePlaces,
          reviews: remoteReviews,
          queue: remoteQueue.filter((s) => !remoteReviews[s.id]),
        };
        emit(patch);
      };

      ready.then((ok) => {
        if (!alive) return;
        if (!db) {
          emit({ status: 'local' });
          return;
        }
        emit({ status: ok ? 'live' : 'readonly', canReview: canEdit, canSubmit: ok && canWrite !== false });
        const onErr = () => emit({ status: 'readonly' });
        unsubs.push(
          db.collection('spots').orderBy('createdAt', 'desc').limit(300).onSnapshot((snap) => {
            remoteSpots = snap.docs.map(readSpot).filter((s): s is Spot => Boolean(s && s.ownerId !== me));
            push();
          }, onErr),
          db.collection('votes').onSnapshot((snap) => {
            const tally: Record<string, number> = {};
            for (const doc of snap.docs) {
              if (doc.id === me) continue;
              const ids = doc.data()?.ids;
              if (!Array.isArray(ids)) continue;
              for (const id of ids.slice(0, 500)) if (typeof id === 'string') tally[id] = (tally[id] ?? 0) + 1;
            }
            remoteVotes = Object.fromEntries(Object.entries(tally).map(([id, n]) => [id, n + (samples.votes[id] ?? 0)]));
            push();
          }, onErr),
          db.collection('vibes').onSnapshot((snap) => {
            remoteVibes = snap.docs.filter((d) => d.id !== me).flatMap(readVibes);
            push();
          }, onErr),
          db.collection('players').onSnapshot((snap) => {
            remotePlayers = snap.docs
              .filter((d) => d.id !== me)
              .map((d): LeaderboardEntry | null => {
                const x = d.data();
                if (!x) return null;
                return {
                  id: d.id,
                  teamName: str(x.teamName, 28) || 'Hunters',
                  xp: Math.max(0, Math.min(1_000_000, num(x.xp) ?? 0)),
                  spots: Math.max(0, num(x.spots) ?? 0),
                  types: Math.max(0, Math.min(20, num(x.types) ?? 0)),
                };
              })
              .filter((x): x is LeaderboardEntry => Boolean(x));
            push();
          }, onErr),
          db.collection('places').orderBy('createdAt', 'desc').limit(300).onSnapshot((snap) => {
            remotePlaces = snap.docs
              .map((d) => {
                const sub = parseSubmission(d.data());
                return sub ? placeFromSubmission(sub, d.id) : null;
              })
              .filter((p): p is Place => Boolean(p));
            push();
          }, onErr),
          db.collection('reviews').onSnapshot((snap) => {
            const next: Record<string, SubmissionReview> = {};
            for (const d of snap.docs) {
              const r = parseReview(d.id, d.data());
              if (r) next[d.id] = r;
            }
            remoteReviews = next;
            push();
          }, onErr),
        );
        // Everyone's suggestions, for editors reviewing them. Others can't read this path.
        if (canEdit)
          unsubs.push(
            db.collection('submissions').onSnapshot(
              (snap) => {
                remoteQueue = snap.docs.flatMap(readSubmissions).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
                push();
              },
              () => undefined,
            ),
          );
      });
      return () => {
        alive = false;
        unsubs.forEach((u) => u());
      };
    },

    async publishSpot(spot) {
      if (!(await ready) || !write || !me) return;
      void write(`spots/${spot.id}`, {
        typeId: spot.typeId,
        nickname: spot.nickname ?? null,
        colour: spot.colour ?? null,
        lat: spot.coordinate.latitude,
        lng: spot.coordinate.longitude,
        createdAt: spot.createdAt,
        photo: spot.photo ?? null,
        ownerId: me,
        teamName: spot.teamName ?? null,
        area: spot.area ?? null,
      });
    },
    async unpublishSpot(id) {
      if (!(await ready) || !write) return;
      void write(`spots/${id}`, null);
    },
    async syncVotes(ids) {
      if (!(await ready) || !write || !me) return;
      void write(`votes/${me}`, { ids: ids.slice(0, 500), updatedAt: new Date().toISOString() });
    },
    async syncVibes(vibes) {
      if (!(await ready) || !write || !me) return;
      void write(`vibes/${me}`, {
        checks: vibes.slice(0, 100).map((v) => ({
          placeId: v.placeId,
          score: v.score,
          tags: v.tags,
          note: v.note ?? null,
          author: v.author,
          createdAt: v.createdAt,
        })),
        updatedAt: new Date().toISOString(),
      });
    },
    async syncPlayer(stats: PlayerStats) {
      if (!(await ready) || !write || !me) return;
      const key = JSON.stringify(stats);
      if (key === lastPlayer) return;
      lastPlayer = key;
      void write(`players/${me}`, { ...stats, updatedAt: new Date().toISOString() });
    },
    async syncSubmissions(subs) {
      if (!(await ready) || !write || !me || canWrite === false) return [];
      const items = subs.slice(0, 30);
      const ok = await write(`submissions/${me}`, { items: items.map(submissionWire), updatedAt: new Date().toISOString() });
      return ok ? items.map((s) => s.id) : [];
    },
    async review(sub, verdict) {
      if (!(await ready) || !write || !canEdit) return false;
      const reviewedAt = new Date().toISOString();
      if (verdict.status === 'rejected') return write(`reviews/${sub.id}`, { status: 'rejected', reason: verdict.reason, reviewedAt });
      const placeId = communityPlaceId(sub.id);
      // Publish the place first, so an approval never points at a missing place.
      // It carries the review time, not when the parent added it (and so
      // perhaps when they were standing there).
      if (!(await write(`places/${placeId}`, { ...submissionWire(sub), createdAt: reviewedAt }))) return false;
      return write(`reviews/${sub.id}`, { status: 'approved', placeId, reviewedAt });
    },
    async resetLocal() {},
  };
}
