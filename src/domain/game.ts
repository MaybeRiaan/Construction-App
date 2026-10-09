import { CHALLENGES, LEVELS, type ChallengeDef } from '../data/challenges';
import { RARITY, VEHICLES, VEHICLE_BY_ID } from '../data/vehicles';
import type { HuntSession, Kid, Spot, VehicleTypeId } from './types';

// ---------------------------------------------------------------------------
// Time helpers (local time; a "day" is the family's day, not UTC)

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Weeks start on Monday. */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function weekKey(d: Date): string {
  return `w${dayKey(startOfWeek(d))}`;
}

export function periodKey(def: ChallengeDef, now: Date): string {
  if (def.cadence === 'daily') return dayKey(now);
  if (def.cadence === 'weekly') return weekKey(now);
  return 'once';
}

/** FNV-1a: small, stable string hash for seeding daily content. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Daily mission & weekly bingo

const EVERYDAY: VehicleTypeId[] = VEHICLES.filter((v) => v.rarity === 'common' || v.rarity === 'uncommon').map((v) => v.id);

export function dailyMissionType(now: Date): VehicleTypeId {
  return EVERYDAY[hashString(dayKey(now)) % EVERYDAY.length];
}

export type BingoCell = VehicleTypeId | 'free';

/** A 3×3 card that changes every Monday. The centre square is free. */
export function bingoCard(now: Date): BingoCell[] {
  const rand = seeded(hashString(weekKey(now)));
  const commons = shuffle(EVERYDAY, rand).slice(0, 7);
  const rares = shuffle(VEHICLES.filter((v) => v.rarity === 'rare').map((v) => v.id), rand).slice(0, 1);
  const picks = shuffle([...commons, ...rares], rand);
  return [...picks.slice(0, 4), 'free', ...picks.slice(4, 8)];
}

export const BINGO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function bingoState(card: BingoCell[], spottedThisWeek: Set<VehicleTypeId>) {
  const filled = card.map((cell) => cell === 'free' || spottedThisWeek.has(cell));
  const lines = BINGO_LINES.filter((line) => line.every((i) => filled[i]));
  const best = Math.max(...BINGO_LINES.map((line) => line.filter((i) => filled[i]).length));
  return { filled, lines, best };
}

// ---------------------------------------------------------------------------
// XP and levels

export const FIRST_OF_TYPE_BONUS = 25;
export const PHOTO_BONUS = 5;
export const NAME_BONUS = 5;

export function spotXp(spot: Pick<Spot, 'typeId' | 'photo' | 'nickname'>, firstOfType: boolean): number {
  const base = RARITY[VEHICLE_BY_ID[spot.typeId].rarity].xp;
  return base + (firstOfType ? FIRST_OF_TYPE_BONUS : 0) + (spot.photo ? PHOTO_BONUS : 0) + (spot.nickname ? NAME_BONUS : 0);
}

export function sortByTime<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function spotsXp(spots: Spot[]): number {
  const seen = new Set<VehicleTypeId>();
  let xp = 0;
  for (const s of sortByTime(spots)) {
    xp += spotXp(s, !seen.has(s.typeId));
    seen.add(s.typeId);
  }
  return xp;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  floor: number;
  next: number | null;
  nextTitle: string | null;
  progress: number;
}

