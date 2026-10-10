import { AMENITIES } from '../data/categories';
import { ADDABLE_CATEGORIES, LOVED, REJECT_REASONS, SCOUT_POINTS, SCOUT_RANKS } from '../data/scouts';
import { AGE_BANDS } from '../data/vibes';
import { distanceM } from './geo';
import type { AgeBand, AmenityId, CategoryId, LatLng, Place, PlaceSubmission, RejectReason, SubmissionReview, VibeCheck } from './types';

/**
 * "For parents, by parents": parents add places, a reviewer checks each one,
 * and approved places go on the map for every family.
 */

export interface DraftFields {
  name: string;
  category: CategoryId | null;
  ages: AgeBand[];
  website?: string;
}

/** How a parent is shown to other families: "Parent of a 4yo", "Parent of 2". Never a name. */
export function parentLabel(kidAges: number[]): string {
  if (!kidAges.length) return 'A parent';
  return `Parent of ${kidAges.length === 1 ? `a ${kidAges[0]}yo` : kidAges.length}`;
}

/** The first thing stopping a new place from being sent, or null when it's ready. */
export function draftProblem(d: DraftFields): string | null {
  if (d.name.trim().length < 3) return 'Give it a name';
  if (!d.category) return 'Pick what kind of place it is';
  if (!d.ages.length) return 'Pick who it’s great for';
  const web = d.website?.trim();
  if (web && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(web)) return 'Check the website address';
  return null;
}

/** Words that say what a place is rather than which one it is. */
const GENERIC = new Set([
  'the', 'a', 'an', 'and', 'of', 'at', 'on', 'in', 'by', 's',
  'park', 'parks', 'playground', 'play', 'area', 'reserve', 'garden', 'gardens', 'cafe', 'library', 'centre', 'center', 'pool', 'beach', 'museum', 'kids', 'children', 'local',
]);

function words(name: string): Set<string> {
  const plain = name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, ' ');
  return new Set(plain.split(' ').filter((w) => w && !GENERIC.has(w)));
}

/** How alike two names are, and whether one is contained in the other. */
function nameOverlap(a: string, b: string): { share: number; contained: boolean } {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) {
    const same = a.trim().toLowerCase() === b.trim().toLowerCase();
    return { share: same ? 1 : 0, contained: same };
  }
  let shared = 0;
  wa.forEach((w) => {
    if (wb.has(w)) shared++;
  });
  return { share: shared / Math.max(wa.size, wb.size), contained: shared === Math.min(wa.size, wb.size) };
}

/**
 * Places that are probably the one being added: a similar name nearby, a name
 * contained in the other close by, or the same kind of place almost on top of it.
 */
export function likelyDuplicates(draft: { name: string; category: CategoryId | null; coordinate: LatLng }, places: Place[], limit = 3): { place: Place; distanceM: number }[] {
  const out: { place: Place; distanceM: number }[] = [];
  const named = draft.name.trim().length >= 3;
  for (const p of places) {
    const d = distanceM(draft.coordinate, p.coordinate);
    if (d > 400) continue;
    const o = named ? nameOverlap(draft.name, p.name) : { share: 0, contained: false };
    const sameSpot = draft.category === p.category && d <= 60;
    if (o.share >= 0.6 || (o.contained && d <= 150) || sameSpot) out.push({ place: p, distanceM: d });
  }
  return out.sort((a, b) => a.distanceM - b.distanceM).slice(0, limit);
}

/** Age range covering the chosen bands (0–12 when none are chosen). */
export function ageRangeFor(bands: AgeBand[]): [number, number] {
  const ranges = AGE_BANDS.filter((b) => bands.includes(b.id)).map((b) => b.range);
  if (!ranges.length) return [0, 12];
  return [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))];
}

/** Id of the place an approved submission becomes. */
export function communityPlaceId(submissionId: string): string {
  return `community_${submissionId}`;
}

function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Math.abs(h) % 100000;
}

/** The map place an approved submission becomes. */
export function placeFromSubmission(s: PlaceSubmission, id = communityPlaceId(s.id)): Place {
  return {
    id,
    source: 'community',
    name: s.name.trim(),
    category: s.category,
    coordinate: s.coordinate,
    blurb: s.tip?.trim() || undefined,
    amenities: [...new Set(s.amenities)],
    ages: ageRangeFor(s.ages),
    price: s.price,
    indoor: s.indoor,
    website: s.website?.trim() || undefined,
    addedBy: s.author,
    keywords: ['added by a parent'],
    coverSeed: seedOf(id),
  };
}

/** Other families rate it a vibe. The submitter's own check and sample checks don't count. */
export function isLoved(checks: VibeCheck[]): boolean {
  const others = checks.filter((c) => c.authorId && !c.sample);
  if (others.length < LOVED.checks) return false;
  return others.reduce((sum, c) => sum + c.score, 0) / others.length >= LOVED.avg;
}

