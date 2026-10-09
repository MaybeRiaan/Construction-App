import { useEffect, useRef, useState } from 'react';
import { DEMO_ROUTE } from '../data/demoCommunity';
import { offset } from '../domain/geo';
import type { LatLng } from '../domain/types';
import { watchLocation } from '../services/location';
import { useHunt } from './hunt';
import { useLocation } from './LocationProvider';

const SPEED_M_PER_TICK = 28;
const TICK_MS = 1000;

/**
 * Follows the family while a hunt is running. On a phone with location on it
 * uses GPS; in the demo it drives a loop through Riverbend so the trail,
 * timer and "famous machine nearby" alerts can be tried from a desk.
 */
export function useHuntTracker(): { position: LatLng; simulated: boolean } {
  const { origin, source } = useLocation();
  const active = useHunt((s) => s.activeHunt?.id ?? null);
  const appendPath = useHunt((s) => s.appendPath);
  const [position, setPosition] = useState<LatLng>(origin);
  const progress = useRef(0);
  const simulated = source !== 'device';

  useEffect(() => {
    if (!active) {
      setPosition(origin);
      return;
    }
    if (!simulated) {
      let stop: (() => void) | null = null;
      let alive = true;
      watchLocation((p) => {
        setPosition(p);
        appendPath(p);
      }).then((s) => {
        if (alive) stop = s;
        else s();
      });
      return () => {
        alive = false;
        stop?.();
      };
    }
    // Simulated drive along DEMO_ROUTE (metres from the town centre).
    const segs = DEMO_ROUTE.slice(1).map((b, i) => {
      const a = DEMO_ROUTE[i];
      return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
    });
    const total = segs.reduce((n, s) => n + s.len, 0);
    const at = (d: number): LatLng => {
      let rest = d % total;
      for (const s of segs) {
        if (rest <= s.len) {
          const t = rest / s.len;
          return offset(origin, s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t);
        }
        rest -= s.len;
      }
      return origin;
    };
    const step = () => {
      progress.current += SPEED_M_PER_TICK;
      const p = at(progress.current);
      setPosition(p);
      appendPath(p);
    };
    step();
    const t = setInterval(step, TICK_MS);
    return () => clearInterval(t);
  }, [active, simulated, origin, appendPath]);

  return { position, simulated };
}
