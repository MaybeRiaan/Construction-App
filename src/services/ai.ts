import { hasSupabase } from '../config';
import { CATEGORY_BY_ID } from '../data/categories';
import { VEHICLES } from '../data/vehicles';
import { formatDistance } from '../domain/geo';
import type { PlaceView } from '../domain/search';
import type { MachineColour, VehicleTypeId } from '../domain/types';
import { capability, isSampleError, type ArtifactSample } from './artifactRuntime';
import type { PhotoAsset } from './photo';
import { callFunction } from './supabaseRest';

/**
 * Two AI helpers:
 * - identifyVehicle: "What machine is this?" from a photo, plus a child-safety
 *   check for people in the shot.
 * - askPlaydar: natural-language search over nearby places.
 *
 * Providers, in order: the claude.ai artifact runtime (web prototype), the
 * Supabase edge functions (production, calling the Claude API), or none, in
 * which case the UI falls back to manual picking and keyword search.
 */

export interface VehicleGuess {
  typeId: VehicleTypeId | null;
  confidence: number;
  colour?: MachineColour;
  funFact?: string;
  isMachine: boolean;
  hasPeople: boolean;
}

export interface AskPick {
  placeId: string;
  why: string;
}

export interface AskResult {
  answer: string;
  picks: AskPick[];
}

export type AiProvider = 'artifact' | 'supabase' | null;

export interface AiStatus {
  provider: AiProvider;
  vision: boolean;
  ask: boolean;
}

export class AiUnavailableError extends Error {
  constructor(public reason: 'declined' | 'unavailable' | 'busy' | 'failed') {
    super(reason);
  }
}

let statusPromise: Promise<AiStatus> | null = null;

export function aiStatus(): Promise<AiStatus> {
  if (!statusPromise) {
    statusPromise = (async (): Promise<AiStatus> => {
      const sample = await capability<ArtifactSample>('sample');
      if (sample) {
        const limits = await sample.limits().catch(() => null);
        return { provider: 'artifact', vision: Boolean(limits?.images), ask: true };
      }
      if (hasSupabase) return { provider: 'supabase', vision: true, ask: true };
      return { provider: null, vision: false, ask: false };
    })();
  }
  return statusPromise;
}

const TYPE_LIST = VEHICLES.map((v) => `${v.id} (${v.name.toLowerCase()}: ${v.aliases.slice(0, 3).join(', ')})`).join('\n');

export function identifyPrompt(): string {
  return [
    'You are the spotting assistant in a family game where children photograph construction machines.',
    'Identify the main vehicle in the photo. Choose "type" from exactly these ids, or null if none fits:',
    TYPE_LIST,
    'Also report:',
    '- "colour": the main body colour, one of yellow, orange, red, green, blue, white, other',
    '- "confidence": 0 to 1',
    '- "isMachine": true if any vehicle or machine is visible',
    '- "hasPeople": true if any person or face is clearly visible',
    '- "funFact": one short, true, child-friendly fact about this kind of machine (max 20 words), or "" if type is null',
    'Reply with only JSON, for example:',
    '{"type":"excavator","confidence":0.92,"colour":"yellow","isMachine":true,"hasPeople":false,"funFact":"An excavator can turn its whole body in a full circle while its tracks stay still."}',
  ].join('\n');
}

const VALID_TYPES = new Set<string>(VEHICLES.map((v) => v.id));
const VALID_COLOURS = new Set<string>(['yellow', 'orange', 'red', 'green', 'blue', 'white', 'other']);

export function normaliseGuess(raw: unknown): VehicleGuess {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const type = typeof o.type === 'string' && VALID_TYPES.has(o.type) ? (o.type as VehicleTypeId) : null;
  const colour = typeof o.colour === 'string' && VALID_COLOURS.has(o.colour) ? (o.colour as MachineColour) : undefined;
  const confidence = typeof o.confidence === 'number' ? Math.max(0, Math.min(1, o.confidence)) : type ? 0.6 : 0;
  return {
    typeId: type,
    confidence,
    colour,
    funFact: typeof o.funFact === 'string' && o.funFact.trim() ? o.funFact.trim().slice(0, 160) : undefined,
    isMachine: o.isMachine === undefined ? Boolean(type) : Boolean(o.isMachine),
    hasPeople: Boolean(o.hasPeople),
  };
}