export function levelFor(xp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) idx = i;
  const cur = LEVELS[idx];
  const nxt = LEVELS[idx + 1] ?? null;
  const progress = nxt ? (xp - cur.xp) / (nxt.xp - cur.xp) : 1;
  return {
    level: cur.level,
    title: cur.title,
    xp,
    floor: cur.xp,
    next: nxt?.xp ?? null,
    nextTitle: nxt?.title ?? null,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

// ---------------------------------------------------------------------------
// Challenges

export interface GameContext {
  spots: Spot[];
  hunts: HuntSession[];
  now: Date;
}

export interface ChallengeProgress {
  progress: number;
  target: number;
  done: boolean;
  /** Short status line, e.g. "Spot a cement mixer". */
  detail?: string;
}

function since(spots: Spot[], from: Date): Spot[] {
  const t = from.toISOString();
  return spots.filter((s) => s.createdAt >= t);
}

function activeDays(ctx: GameContext): string[] {
  const days = new Set<string>();
  for (const s of ctx.spots) days.add(dayKey(new Date(s.createdAt)));
  for (const h of ctx.hunts) days.add(dayKey(new Date(h.startedAt)));
  return [...days].sort();
}

export function longestStreak(days: string[]): number {
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of days) {
    const [y, m, d] = key.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    if (prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

export function evaluateChallenge(def: ChallengeDef, ctx: GameContext): ChallengeProgress {
  const { spots, now } = ctx;
  const distinct = (list: Spot[]) => new Set(list.map((s) => s.typeId)).size;
  const clamp = (n: number) => Math.min(n, def.target);
  switch (def.kind) {
    case 'firstSpot':
      return { progress: clamp(spots.length), target: def.target, done: spots.length >= 1 };
    case 'distinctTypes': {
      const n = distinct(spots);
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'typeCount': {
      const n = spots.filter((s) => def.types?.includes(s.typeId)).length;
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'set': {
      const have = new Set(spots.map((s) => s.typeId));
      const n = (def.types ?? []).filter((t) => have.has(t)).length;
      return { progress: n, target: def.target, done: n >= def.target };
    }
    case 'daily': {
      const type = dailyMissionType(now);
      const today = since(spots, startOfDay(now));
      const done = today.some((s) => s.typeId === type);
      return { progress: done ? 1 : 0, target: 1, done, detail: `Spot a ${VEHICLE_BY_ID[type].name.toLowerCase()}` };
    }
    case 'colours': {
      const n = new Set(spots.map((s) => s.colour).filter((c) => c && c !== 'other')).size;
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'named': {
      const n = spots.filter((s) => s.nickname && !s.foundOf).length;
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'famous': {
      const n = new Set(spots.filter((s) => s.foundOf).map((s) => s.foundOf)).size;
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'legendary': {
      const n = spots.filter((s) => VEHICLE_BY_ID[s.typeId].rarity === 'legendary').length;
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'streak': {
      const n = longestStreak(activeDays(ctx));
      return { progress: clamp(n), target: def.target, done: n >= def.target };
    }
    case 'bingo': {
      const card = bingoCard(now);
      const week = new Set(since(spots, startOfWeek(now)).map((s) => s.typeId));
      const state = bingoState(card, week);
      return { progress: state.best, target: 3, done: state.lines.length > 0, detail: `${state.best} of 3 in a line` };
    }
    default:
      return { progress: 0, target: def.target, done: false };
  }
}

export interface ChallengeStatus extends ChallengeProgress {
  def: ChallengeDef;
  period: string;
  claimed: boolean;
}

export function allChallenges(ctx: GameContext, claimed: Record<string, string>): ChallengeStatus[] {
  return CHALLENGES.map((def) => {
    const period = periodKey(def, ctx.now);
    const p = evaluateChallenge(def, ctx);
    return { ...p, def, period, claimed: Boolean(claimed[`${def.id}@${period}`]) };
  });
}

/** Challenges that are complete now but haven't been claimed for this period yet. */
export function newlyCompleted(ctx: GameContext, claimed: Record<string, string>): ChallengeStatus[] {
  return allChallenges(ctx, claimed).filter((c) => c.done && !c.claimed);
}

export function claimedXp(claimed: Record<string, string>): number {
  let xp = 0;
  for (const key of Object.keys(claimed)) {
    const id = key.split('@')[0];
    const def = CHALLENGES.find((c) => c.id === id);
    if (def) xp += def.xp;
  }
  return xp;
}

// ---------------------------------------------------------------------------
// Family race: first to 10 different machines

export interface RaceLane {
  kid: Kid;
  types: number;
  latest?: string;
}

export function familyRace(kids: Kid[], spots: Spot[]): RaceLane[] {
  return kids
    .map((kid) => {
      const mine = spots.filter((s) => s.kidId === kid.id);
      const latest = sortByTime(mine).at(-1)?.createdAt;
      return { kid, types: new Set(mine.map((s) => s.typeId)).size, latest };
    })
    .sort((a, b) => b.types - a.types || (a.latest ?? '').localeCompare(b.latest ?? ''));
}
