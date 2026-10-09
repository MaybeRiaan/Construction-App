// POST { question: string, places: CompactPlace[], kidAges: number[] }
// -> { answer, picks: [{ id, why }] }
//
// "Ask Playdar": a plain-English search over the places the app already has
// in range. The prompt is built here from validated fields, so the function
// can't be used as a general-purpose chatbot.
import { askForJson } from '../_shared/claude.ts';
import { corsHeaders, json } from '../_shared/http.ts';
import { consumeQuota } from '../_shared/quota.ts';

interface CompactPlace {
  id: string;
  name: string;
  type: string;
  away: string;
  price: string;
  ages: string;
  indoor: boolean;
  open: string;
  vibe: number | string;
  tags: string[];
  about?: string;
}

interface Answer {
  answer: string;
  picks: { id: string; why: string }[];
}

const SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, why: { type: 'string' } },
        required: ['id', 'why'],
        additionalProperties: false,
      },
    },
  },
  required: ['answer', 'picks'],
  additionalProperties: false,
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

function clean(raw: unknown): CompactPlace | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const id = str(p.id, 120);
  if (!id) return null;
  return {
    id,
    name: str(p.name, 120),
    type: str(p.type, 40),
    away: str(p.away, 40),
    price: str(p.price, 10),
    ages: str(p.ages, 10),
    indoor: p.indoor === true,
    open: str(p.open, 40),
    vibe: typeof p.vibe === 'number' ? Math.round(p.vibe) : 'new',
    tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string').slice(0, 6).map((t) => t.slice(0, 30)) : [],
    about: str(p.about, 160),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { question?: unknown; places?: unknown; kidAges?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const question = str(body.question, 400).trim();
  const places = (Array.isArray(body.places) ? body.places : []).slice(0, 60).map(clean).filter((p): p is CompactPlace => Boolean(p));
  const kidAges = (Array.isArray(body.kidAges) ? body.kidAges : []).filter((a): a is number => typeof a === 'number' && a >= 0 && a <= 18).slice(0, 8);
  if (!question || !places.length) return json({ error: 'bad_request' }, 400);

  if (!(await consumeQuota(req, 'ask', 80))) return json({ error: 'quota' }, 429);

  const prompt = [
    'You help parents quickly find something to do with their kids nearby.',
    kidAges.length ? `The kids are aged ${kidAges.join(', ')}.` : 'The kids’ ages are unknown.',
    'Nearby places, one JSON object per line ("vibe" is a 0-100 rating from local parents):',
    ...places.map((p) => JSON.stringify(p)),
    '',
    `Parent's question: ${question}`,
    '',
    'Pick up to 3 places from the list that best answer the question. Prefer open places with good vibes that suit the kids’ ages.',
    '"answer" is one or two warm, practical sentences. Each pick has the place "id" from the list and a "why" of at most 14 words.',
  ].join('\n');

  const result = await askForJson<Answer>({ content: [{ type: 'text', text: prompt }], schema: SCHEMA, effort: 'medium', maxTokens: 8000 });
  if (!result.ok) return json({ error: result.reason }, result.reason === 'busy' ? 429 : result.reason === 'refused' ? 422 : 502);

  const ids = new Set(places.map((p) => p.id));
  return json({
    answer: result.value.answer.slice(0, 400),
    picks: result.value.picks.filter((p) => ids.has(p.id)).slice(0, 3).map((p) => ({ id: p.id, why: p.why.slice(0, 120) })),
  });
});
