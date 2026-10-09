/**
 * Procedural geometry for the stylised web map of the Riverbend demo town.
 * All coordinates are metres from the town centre, y pointing north. The
 * river, lake and parks come from DEMO_GEO so places sit where they should.
 */
import { DEMO_AREAS, DEMO_GEO } from '../data/demoTown';
import { seeded } from '../domain/game';

type Pt = [number, number];

export interface World {
  town: string;
  parks: string;
  lake: string;
  river: string;
  riverWidth: number;
  minorRoads: string;
  majorRoads: { d: string; name: string; labelAt: Pt; angle: number }[];
  areas: { name: string; x: number; y: number }[];
  extent: number;
}

const f = (n: number) => Math.round(n);

/** Closed, smooth, slightly wobbly blob. */
function blob(cx: number, cy: number, r: number, seed: number, wobble = 0.1): string {
  const rand = seeded(seed);
  const a1 = rand() * 6.28;
  const a2 = rand() * 6.28;
  const n = 32;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + wobble * Math.sin(3 * a + a1) + wobble * 0.6 * Math.sin(5 * a + a2));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = `M${f(mid(pts[n - 1], pts[0])[0])} ${f(mid(pts[n - 1], pts[0])[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d}Z`;
}

/** Catmull-Rom through points, as cubic Béziers. */
function smooth(pts: Pt[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function distToPolyline(p: Pt, line: Pt[]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = line[i];
    const [bx, by] = line[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy));
  }
  return best;
}

const MAJOR: { name: string; pts: Pt[] }[] = [
  { name: 'High Street', pts: [[-9000, 1150], [-5200, 980], [-2600, 900], [0, 760], [2600, 930], [5200, 1180], [9000, 1500]] },
  { name: 'Willow Road', pts: [[-9000, -120], [-5600, -420], [-3200, -350], [-1300, -60], [600, 80], [2400, 220], [4600, 120], [9000, 280]] },
  { name: 'Kestrel Avenue', pts: [[-8200, 6400], [-5200, 4300], [-3500, 3150], [-2000, 1700], [-700, 780]] },
  { name: 'Station Road', pts: [[3600, -8000], [3300, -3600], [3000, -1500], [3350, 300], [3900, 2600], [4200, 8000]] },
  { name: 'Orbit Avenue', pts: [[-1450, -8000], [-1350, -3800], [-1150, -1700], [-1350, -200], [-2150, 1000], [-2350, 3900], [-2700, 8000]] },
  { name: 'Quarry Road', pts: [[200, 760], [700, 1200], [1500, 1750], [2300, 2500], [2700, 4200], [2900, 8000]] },
  { name: 'Fernleaf Drive', pts: [[600, 80], [900, -900], [1300, -1900], [1700, -3200], [2200, -8000]] },
];

function ring(r: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rr = r * (1 + 0.06 * Math.sin(3 * a + 1.3) + 0.03 * Math.sin(7 * a));
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.86]);
  }
  return pts;
}

let cached: World | null = null;

export function buildWorld(): World {
  if (cached) return cached;
  const rand = seeded(424242);
  const river = DEMO_GEO.river as Pt[];
  const parks = DEMO_GEO.parks;
  const lake = DEMO_GEO.lake;
  const townR = DEMO_GEO.townRadius;

  // Minor street grid, rotated a few degrees, thinned and kept out of water and parks.
  const theta = (7 * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const S = 230;
  const N = Math.ceil((townR + 600) / S);
  const node = (i: number, j: number): Pt => {
    const r = seeded(i * 7349 + j * 9157 + 17);
    const u = i * S + (r() - 0.5) * 44;
    const v = j * S + (r() - 0.5) * 44;
    return [u * cos - v * sin, u * sin + v * cos];
  };
  const townEdge = (p: Pt) => {
    const a = Math.atan2(p[1], p[0]);
    return townR * (1 + 0.12 * Math.sin(3 * a + 0.7) + 0.07 * Math.sin(5 * a + 2.1));
  };
  const blocked = (p: Pt) => {
    if (Math.hypot(p[0], p[1]) > townEdge(p)) return true;
    if (Math.hypot(p[0] - lake.x, p[1] - lake.y) < lake.r * 1.12) return true;
    if (distToPolyline(p, river) < DEMO_GEO.riverWidth / 2 + 30) return true;
    return parks.some((k) => Math.hypot(p[0] - k.x, p[1] - k.y) < k.r * 0.95);
  };
  let minor = '';
  for (let i = -N; i <= N; i++) {
    for (let j = -N; j <= N; j++) {
      const a = node(i, j);
      for (const [di, dj] of [[1, 0], [0, 1]] as const) {
        const b = node(i + di, j + dj);
        const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (blocked(m) || blocked(a) || blocked(b)) continue;
        if (rand() < 0.16) continue;
        minor += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
      }
    }
  }

  const majors = [...MAJOR, { name: 'Ring Road', pts: ring(4700) }].map((r) => {
    const k = Math.floor(r.pts.length / 2);
    const a = r.pts[k - 1];
    const b = r.pts[k];
    let angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    return { d: smooth(r.pts), name: r.name, labelAt: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Pt, angle };
  });

  cached = {
    town: blob(0, 0, townR, 11, 0.12),
    parks: parks.map((p, i) => blob(p.x, p.y, p.r, 100 + i, 0.14)).join(''),
    lake: blob(lake.x, lake.y, lake.r, 7, 0.12),
    river: smooth(river),
    riverWidth: DEMO_GEO.riverWidth,
    minorRoads: minor,
    majorRoads: majors,
    areas: DEMO_AREAS,
    extent: 13000,
  };
  return cached;
}
