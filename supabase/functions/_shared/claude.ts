import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0';

/** Reads ANTHROPIC_API_KEY from the function's secrets (`supabase secrets set`). */
export const anthropic = new Anthropic();

export const MODEL = 'claude-opus-5-5';

/**
 * Asks Claude for one JSON object matching `schema`. Server-side fallback is
 * on, so a request declined by a safety classifier is retried on the model
 * Anthropic recommends for that category instead of failing outright.
 */
export async function askForJson<T>(opts: {
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: Record<string, unknown>;
  effort: 'low' | 'medium' | 'high';
  maxTokens: number;
}): Promise<{ ok: true; value: T } | { ok: false; reason: 'refused' | 'truncated' | 'empty' | 'busy' | 'upstream' }> {
  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } },
      messages: [{ role: 'user', content: opts.content }],
    });
    if (response.stop_reason === 'refusal') return { ok: false, reason: 'refused' };
    if (response.stop_reason === 'max_tokens') return { ok: false, reason: 'truncated' };
    const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text');
    if (!text) return { ok: false, reason: 'empty' };
    return { ok: true, value: JSON.parse(text.text) as T };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, reason: 'busy' };
    if (error instanceof SyntaxError) return { ok: false, reason: 'empty' };
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API error', error.status, error.message);
      return { ok: false, reason: 'upstream' };
    }
    throw error;
  }
}
