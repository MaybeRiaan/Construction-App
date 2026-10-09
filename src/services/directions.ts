import { Linking, Platform } from 'react-native';
import type { LatLng } from '../domain/types';

/** Open turn-by-turn directions in the platform maps app. */
export async function openDirections(to: LatLng, label: string): Promise<boolean> {
  const q = `${to.latitude},${to.longitude}`;
  const name = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${q}&q=${name}`
      : Platform.OS === 'android'
        ? `geo:0,0?q=${q}(${name})`
        : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
