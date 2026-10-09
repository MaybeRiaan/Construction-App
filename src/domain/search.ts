import { CATEGORY_BY_ID } from '../data/categories';
import { distanceM, formatTravel, travelTime } from './geo';
import { openState, type OpenState } from './hours';
import type { AmenityId, CategoryId, LatLng, Place } from './types';
import { vibeScore } from './vibe';

export type SortMode = 'recommended' | 'distance' | 'vibe';
export type Setting = 'any' | 'indoor' | 'outdoor';

export interface Filters {
  categories: CategoryId[];
  intent: string | null;
  freeOnly: boolean;
  openNow: boolean;
  setting: Setting;
  ageFit: boolean;
  amenities: AmenityId[];
  goodVibesOnly: boolean;
  sort: SortMode;
}

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  intent: null,
  freeOnly: false,
  openNow: false,
  setting: 'any',
  ageFit: false,
  amenities: [],
  goodVibesOnly: false,
  sort: 'recommended',
};

/** Number of non-default filters, for the badge on the filter button. */
export function activeFilterCount(f: Filters): number {
  return (
    (f.freeOnly ? 1 : 0) +
    (f.openNow ? 1 : 0) +
    (f.setting !== 'any' ? 1 : 0) +
    (f.ageFit ? 1 : 0) +
    f.amenities.length +
    (f.goodVibesOnly ? 1 : 0) +
    (f.sort !== 'recommended' ? 1 : 0)
  );
}

export interface PlaceView extends Place {
  distanceM: number;
  travel: string;
  travelMinutes: number;
  vibe: number | null;
  open: OpenState;
}

export function decorate(places: Place[], origin: LatLng, now = new Date()): PlaceView[] {
  return places.map((p) => {
    const d = distanceM(origin, p.coordinate);
    return {
      ...p,
      distanceM: d,
      travel: formatTravel(d),
      travelMinutes: travelTime(d).minutes,
      vibe: p.stats && p.stats.count > 0 ? vibeScore(p.stats.avg) : null,
      open: openState(p.hours, now),
    };
  });
}

function matchesIntent(p: PlaceView, intent: string | null): boolean {
  switch (intent) {
    case 'energy':
      return ['playgrounds', 'indoor', 'water'].includes(p.category) || p.keywords?.includes('scooter') === true;
    case 'rainy':
      return p.indoor || p.amenities.includes('covered');
    case 'free':
      return p.price === 0;
    case 'quick':
      return p.travelMinutes <= 10;
    case 'little':
      return p.ages[0] <= 2 && (p.amenities.includes('fenced') || p.stats?.topTags.includes('toddlers') === true);
    case 'calm':
      return ['books', 'walks', 'parks', 'animals'].includes(p.category) && !(p.stats?.topTags.includes('busy') ?? false);
    default:
      return true;
  }
}

function fitsAges(p: Place, ages: number[]): boolean {
  if (!ages.length) return true;
  return ages.some((a) => a >= p.ages[0] && a <= p.ages[1]);
}

const normalise = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Keyword relevance: 0 means no match. */
export function keywordScore(p: Place, query: string): number {
  const q = normalise(query).trim();
  if (!q) return 1;
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (!tokens.length) return 1;
  const fields: [string, number][] = [
    [normalise(p.name), 6],
    [normalise(CATEGORY_BY_ID[p.category].label), 4],
    [normalise((p.keywords ?? []).join(' ')), 4],
    [normalise(p.area ?? ''), 2],
    [normalise(p.blurb ?? ''), 2],
    [normalise(p.description ?? ''), 1],
    [normalise((p.highlights ?? []).join(' ')), 1],
  ];
  let score = 0;
  for (const t of tokens) {
    let best = 0;
    for (const [text, w] of fields) if (text.includes(t)) best = Math.max(best, w);
    if (best === 0) return 0;
    score += best;
  }
  return score;
}

export interface Query {
  filters: Filters;
  radiusKm: number;
  kidAges: number[];
  text?: string;
}

export function search(list: PlaceView[], q: Query): PlaceView[] {
  const f = q.filters;
  const maxM = q.radiusKm * 1000;
  const scored: { p: PlaceView; s: number }[] = [];
  for (const p of list) {
    if (p.distanceM > maxM) continue;
    if (f.categories.length && !f.categories.includes(p.category)) continue;
    if (!matchesIntent(p, f.intent)) continue;
    if (f.freeOnly && p.price !== 0) continue;
    if (f.openNow && !p.open.open) continue;
    if (f.setting === 'indoor' && !p.indoor) continue;
    if (f.setting === 'outdoor' && p.indoor) continue;
    if (f.ageFit && !fitsAges(p, q.kidAges)) continue;
    if (f.amenities.length && !f.amenities.every((a) => p.amenities.includes(a))) continue;
    if (f.goodVibesOnly && (p.vibe ?? 0) < 70) continue;
    const k = keywordScore(p, q.text ?? '');
    if (k === 0) continue;
    // Sponsorship never changes organic ranking; it only earns the Featured row and a labelled pin.
    const proximity = 100 * (1 - Math.min(1, p.distanceM / Math.max(maxM, 1)));
    const s = (p.vibe ?? 60) * 0.55 + proximity * 0.35 + (p.open.open ? 8 : 0) + Math.min(k, 12);
    scored.push({ p, s });
  }
  if (f.sort === 'distance') scored.sort((a, b) => a.p.distanceM - b.p.distanceM);
  else if (f.sort === 'vibe') scored.sort((a, b) => (b.p.vibe ?? 0) - (a.p.vibe ?? 0) || a.p.distanceM - b.p.distanceM);
  else scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.p);
}

export function featured(list: PlaceView[], radiusKm: number): PlaceView[] {
  return list
    .filter((p) => p.sponsored && p.distanceM <= radiusKm * 1000)
    .sort((a, b) => (a.sponsored?.tier === 'spotlight' ? -1 : 0) - (b.sponsored?.tier === 'spotlight' ? -1 : 0) || a.distanceM - b.distanceM);
}

export function upcomingEvents(list: PlaceView[], radiusKm: number, withinDays = 10) {
  const now = Date.now();
  const limit = now + withinDays * 86400000;
  return list
    .filter((p) => p.distanceM <= radiusKm * 1000)
    .flatMap((p) => (p.events ?? []).map((e) => ({ event: e, place: p })))
    .filter(({ event }) => {
      const t = new Date(event.startsAt).getTime();
      return t + event.durationMin * 60000 > now && t < limit;
    })
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
}

export function countByCategory(list: PlaceView[], radiusKm: number): Partial<Record<CategoryId, number>> {
  const out: Partial<Record<CategoryId, number>> = {};
  for (const p of list) if (p.distanceM <= radiusKm * 1000) out[p.category] = (out[p.category] ?? 0) + 1;
  return out;
}
