import { config, hasSupabase } from '../config';
import { appStorage } from './storage';

/**
 * A small fetch-based Supabase client: anonymous sign-in, PostgREST calls and
 * edge functions. It avoids the full SDK so the same code runs on iOS,
 * Android and the web build without polyfills. Swap in @supabase/supabase-js
 * later if you need realtime channels or social sign-in.
 */

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

const KEY = 'playdar.supabase.session';
let session: Session | null = null;
let loading: Promise<Session | null> | null = null;

function headers(token?: string): Record<string, string> {
  return {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${token ?? config.supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
}

async function save(s: Session | null) {
  session = s;
  if (s) await appStorage.setItem(KEY, JSON.stringify(s));
  else await appStorage.removeItem(KEY);
}

function fromAuth(json: Record<string, unknown>): Session | null {
  const user = json.user as { id?: string } | undefined;
  if (typeof json.access_token !== 'string' || typeof json.refresh_token !== 'string' || !user?.id) return null;
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  return { access_token: json.access_token, refresh_token: json.refresh_token, expires_at: Date.now() + (expiresIn - 60) * 1000, user_id: user.id };
}

async function signInAnonymously(): Promise<Session | null> {
  const res = await fetch(`${config.supabaseUrl}/auth/v1/signup`, { method: 'POST', headers: headers(), body: JSON.stringify({}) });
  if (!res.ok) return null;
  return fromAuth(await res.json());
}

async function refresh(s: Session): Promise<Session | null> {
  const res = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  if (!res.ok) return null;
  return fromAuth(await res.json());
}

/** The current session, signing in anonymously the first time. */
export async function getSession(): Promise<Session | null> {
  if (!hasSupabase) return null;
  if (session && session.expires_at > Date.now()) return session;
  if (!loading) {
    loading = (async () => {
      try {
        if (!session) {
          const raw = await appStorage.getItem(KEY);
          session = raw ? (JSON.parse(raw) as Session) : null;
        }
        if (session && session.expires_at > Date.now()) return session;
        const next = (session && (await refresh(session))) || (await signInAnonymously());
        await save(next);
        return next;
      } catch {
        return null;
      } finally {
        loading = null;
      }
    })();
  }
  return loading;
}

export async function rest<T = unknown>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const s = await getSession();
  const h: Record<string, string> = { ...headers(s?.access_token), ...((init.headers as Record<string, string>) ?? {}) };
  if (init.prefer) h.Prefer = init.prefer;
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, { ...init, headers: h });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function callFunction(name: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  const s = await getSession();
  const res = await fetch(`${config.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: headers(s?.access_token),
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`function ${name} ${res.status}`);
  return res.json();
}
