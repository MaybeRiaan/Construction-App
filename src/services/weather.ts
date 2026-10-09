import type { LatLng } from '../domain/types';
import { bucket, demoWeather, LABEL, type Weather } from './weatherShared';

export { demoWeather, weatherTip, type Weather } from './weatherShared';

/** Current conditions from Open-Meteo (no key needed). Falls back to the demo. */
export async function fetchWeather(at: LatLng, signal?: AbortSignal): Promise<Weather> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${at.latitude.toFixed(3)}&longitude=${at.longitude.toFixed(3)}&current=temperature_2m,weather_code`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    const t = Math.round(j.current?.temperature_2m ?? 20);
    const kind = bucket(j.current?.weather_code ?? 0, t);
    return { tempC: t, kind, label: LABEL[kind], live: true };
  } catch {
    return demoWeather();
  }
}
