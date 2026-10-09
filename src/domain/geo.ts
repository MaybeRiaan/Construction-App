import type { LatLng } from './types';

const R = 6371008.8;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in metres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Move `origin` by metres east (dx) and north (dy). Accurate enough within a city. */
export function offset(origin: LatLng, dx: number, dy: number): LatLng {
  const lat = origin.latitude + toDeg(dy / R);
  const lng = origin.longitude + toDeg(dx / (R * Math.cos(toRad(origin.latitude))));
  return { latitude: lat, longitude: lng };
}

/** Local flat projection around `origin`: metres east / north. */
export function project(origin: LatLng, p: LatLng): { x: number; y: number } {
  const x = toRad(p.longitude - origin.longitude) * R * Math.cos(toRad(origin.latitude));
  const y = toRad(p.latitude - origin.latitude) * R;
  return { x, y };
}

export function unproject(origin: LatLng, x: number, y: number): LatLng {
  return offset(origin, x, y);
}

export type Units = 'km' | 'mi';

export function formatDistance(m: number, units: Units = 'km'): string {
  if (units === 'mi') {
    const mi = m / 1609.344;
    if (mi < 0.1) return `${Math.round(m * 3.28084 / 10) * 10} ft`;
    return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  if (m < 950) return `${Math.max(50, Math.round(m / 50) * 50)} m`;
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatRadius(km: number, units: Units = 'km'): string {
  if (units === 'mi') return `${Math.round(km / 1.609344)} mi`;
  return `${km} km`;
}

/**
 * Rough door-to-door time. Walking for short hops, driving otherwise, with a
 * winding-streets factor. Good enough for "8 min away" on a card.
 */
export function travelTime(m: number): { mode: 'walk' | 'drive'; minutes: number } {
  const road = m * 1.3;
  if (m <= 900) return { mode: 'walk', minutes: Math.max(1, Math.round(road / 75)) };
  return { mode: 'drive', minutes: Math.max(2, Math.round(road / 450) + 2) };
}

export function formatTravel(m: number): string {
  const t = travelTime(m);
  return `${t.minutes} min ${t.mode}`;
}

/**
 * Public spots never show the exact place a child stood. Snap to a ~150 m grid
 * so other hunters can find the machine without learning a family's location.
 */
export function fuzz(p: LatLng, gridM = 150): LatLng {
  const latStep = toDeg(gridM / R);
  const lngStep = toDeg(gridM / (R * Math.cos(toRad(p.latitude))));
  return {
    latitude: Math.round(p.latitude / latStep) * latStep,
    longitude: Math.round(p.longitude / lngStep) * lngStep,
  };
}

export function pathLength(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += distanceM(path[i - 1], path[i]);
  return total;
}
