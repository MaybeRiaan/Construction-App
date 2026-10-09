import type { LatLng } from '../domain/types';
import { demoWeather, type Weather } from './weatherShared';

export { demoWeather, weatherTip, type Weather } from './weatherShared';

/** The web build runs the demo town (and artifacts cannot reach weather APIs). */
export async function fetchWeather(_at: LatLng, _signal?: AbortSignal): Promise<Weather> {
  return demoWeather();
}
