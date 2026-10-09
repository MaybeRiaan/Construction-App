import { VEHICLE_BY_ID } from '../../data/vehicles';
import type { LeaderboardEntry, MachineColour, Spot, VehicleTypeId, VibeCheck } from '../../domain/types';
import { getSession, rest } from '../supabaseRest';
import type { Backend, PlayerStats } from './types';

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

const POLL_MS = 30_000;

export function createSupabaseBackend(): Backend {
  let sentVotes = new Set<string>();

  return {
    kind: 'supabase',
    start(_center, emit) {
      emit({ backend: 'supabase', status: 'connecting', spots: [], votes: {}, vibes: [], players: [] });
      let alive = true;
      const load = async () => {
        try {
          const me = (await getSession())?.user_id ?? null;
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
  };
}
