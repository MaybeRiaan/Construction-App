// POST { image: <base64 JPEG/PNG/WebP>, mediaType?: string }
// -> { type, confidence, colour, isMachine, hasPeople, funFact }
//
// The Hard Hat Hunt spotter: names the construction machine in a photo and
// flags photos with people in them so the app keeps those private.
import { askForJson } from '../_shared/claude.ts';
import { corsHeaders, json } from '../_shared/http.ts';
import { consumeQuota } from '../_shared/quota.ts';
import { COLOURS, VEHICLES } from '../_shared/vehicles.ts';

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];
const MAX_BASE64_CHARS = 7_000_000; // ~5 MB image

const SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: [...VEHICLES.map(([id]) => id), 'none'] },
    confidence: { type: 'number' },
    colour: { type: 'string', enum: COLOURS },
    isMachine: { type: 'boolean' },
    hasPeople: { type: 'boolean' },
    funFact: { type: 'string' },
  },
  required: ['type', 'confidence', 'colour', 'isMachine', 'hasPeople', 'funFact'],
  additionalProperties: false,
};

const PROMPT = [
  'You are the spotting assistant in a family game where children photograph construction machines from the car or the footpath.',
  'Identify the main vehicle in the photo. Set "type" to one of these ids, or "none" if none fits:',
  ...VEHICLES.map(([id, d]) => `- ${id}: ${d}`),
  '"confidence" is 0 to 1. "colour" is the main body colour.',
  '"isMachine" is true if any vehicle or machine is visible.',
  '"hasPeople" is true if any person or face is clearly visible, even small or in the background.',
  '"funFact" is one short, true, child-friendly fact about that kind of machine (max 20 words), or "" when type is "none".',
].join('\n');

interface Guess {
  type: string;
  confidence: number;
  colour: string;
  isMachine: boolean;
  hasPeople: boolean;
  funFact: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const image = typeof body.image === 'string' ? body.image.replace(/^data:image\/\w+;base64,/, '') : '';
  const mediaType: MediaType = MEDIA_TYPES.includes(body.mediaType as MediaType) ? (body.mediaType as MediaType) : 'image/jpeg';
  if (!image || image.length > MAX_BASE64_CHARS || !/^[A-Za-z0-9+/]+=*$/.test(image)) return json({ error: 'bad_image' }, 400);

  if (!(await consumeQuota(req, 'identify', 60))) return json({ error: 'quota' }, 429);

  const result = await askForJson<Guess>({
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
      { type: 'text', text: PROMPT },
    ],
    schema: SCHEMA,
    effort: 'low',
    maxTokens: 4000,
  });
  if (!result.ok) return json({ error: result.reason }, result.reason === 'busy' ? 429 : result.reason === 'refused' ? 422 : 502);

  const g = result.value;
  return json({ ...g, type: g.type === 'none' ? null : g.type, confidence: Math.max(0, Math.min(1, g.confidence)) });
});
