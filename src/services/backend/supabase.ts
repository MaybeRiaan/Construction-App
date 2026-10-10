import { AMENITIES, CATEGORY_BY_ID } from '../../data/categories';
import { VEHICLE_BY_ID } from '../../data/vehicles';
import { parseReview, parseSubmission } from '../../domain/contribute';
import { offset } from '../../domain/geo';
import type { AmenityId, CategoryId, LatLng, LeaderboardEntry, MachineColour, Place, PlaceSubmission, Spot, SubmissionReview, VehicleTypeId, VibeCheck } from '../../domain/types';
import { getSession, rest } from '../supabaseRest';
import type { Backend, CommunityState, PlayerStats } from './types';

/**
 * Production backend on Supabase (schema in supabase/migrations). Polls every
 * 30 s; swap to realtime channels when traffic justifies it.
 */

interface SpotRow {
  id: string;
  user_id: string;
  vehicle_type: string;
  nickname: string | null;
  colour: string | null;
  lat: number;
  lng: number;
  photo_url: string | null;
  team_name: string | null;
  area: string | null;
  created_at: string;
}

interface VibeRow {
  id: string;
  place_id: string;
  user_id: string;
  score: number;
  tags: string[] | null;
  note: string | null;
  author_label: string | null;
  created_at: string;
}

interface LeaderRow {
  user_id: string;
  team_name: string;
  xp: number;
  spots: number;
  types: number;
}

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  area: string | null;
  address: string | null;
  blurb: string | null;
  amenities: string[] | null;
  age_min: number;
  age_max: number;
  price: number;
  indoor: boolean;
  website: string | null;
  added_by: string | null;
}

