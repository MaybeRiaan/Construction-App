/**
 * Bridge to the claude.ai artifact runtime (`window.claude`), present only
 * when the web build is opened as a published artifact. Everywhere else
 * these helpers resolve null and callers fall back to local behaviour.
 *
 * Shapes follow the runtime's published type definitions (contract 0.2.x),
 * trimmed to what Playdar uses.
 */

export interface DbDocSnapshot {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
export interface DbQuerySnapshot {
  docs: DbDocSnapshot[];
}
export interface DbError {
  code: string;
  message: string;
}
export interface DbDocRef {
  id: string;
  get(): Promise<DbDocSnapshot>;
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (s: DbDocSnapshot) => void, error?: (e: DbError) => void): () => void;
}
export interface DbQuery {
  where(field: string, op: string, value: unknown): DbQuery;
  orderBy(field: string, dir?: 'asc' | 'desc'): DbQuery;
  limit(n: number): DbQuery;
  get(): Promise<DbQuerySnapshot>;
  onSnapshot(next: (s: DbQuerySnapshot) => void, error?: (e: DbError) => void): () => void;
}
export interface DbCollectionRef extends DbQuery {
  doc(id?: string): DbDocRef;
}
export interface ArtifactDb {
  doc(path: string): DbDocRef;
  collection(path: string): DbCollectionRef;
}

export interface ArtifactUser {
  id(): Promise<string | null>;
  isOwner(): Promise<boolean>;
  /** Editor or owner: may write paths the rules reserve for `admin`. */
  canEdit(): Promise<boolean>;
  can(name: string): Promise<boolean | null>;
}

export interface SampleOptions {
  images?: Blob | Blob[];
  modelTier?: 'quick' | 'default' | 'complex';
  signal?: AbortSignal;
  cache?: boolean;
}
export interface ArtifactSample {
  (input: string, options?: SampleOptions): Promise<{ text: string }>;
  json<T = unknown>(input: string, options?: SampleOptions): Promise<T>;
  limits(): Promise<{ maxPromptBytes: number; images?: { maxCount: number; maxInputBytes: number; mediaTypes: string[] } }>;
}

export interface SampleError {
  code: string;
  message: string;
  text?: string;
}

interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

function runtime(): ClaudeRuntime | null {
  const g = globalThis as unknown as { claude?: ClaudeRuntime };
  return g.claude && typeof g.claude.use === 'function' ? g.claude : null;
}

export const inArtifact = () => runtime() !== null;

const memo = new Map<string, Promise<unknown>>();

export function capability<T>(name: 'db' | 'user' | 'sample'): Promise<T | null> {
  const rt = runtime();
  if (!rt) return Promise.resolve(null);
  if (!memo.has(name)) memo.set(name, rt.use(name).catch(() => null));
  return memo.get(name) as Promise<T | null>;
}

export function isSampleError(e: unknown): e is SampleError {
  return typeof e === 'object' && e !== null && 'code' in e;
}