function mapError(e: unknown): AiUnavailableError {
  if (isSampleError(e)) {
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'images_unavailable'].includes(e.code))
      return new AiUnavailableError('declined');
    if (e.code === 'rate_limited') return new AiUnavailableError('busy');
  }
  return new AiUnavailableError('failed');
}

export async function identifyVehicle(photo: PhotoAsset, signal?: AbortSignal): Promise<VehicleGuess> {
  const status = await aiStatus();
  if (status.provider === 'artifact' && status.vision && photo.aiBlob) {
    const sample = await capability<ArtifactSample>('sample');
    if (!sample) throw new AiUnavailableError('unavailable');
    try {
      const raw = await sample.json(identifyPrompt(), { images: [photo.aiBlob], modelTier: 'quick', signal });
      return normaliseGuess(raw);
    } catch (e) {
      throw mapError(e);
    }
  }
  if (status.provider === 'supabase' && photo.aiBase64) {
    try {
      const raw = await callFunction('identify-vehicle', { image: photo.aiBase64, mediaType: 'image/jpeg' }, signal);
      return normaliseGuess(raw);
    } catch {
      throw new AiUnavailableError('failed');
    }
  }
  throw new AiUnavailableError('unavailable');
}

/** The fields Claude sees for each place: enough to choose, small enough to send. */
export function compactPlaces(places: PlaceView[]) {
  return places.slice(0, 60).map((p) => ({
    id: p.id,
    name: p.name,
    type: CATEGORY_BY_ID[p.category].label,
    away: `${formatDistance(p.distanceM)} (${p.travel})`,
    price: p.price === 0 ? 'free' : '$'.repeat(p.price),
    ages: `${p.ages[0]}-${p.ages[1]}`,
    indoor: p.indoor,
    open: p.open.label,
    vibe: p.vibe ?? 'new',
    tags: p.stats?.topTags ?? [],
    about: p.blurb,
  }));
}

/** Prompt for the artifact runtime (the Supabase function builds the same one server-side). */
export function askPrompt(question: string, places: PlaceView[], kidAges: number[]): string {
  return [
    'You help parents quickly find something to do with their kids nearby.',
    kidAges.length ? `The kids are aged ${kidAges.join(', ')}.` : 'Kids ages are unknown.',
    `It is ${new Date().toLocaleString('en', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}.`,
    'Nearby places, one JSON object per line ("vibe" is a 0-100 parent rating):',
    ...compactPlaces(places).map((p) => JSON.stringify(p)),
    '',
    `Parent's question: ${question.slice(0, 400)}`,
    '',
    'Pick up to 3 places that best answer the question. Prefer open places with good vibes that suit the kids ages.',
    'Reply with only JSON: {"answer": "one or two warm, practical sentences", "picks": [{"id": "<id from the list>", "why": "reason in max 14 words"}]}',
  ].join('\n');
}

export async function askPlaydar(question: string, places: PlaceView[], kidAges: number[], signal?: AbortSignal): Promise<AskResult> {
  const status = await aiStatus();
  let raw: unknown;
  if (status.provider === 'artifact') {
    const sample = await capability<ArtifactSample>('sample');
    if (!sample) throw new AiUnavailableError('unavailable');
    try {
      raw = await sample.json(askPrompt(question, places, kidAges), { modelTier: 'quick', signal });
    } catch (e) {
      throw mapError(e);
    }
  } else if (status.provider === 'supabase') {
    try {
      raw = await callFunction('ask-playdar', { question: question.slice(0, 400), places: compactPlaces(places), kidAges }, signal);
    } catch {
      throw new AiUnavailableError('failed');
    }
  } else {
    throw new AiUnavailableError('unavailable');
  }
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ids = new Set(places.map((p) => p.id));
  const picks = Array.isArray(o.picks)
    ? o.picks
        .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
        .filter((x) => typeof x.id === 'string' && ids.has(x.id))
        .slice(0, 3)
        .map((x) => ({ placeId: x.id as string, why: typeof x.why === 'string' ? x.why.slice(0, 120) : '' }))
    : [];
  return { answer: typeof o.answer === 'string' ? o.answer.slice(0, 400) : '', picks };
}