export interface PointsLine {
  key: string;
  label: string;
  points: number;
  at: string;
}

/** Scout points from your approved places and how other families rate them. */
export function scoutPoints(
  mine: PlaceSubmission[],
  reviews: Record<string, SubmissionReview>,
  checksFor: (placeId: string) => VibeCheck[],
): { total: number; lines: PointsLine[] } {
  const lines: PointsLine[] = [];
  for (const s of mine) {
    const r = reviews[s.id];
    if (r?.status !== 'approved') continue;
    const name = s.name.trim();
    lines.push({ key: `${s.id}:added`, label: `${name} went live`, points: SCOUT_POINTS.added, at: r.reviewedAt });
    const checks = r.placeId ? checksFor(r.placeId) : [];
    if (isLoved(checks)) {
      const latest = checks.reduce((t, c) => (c.createdAt > t ? c.createdAt : t), r.reviewedAt);
      lines.push({ key: `${s.id}:loved`, label: `Families love ${name}`, points: SCOUT_POINTS.loved, at: latest });
    }
  }
  lines.sort((a, b) => b.at.localeCompare(a.at));
  return { total: lines.reduce((t, l) => t + l.points, 0), lines };
}

export function scoutRank(points: number): { title: string; min: number; next: { min: number; title: string } | null } {
  let current = SCOUT_RANKS[0];
  for (const r of SCOUT_RANKS) if (points >= r.min) current = r;
  return { title: current.title, min: current.min, next: SCOUT_RANKS.find((r) => r.min > points) ?? null };
}

export type SubmissionState = 'local' | 'pending' | 'approved' | 'rejected';

/** Where a submission stands, as far as this device knows. */
export function submissionState(s: PlaceSubmission, reviews: Record<string, SubmissionReview>, sent: boolean): SubmissionState {
  const r = reviews[s.id];
  if (r) return r.status;
  return sent ? 'pending' : 'local';
}

// ---- shared-data wire format ----------------------------------------------

/** A submission as stored in a shared backend (flat JSON, no nested objects). */
export function submissionWire(s: PlaceSubmission): Record<string, unknown> {
  return {
    id: s.id,
    name: s.name.trim(),
    category: s.category,
    lat: s.coordinate.latitude,
    lng: s.coordinate.longitude,
    ages: s.ages,
    amenities: s.amenities,
    price: s.price,
    indoor: s.indoor,
    tip: s.tip?.trim() || null,
    website: s.website?.trim() || null,
    author: s.author,
    createdAt: s.createdAt,
  };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const BANDS = new Set<string>(AGE_BANDS.map((b) => b.id));
const AMENITY_IDS = new Set<string>(AMENITIES.map((a) => a.id));
const CATEGORY_IDS = new Set<string>(ADDABLE_CATEGORIES);
const REASONS = new Set<string>(REJECT_REASONS.map((r) => r.id));

/** Read a submission from shared data, which is untrusted: every field is checked. */
export function parseSubmission(raw: unknown): PlaceSubmission | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 64);
  const name = str(r.name, 60)?.trim();
  const lat = num(r.lat);
  const lng = num(r.lng);
  if (!id || !/^[\w-]+$/.test(id) || !name || name.length < 3 || !CATEGORY_IDS.has(String(r.category))) return null;
  if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const list = (v: unknown, ok: Set<string>) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && ok.has(x)))] : []);
  const website = str(r.website, 200)?.trim();
  return {
    id,
    name,
    category: r.category as CategoryId,
    coordinate: { latitude: lat, longitude: lng },
    ages: list(r.ages, BANDS) as AgeBand[],
    amenities: list(r.amenities, AMENITY_IDS) as AmenityId[],
    price: r.price === 1 ? 1 : 0,
    indoor: r.indoor === true,
    tip: str(r.tip, 280)?.trim() || undefined,
    website: website && /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(website) ? website : undefined,
    author: str(r.author, 40)?.trim() || 'A parent',
    createdAt: str(r.createdAt, 40) ?? new Date(0).toISOString(),
  };
}

/** Read a review decision from shared data. */
export function parseReview(submissionId: string, raw: unknown): SubmissionReview | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.status !== 'approved' && r.status !== 'rejected') return null;
  const reason = str(r.reason, 40);
  return {
    submissionId,
    status: r.status,
    reason: reason && REASONS.has(reason) ? (reason as RejectReason) : undefined,
    placeId: str(r.placeId, 120),
    reviewedAt: str(r.reviewedAt, 40) ?? new Date(0).toISOString(),
  };
}

/** A link a parent typed, made safe to open. */
export function websiteUrl(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}
