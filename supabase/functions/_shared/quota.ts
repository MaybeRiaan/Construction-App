import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

/**
 * Counts one AI call against the caller's daily allowance. Runs as the
 * signed-in family (their JWT), so `auth.uid()` in the SQL function is them.
 * Returns false when signed out or over the limit.
 */
export async function consumeQuota(req: Request, kind: 'identify' | 'ask', dailyLimit: number): Promise<boolean> {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return false;
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc('consume_ai_quota', { quota_kind: kind, daily_limit: dailyLimit });
  return !error && data === true;
}
