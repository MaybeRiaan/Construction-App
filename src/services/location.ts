import * as Location from 'expo-location';
import type { LatLng } from '../domain/types';

/** Native: real device location via expo-location. */
export const supportsRealLocation = true;

export async function locationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const p = await Location.getForegroundPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'undetermined';
  }
}

export async function requestLocation(): Promise<LatLng | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

export async function watchLocation(cb: (p: LatLng) => void): Promise<() => void> {
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (!granted) return () => {};
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 15, timeInterval: 4000 },
      (pos) => cb({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
