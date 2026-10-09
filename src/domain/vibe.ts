import type { VibeCheck, VibeStats } from './types';

/** Map an average 1–5 score to the 0–100 Vibe Meter. */
export function vibeScore(avg: number): number {
  return Math.round(((avg - 1) / 4) * 100);
}

export interface VibeVerdict {
  label: string;
  tone: 'hot' | 'good' | 'mixed' | 'cold' | 'new';
}

export function vibeVerdict(stats?: VibeStats): VibeVerdict {
  if (!stats || stats.count === 0) return { label: 'New spot', tone: 'new' };
  const s = vibeScore(stats.avg);
  if (s >= 85) return { label: 'Total vibe', tone: 'hot' };
  if (s >= 70) return { label: 'Good vibes', tone: 'good' };
  if (s >= 50) return { label: 'Mixed vibes', tone: 'mixed' };
  return { label: 'Not a vibe', tone: 'cold' };
}

/** Share of parents who rated it 4 or 5. */
export function vibePercent(stats?: VibeStats): number | null {
  if (!stats || stats.count === 0) return null;
  return Math.round(((stats.dist[3] + stats.dist[4]) / stats.count) * 100);
}

/** Build a distribution that matches a target average and count (demo data). */
export function makeStats(avg: number, count: number, topTags: string[]): VibeStats {
  const weights = [1, 2, 3, 4, 5].map((s) => Math.exp(-Math.pow(s - avg, 2) / 0.9));
  const sum = weights.reduce((a, b) => a + b, 0);
  const dist = weights.map((w) => Math.round((w / sum) * count)) as VibeStats['dist'];
  const diff = count - dist.reduce((a, b) => a + b, 0);
  dist[Math.min(4, Math.max(0, Math.round(avg) - 1))] += diff;
  const realAvg = dist.reduce((acc, n, i) => acc + n * (i + 1), 0) / Math.max(1, count);
  return { count, avg: Math.round(realAvg * 100) / 100, dist, topTags };
}

/** Fold extra vibe checks (the user's own, or shared ones) into a place's stats. */
export function mergeStats(base: VibeStats | undefined, checks: VibeCheck[]): VibeStats | undefined {
  if (!checks.length) return base;
  const dist = [...(base?.dist ?? [0, 0, 0, 0, 0])] as VibeStats['dist'];
  const tagCounts = new Map<string, number>();
  (base?.topTags ?? []).forEach((t, i) => tagCounts.set(t, Math.max(1, Math.round((base?.count ?? 0) / (i + 2)))));
  for (const c of checks) {
    dist[c.score - 1] += 1;
    for (const t of c.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const count = dist.reduce((a, b) => a + b, 0);
  const avg = dist.reduce((acc, n, i) => acc + n * (i + 1), 0) / Math.max(1, count);
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  return { count, avg: Math.round(avg * 100) / 100, dist, topTags };
}
