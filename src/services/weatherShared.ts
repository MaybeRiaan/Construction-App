export interface Weather {
  tempC: number;
  kind: 'sunny' | 'cloudy' | 'rain' | 'hot' | 'cold';
  label: string;
  /** True when this came from a live forecast rather than the demo. */
  live: boolean;
}

/** WMO weather codes → our coarse buckets. */
export function bucket(code: number, temp: number): Weather['kind'] {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) return 'rain';
  if (temp >= 28) return 'hot';
  if (temp <= 7) return 'cold';
  if (code >= 2) return 'cloudy';
  return 'sunny';
}

export const LABEL: Record<Weather['kind'], string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rain: 'Showers',
  hot: 'Hot',
  cold: 'Chilly',
};

export function demoWeather(): Weather {
  return { tempC: 23, kind: 'sunny', label: 'Sunny', live: false };
}

/** One line of advice and the quick filter it suggests. */
export function weatherTip(w: Weather): { text: string; intent: string | null } {
  switch (w.kind) {
    case 'rain':
      return { text: 'Showers about. Here are rainy-day ideas.', intent: 'rainy' };
    case 'hot':
      return { text: 'Scorcher! Splash pads and shady spots win today.', intent: null };
    case 'cold':
      return { text: 'Chilly out. Indoor play might be the move.', intent: 'rainy' };
    case 'cloudy':
      return { text: 'Mild and cloudy. Great for a long walk or the park.', intent: null };
    default:
      return { text: 'Great day to be outside. Parks and playgrounds are calling.', intent: 'energy' };
  }
}