interface SubmissionRow {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  ages: string[] | null;
  amenities: string[] | null;
  price: number;
  indoor: boolean;
  tip: string | null;
  website: string | null;
  author_label: string | null;
  status: string;
  reason: string | null;
  place_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const AMENITY_IDS = new Set<string>(AMENITIES.map((a) => a.id));

function placeFromRow(r: PlaceRow): Place | null {
  if (!CATEGORY_BY_ID[r.category as CategoryId] || !Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return null;
  let seed = 0;
  for (let i = 0; i < r.id.length; i++) seed = (seed * 31 + r.id.charCodeAt(i)) % 100000;
  return {
    id: r.id,
    source: 'community',
    name: r.name,
    category: r.category as CategoryId,
    coordinate: { latitude: r.lat, longitude: r.lng },
    area: r.area ?? undefined,
    address: r.address ?? undefined,
    blurb: r.blurb ?? undefined,
    amenities: (r.amenities ?? []).filter((a): a is AmenityId => AMENITY_IDS.has(a)),
    ages: [r.age_min, r.age_max],
    price: r.price > 0 ? 1 : 0,
    indoor: r.indoor,
    website: r.website ?? undefined,
    addedBy: r.added_by ?? undefined,
    keywords: ['added by a parent'],
    coverSeed: seed,
  };
}

function submissionFromRow(r: SubmissionRow): PlaceSubmission | null {
  return parseSubmission({ ...r, author: r.author_label, createdAt: r.created_at });
}

/** Bounding box of `km` around a point, for PostgREST range filters. */
function box(center: LatLng, km: number): string {
  const sw = offset(center, -km * 1000, -km * 1000);
  const ne = offset(center, km * 1000, km * 1000);
  return `lat=gte.${sw.latitude.toFixed(5)}&lat=lte.${ne.latitude.toFixed(5)}&lng=gte.${sw.longitude.toFixed(5)}&lng=lte.${ne.longitude.toFixed(5)}`;
}

const POLL_MS = 30_000;

export function createSupabaseBackend(): Backend {
  let sentVotes = new Set<string>();

  return {
    kind: 'supabase',
    start(center, emit) {
      emit({ backend: 'supabase', status: 'connecting', spots: [], votes: {}, vibes: [], players: [] });
      let alive = true;
      const loadPlaces = async (me: string | null) => {
        try {
          const [places, mine, moderator, ledger] = await Promise.all([
            rest<PlaceRow[]>(`places?select=id,name,category,lat,lng,area,address,blurb,amenities,age_min,age_max,price,indoor,website,added_by&source=eq.community&${box(center, 50)}&limit=500`),
            me ? rest<SubmissionRow[]>(`place_submissions?select=*&user_id=eq.${me}&order=created_at.desc&limit=100`) : Promise.resolve([]),
            me ? rest<boolean>('rpc/is_moderator', { method: 'POST', body: '{}' }).catch(() => false) : Promise.resolve(false),
            me ? rest<{ points: number }[]>('points_ledger?select=points').catch(() => null) : Promise.resolve(null),
          ]);
          const queueRows = moderator ? await rest<SubmissionRow[]>('place_submissions?select=*&status=eq.pending&order=created_at.asc&limit=100') : [];
          if (!alive) return;
          const reviews: Record<string, SubmissionReview> = {};
          for (const r of mine) {
            const review = r.status === 'pending' ? null : parseReview(r.id, { status: r.status, reason: r.reason, placeId: r.place_id, reviewedAt: r.reviewed_at });
            if (review) reviews[r.id] = review;
          }
          const patch: Partial<CommunityState> = {
            places: places.map(placeFromRow).filter((p): p is Place => Boolean(p)),
            reviews,
            queue: queueRows.map(submissionFromRow).filter((x): x is PlaceSubmission => Boolean(x)),
            canReview: moderator === true,
            canSubmit: Boolean(me),
            points: ledger ? ledger.reduce((t, l) => t + l.points, 0) : undefined,
          };
          emit(patch);
        } catch {
          // Places from other parents are optional; the rest keeps working.
        }
      };
      const load = async () => {
        try {
          const me = (await getSession())?.user_id ?? null;
          void loadPlaces(me);
          const [spots, counts, vibes, leaders] = await Promise.all([
            rest<SpotRow[]>('public_spots?select=*&order=created_at.desc&limit=300'),
            rest<{ spot_id: string; votes: number }[]>('spot_vote_counts?select=spot_id,votes'),
            rest<VibeRow[]>('vibe_checks?select=id,place_id,user_id,score,tags,note,author_label,created_at&order=created_at.desc&limit=500'),
            rest<LeaderRow[]>('leaderboard_weekly?select=*&limit=50'),
          ]);
          if (!alive) return;
          emit({
            status: me ? 'live' : 'readonly',
            spots: spots
              .filter((r) => r.user_id !== me && VEHICLE_BY_ID[r.vehicle_type as VehicleTypeId])
              .map(
                (r): Spot => ({
                  id: r.id,
                  typeId: r.vehicle_type as VehicleTypeId,
                  nickname: r.nickname ?? undefined,
                  colour: (r.colour as MachineColour) ?? undefined,
                  coordinate: { latitude: r.lat, longitude: r.lng },
                  photo: r.photo_url ?? undefined,
                  ownerId: r.user_id,
                  teamName: r.team_name ?? undefined,
                  area: r.area ?? undefined,
                  isPublic: true,
                  createdAt: r.created_at,
                }),
              ),
            votes: Object.fromEntries(counts.map((c) => [c.spot_id, c.votes - (sentVotes.has(c.spot_id) ? 1 : 0)])),
            vibes: vibes
              .filter((v) => v.user_id !== me)
              .map(
                (v): VibeCheck => ({
                  id: v.id,
                  placeId: v.place_id,
                  author: v.author_label ?? 'A parent',
                  authorId: v.user_id,
                  score: Math.max(1, Math.min(5, v.score)) as VibeCheck['score'],
                  tags: v.tags ?? [],
                  note: v.note ?? undefined,
                  createdAt: v.created_at,
                }),
              ),
            players: leaders
              .filter((l) => l.user_id !== me)
              .map((l): LeaderboardEntry => ({ id: l.user_id, teamName: l.team_name, xp: l.xp, spots: l.spots, types: l.types })),
          });
        } catch {
          if (alive) emit({ status: 'readonly' });
        }
      };
      void load();
      const t = setInterval(load, POLL_MS);
      return () => {
        alive = false;
        clearInterval(t);
      };
    },

    async publishSpot(spot) {
      const s = await getSession();
      if (!s) return;
      await rest('spots', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify({
          id: spot.id,
          user_id: s.user_id,
          vehicle_type: spot.typeId,
          nickname: spot.nickname ?? null,
          colour: spot.colour ?? null,
          lat: spot.coordinate.latitude,
          lng: spot.coordinate.longitude,
          photo_data: spot.photo ?? null,
          team_name: spot.teamName ?? null,
          area: spot.area ?? null,
          is_public: spot.isPublic,
          created_at: spot.createdAt,
        }),
      }).catch(() => undefined);
    },
    async unpublishSpot(id) {
      await rest(`spots?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);
    },
    async syncVotes(ids) {
      const s = await getSession();
      if (!s) return;
      const next = new Set(ids);
      const added = ids.filter((id) => !sentVotes.has(id));
      const removed = [...sentVotes].filter((id) => !next.has(id));
      sentVotes = next;
      if (added.length)
        await rest('spot_votes', {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates',
          body: JSON.stringify(added.map((spot_id) => ({ spot_id, user_id: s.user_id }))),
        }).catch(() => undefined);
      for (const id of removed)
        await rest(`spot_votes?spot_id=eq.${encodeURIComponent(id)}&user_id=eq.${s.user_id}`, { method: 'DELETE' }).catch(() => undefined);
    },
    async syncVibes(vibes) {
      const s = await getSession();
      if (!s || !vibes.length) return;
      await rest('vibe_checks?on_conflict=place_id,user_id', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify(
          vibes.slice(0, 100).map((v) => ({
            place_id: v.placeId,
            user_id: s.user_id,
            score: v.score,
            tags: v.tags,
            note: v.note ?? null,
            author_label: v.author,
            created_at: v.createdAt,
          })),
        ),
      }).catch(() => undefined);
    },
    async syncPlayer(stats: PlayerStats) {
      const s = await getSession();
      if (!s) return;
      await rest('players', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify({ user_id: s.user_id, team_name: stats.teamName, xp: stats.xp, spots: stats.spots, types: stats.types }),
      }).catch(() => undefined);
    },
    async syncSubmissions(subs) {
      const s = await getSession();
      if (!s || !subs.length) return [];
      try {
        await rest('place_submissions', {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates',
          body: JSON.stringify(
            subs.map((x) => ({
              id: x.id,
              user_id: s.user_id,
              name: x.name.trim(),
              category: x.category,
              lat: x.coordinate.latitude,
              lng: x.coordinate.longitude,
              ages: x.ages,
              amenities: x.amenities,
              price: x.price,
              indoor: x.indoor,
              tip: x.tip?.trim() || null,
              website: x.website?.trim() || null,
              author_label: x.author,
              created_at: x.createdAt,
            })),
          ),
        });
        return subs.map((x) => x.id);
      } catch {
        return [];
      }
    },
    async review(sub, verdict) {
      try {
        await rest('rpc/review_place_submission', {
          method: 'POST',
          body: JSON.stringify({ submission_id: sub.id, verdict: verdict.status, reject_reason: verdict.status === 'rejected' ? verdict.reason : null }),
        });
        return true;
      } catch {
        return false;
      }
    },
    async resetLocal() {},
  };
}
