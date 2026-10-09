import type { LatLng } from '../domain/types';

/**
 * The web build runs the Riverbend demo (and inside a claude.ai artifact the
 * browser location API is unavailable), so location always comes from the
 * demo town. Native builds use the real device location.
 */
export const supportsRealLocation = false;

export async function locationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  return 'denied';
}

export async function requestLocation(): Promise<LatLng | null> {
  return null;
}

export async function watchLocation(_cb: (p: LatLng) => void): Promise<() => void> {
  return () => {};
}
