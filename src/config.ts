import type { LatLng } from './domain/types';

/**
 * Runtime configuration. Values prefixed EXPO_PUBLIC_ are inlined at build
 * time from `.env` (see `.env.example`). Everything works without them: the
 * app falls back to the Riverbend demo town and on-device storage.
 */
export const config = {
  /** Where the demo town sits when the device location is unavailable. */
  demoCenter: { latitude: 51.4545, longitude: -2.5879 } as LatLng,
  defaultRadiusKm: 5,
  minRadiusKm: 1,
  maxRadiusKm: 50,
  /** Largest radius we ask OpenStreetMap for in one go. */
  maxImportRadiusKm: 15,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  overpassUrl: process.env.EXPO_PUBLIC_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter',
};

export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);
