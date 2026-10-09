import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from 'react';
import { View } from 'react-native';
import { project } from '../domain/geo';
import type { LatLng } from '../domain/types';
import { useTheme } from '../theme/ThemeProvider';
import { font } from '../theme/typography';
import { Pin } from './Pin';
import type { AppMapHandle, AppMapProps, MapMarker } from './types';
import { buildWorld } from './worldGen';

/**
 * Stylised vector map for the web build: the demo town drawn as SVG, with
 * pan, pinch, wheel and double-tap zoom, clustering and a radar range ring.
 * World units are metres from `origin`, y pointing north.
 */

interface Cam {
  x: number;
  y: number;
  s: number;
}

const MIN_S = 0.012;
const MAX_S = 1.4;
const clampS = (s: number) => Math.max(MIN_S, Math.min(MAX_S, s));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.textContent = `
@keyframes pd-pulse { 0% { transform: scale(0.15); opacity: 0.55 } 100% { transform: scale(1); opacity: 0 } }
@keyframes pd-halo { 0% { transform: scale(0.6); opacity: 0.7 } 100% { transform: scale(2.4); opacity: 0 } }
@keyframes pd-sweep { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .pd-anim { animation: none !important } }
.pd-marker:focus-visible { outline: 3px solid #FFC21A; outline-offset: 3px; border-radius: 14px }
`;
  document.head.appendChild(el);
}

export const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  { origin, radiusKm, markers, onMarkerPress, onMapPress, trail, you, showUser = true, padding = { top: 0, bottom: 0 }, pulseKey, interactive = true, style },
  ref,
) {
  const { c } = useTheme();
  const world = useMemo(buildWorld, []);
  const box = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, s: 0.03 });
  const camRef = useRef(cam);
  camRef.current = cam;
  const anim = useRef<number | null>(null);
  const fitted = useRef(false);

  useEffect(injectStyles, []);

  // Measure the container (works inside the desktop device frame too).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const toWorld = useCallback((p: LatLng) => project(origin, p), [origin]);
  const projected = useMemo(() => markers.map((m) => ({ m, p: toWorld(m.coordinate) })), [markers, toWorld]);
  const projectedRef = useRef(projected);
  projectedRef.current = projected;

  const animateTo = useCallback((target: Cam, ms = 450) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const from = { ...camRef.current };
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const k = ease(t);
      const s = Math.exp(Math.log(from.s) + (Math.log(target.s) - Math.log(from.s)) * k);
      setCam({ x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k, s });
      if (t < 1) anim.current = requestAnimationFrame(step);
      else anim.current = null;
    };
    anim.current = requestAnimationFrame(step);
  }, []);

  /** Camera that puts world point (x, y) at the middle of the visible area. */
  const camFor = useCallback(
    (x: number, y: number, s: number): Cam => {
      const visTop = padding.top;
      const visH = Math.max(80, size.h - padding.top - padding.bottom);
      const dy = visTop + visH / 2 - size.h / 2;
      return { x, y: y + dy / s, s };
    },
    [padding.top, padding.bottom, size.h],
  );

  const fitRadius = useCallback(
    (km: number, instant = false) => {
      if (!size.w || !size.h) return;
      const visH = Math.max(120, size.h - padding.top - padding.bottom);
      const s = clampS((Math.min(size.w, visH) / 2) * 0.92 / (km * 1000));
      const target = camFor(0, 0, s);
      if (instant) setCam(target);
      else animateTo(target);
    },
    [size.w, size.h, padding.top, padding.bottom, camFor, animateTo],
  );

  useImperativeHandle(ref, () => ({
    fitRadius: (km) => fitRadius(km),
    focus: (p) => {
      const w = toWorld(p);
      animateTo(camFor(w.x, w.y, Math.max(camRef.current.s, 0.14)));
    },
    recenter: () => fitRadius(radiusKm ?? 3),
  }));

  // First fit once the container has a size.
  useEffect(() => {
    if (!fitted.current && size.w && size.h) {
      fitted.current = true;
      fitRadius(radiusKm ?? 3, true);
    }
  }, [size.w, size.h, fitRadius, radiusKm]);

  // ----- gestures -------------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, start: 0, markerId: null as string | null, lastTap: 0, pinchDist: 0 });

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const cur = camRef.current;
    const el = box.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const s = clampS(cur.s * factor);
    // Keep the world point under (sx, sy) fixed.
    const wx = cur.x + (sx - w / 2) / cur.s;
    const wy = cur.y - (sy - h / 2) / cur.s;
    setCam({ x: wx - (sx - w / 2) / s, y: wy + (sy - h / 2) / s, s });
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (anim.current) cancelAnimationFrame(anim.current);
      const p = local(e);
      const k = e.ctrlKey ? 0.012 : 0.0018;
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * k));
    };
    const onDown = (e: PointerEvent) => {
      if (anim.current) cancelAnimationFrame(anim.current);
      pointers.current.set(e.pointerId, local(e));
      const target = e.target as HTMLElement | null;
      const markerEl = target?.closest?.('[data-marker-id]') as HTMLElement | null;
      if (pointers.current.size === 1) {
        gesture.current.moved = 0;
        gesture.current.start = performance.now();
        gesture.current.markerId = markerEl?.dataset.markerId ?? null;
      }
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        gesture.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        gesture.current.moved = 99;
      }
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      const p = local(e);
      pointers.current.set(e.pointerId, p);
      if (pointers.current.size === 1) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        gesture.current.moved += Math.abs(dx) + Math.abs(dy);
        if (gesture.current.moved < 6) return;
        const cur = camRef.current;
        setCam({ x: cur.x - dx / cur.s, y: cur.y + dy / cur.s, s: cur.s });
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (gesture.current.pinchDist > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / gesture.current.pinchDist);
        gesture.current.pinchDist = dist;
      }
    };
    const onUp = (e: PointerEvent) => {
      const had = pointers.current.delete(e.pointerId);
      if (!had || pointers.current.size > 0) return;
      const g = gesture.current;
      if (g.moved < 6 && performance.now() - g.start < 450) {
        if (g.markerId?.startsWith('cluster:')) {
          const ids = new Set(g.markerId.slice(8).split('|'));
          const pts = projectedRef.current.filter((x) => ids.has(x.m.id)).map((x) => x.p);
          if (pts.length) {
            const cx = pts.reduce((a, q) => a + q.x, 0) / pts.length;
            const cy = pts.reduce((a, q) => a + q.y, 0) / pts.length;
            animateTo({ x: cx, y: cy, s: clampS(camRef.current.s * 2.4) }, 350);
          }
        } else if (g.markerId) {
          onMarkerPress?.(g.markerId);
        } else {
          const now = performance.now();
          if (now - g.lastTap < 300) {
            const p = local(e);
            const cur = camRef.current;
            const w = el.clientWidth;
            const h = el.clientHeight;
            const s = clampS(cur.s * 2);
            const wx = cur.x + (p.x - w / 2) / cur.s;
            const wy = cur.y - (p.y - h / 2) / cur.s;
            animateTo({ x: wx - (p.x - w / 2) / s, y: wy + (p.y - h / 2) / s, s }, 300);
            g.lastTap = 0;
          } else {
            g.lastTap = now;
            onMapPress?.();
          }
        }
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [zoomAt, animateTo, onMarkerPress, onMapPress]);

  // ----- projection & clustering ---------------------------------------
  const { w, h } = size;
  const sx = (x: number) => w / 2 + (x - cam.x) * cam.s;
  const sy = (y: number) => h / 2 - (y - cam.y) * cam.s;


  const clusters = useMemo(() => {
    const out: { x: number; y: number; items: MapMarker[]; wx: number; wy: number }[] = [];
    const R = 24;
    const ordered = [...projected].sort((a, b) => Number(Boolean(b.m.selected)) - Number(Boolean(a.m.selected)) || Number(Boolean(b.m.sponsored)) - Number(Boolean(a.m.sponsored)));
    for (const { m, p } of ordered) {
      const x = w / 2 + (p.x - cam.x) * cam.s;
      const y = h / 2 - (p.y - cam.y) * cam.s;
      if (x < -60 || y < -80 || x > w + 60 || y > h + 60) continue;
      const hit = m.selected ? undefined : out.find((cl) => !cl.items[0].selected && Math.hypot(cl.x - x, cl.y - y) < R);
      if (hit) hit.items.push(m);
      else out.push({ x, y, items: [m], wx: p.x, wy: p.y });
    }
    return out.reverse();
  }, [projected, cam, w, h]);

  const pxPerM = cam.s;
  const majorW = Math.max(2.2, Math.min(15, 15 * pxPerM));
  const minorW = Math.max(0.7, Math.min(8, 7 * pxPerM));
  const showMinor = pxPerM > 0.022;
  const showRoadNames = pxPerM > 0.09;
  const youW = toWorld(you ?? origin);
  const trailD = useMemo(() => {
    if (!trail || trail.length < 2) return null;
    return trail.map((p, i) => {
      const q = toWorld(p);
      return `${i ? 'L' : 'M'}${Math.round(q.x)} ${Math.round(q.y)}`;
    }).join('');
  }, [trail, toWorld]);

  const radiusPx = radiusKm ? radiusKm * 1000 * pxPerM : 0;
  const m = c.map;
  const labelFont = font('body', 700);

  return (
    <View style={[{ flex: 1, overflow: 'hidden', backgroundColor: m.land }, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <div
        ref={box}
        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
        role="application"
        aria-label="Map of places nearby"
      >
        {w > 0 && (
          <svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }}>
            <g transform={`translate(${w / 2 - cam.x * cam.s} ${h / 2 + cam.y * cam.s}) scale(${cam.s} ${-cam.s})`}>
              <path d={world.town} fill={m.town} />
              <path d={world.parks} fill={m.park} stroke={m.parkEdge} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              <path d={world.lake} fill={m.water} stroke={m.waterEdge} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              <path d={world.river} fill="none" stroke={m.water} strokeWidth={world.riverWidth} strokeLinecap="round" strokeLinejoin="round" />
              {showMinor && <path d={world.minorRoads} fill="none" stroke={m.road} strokeWidth={minorW} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
              {world.majorRoads.map((r) => (
                <path key={`c${r.name}`} d={r.d} fill="none" stroke={m.roadMajorCasing} strokeWidth={majorW + 2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              ))}
              {world.majorRoads.map((r) => (
                <path key={r.name} d={r.d} fill="none" stroke={m.roadMajor} strokeWidth={majorW} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              ))}
              {trailD && (
                <>
                  <path d={trailD} fill="none" stroke={c.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.85} />
                  <path d={trailD} fill="none" stroke={c.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </>
              )}
            </g>
            {/* Screen-space labels */}
            {world.areas.map((a) => {
              const x = sx(a.x);
              const y = sy(a.y);
              if (x < -100 || x > w + 100 || y < -20 || y > h + 20) return null;
              return (
                <text
                  key={a.name}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fill={m.label}
                  stroke={m.labelHalo}
                  strokeWidth={3}
                  paintOrder="stroke"
                  style={{ fontFamily: labelFont.fontFamily, fontWeight: 800, fontSize: pxPerM > 0.06 ? 12 : 10, letterSpacing: 1.6, textTransform: 'uppercase' }}
                >
                  {a.name}
                </text>
              );
            })}
            {showRoadNames &&
              world.majorRoads.map((r) => {
                const x = sx(r.labelAt[0]);
                const y = sy(r.labelAt[1]);
                if (x < 0 || x > w || y < 0 || y > h) return null;
                return (
                  <text
                    key={`l${r.name}`}
                    x={x}
                    y={y + 3.5}
                    textAnchor="middle"
                    transform={`rotate(${-r.angle} ${x} ${y})`}
                    fill={m.label}
                    stroke={m.roadMajor}
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={{ fontFamily: labelFont.fontFamily, fontWeight: 600, fontSize: 10.5 }}
                  >
                    {r.name}
                  </text>
                );
              })}
            {radiusKm ? (
              <g>
                <circle cx={sx(0)} cy={sy(0)} r={radiusPx} fill={m.radiusFill} stroke={m.radiusStroke} strokeWidth={1.5} strokeDasharray="6 6" />
                <circle cx={sx(0)} cy={sy(0)} r={radiusPx * 0.5} fill="none" stroke={m.radiusStroke} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="2 6" />
              </g>
            ) : null}
          </svg>
        )}

        {/* Radar pulse when the range changes */}
        {radiusKm && w > 0 ? (
          <div
            key={`pulse${pulseKey ?? 0}`}
            className="pd-anim"
            style={{
              position: 'absolute',
              left: sx(0) - radiusPx,
              top: sy(0) - radiusPx,
              width: radiusPx * 2,
              height: radiusPx * 2,
              borderRadius: '50%',
              border: `2px solid ${c.accent}`,
              background: `radial-gradient(circle, transparent 55%, ${c.accent}33 100%)`,
              animation: 'pd-pulse 1.1s ease-out 1 forwards',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        ) : null}

        {/* You */}
        {showUser && w > 0 ? (
          <div style={{ position: 'absolute', left: sx(youW.x) - 11, top: sy(youW.y) - 11, width: 22, height: 22, pointerEvents: 'none' }}>
            <div className="pd-anim" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: c.accent, animation: 'pd-halo 2.2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: c.ink, border: '3px solid #FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }} />
          </div>
        ) : null}

        {/* Markers and clusters */}
        {clusters.map((cl) => {
          if (cl.items.length > 1) {
            const first = cl.items[0];
            return (
              <div
                key={`cl-${first.id}`}
                data-marker-id={`cluster:${cl.items.map((i) => i.id).join('|')}`}
                className="pd-marker"
                role="button"
                tabIndex={0}
                aria-label={`${cl.items.length} places here. Zoom in`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') animateTo({ x: cl.wx, y: cl.wy, s: clampS(cam.s * 2.2) }, 350);
                }}
                style={{ position: 'absolute', left: cl.x - 16, top: cl.y - 16, width: 32, height: 32, cursor: 'pointer' }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: first.kind === 'spot' ? '#FFC21A' : c.ink,
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0px 4px 10px rgba(16,18,22,0.3)',
                  }}
                >
                  <span style={{ ...labelFont, fontWeight: 800, fontSize: 12, color: first.kind === 'spot' ? '#15171B' : c.onInk } as CSSProperties}>{cl.items.length}</span>
                </View>
              </div>
            );
          }
          const mk = cl.items[0];
          return (
            <div
              key={mk.id}
              data-marker-id={mk.id}
              className="pd-marker"
              role="button"
              tabIndex={0}
              aria-label={mk.label ?? 'Place'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onMarkerPress?.(mk.id);
              }}
              style={{
                position: 'absolute',
                left: cl.x,
                top: cl.y,
                transform: 'translate(-50%, -100%)',
                zIndex: mk.selected ? 20 : mk.sponsored ? 3 : 2,
                cursor: 'pointer',
              }}
            >
              <Pin m={mk} />
            </div>
          );
        })}
      </div>
    </View>
  );
});
