import type { OpeningHours } from './types';

export const hoursAlways: OpeningHours = { always: true };

/** Same hours every day. */
export function daily(open: number, close: number): OpeningHours {
  return { days: Array.from({ length: 7 }, () => [open * 60, close * 60] as [number, number]) };
}

/** Separate weekday (Mon–Fri) and weekend hours; `null` means closed. */
export function split(weekday: [number, number] | null, weekend: [number, number] | null): OpeningHours {
  const wd = weekday ? ([weekday[0] * 60, weekday[1] * 60] as [number, number]) : null;
  const we = weekend ? ([weekend[0] * 60, weekend[1] * 60] as [number, number]) : null;
  return { days: [we, wd, wd, wd, wd, wd, we] };
}

function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${suffix}` : `${h12}${suffix}`;
}

export interface OpenState {
  open: boolean;
  label: string;
  /** Closing within the hour. */
  closingSoon?: boolean;
}

export function openState(hours: OpeningHours | undefined, now = new Date()): OpenState {
  if (!hours) return { open: true, label: 'Hours vary' };
  if (hours.always) return { open: true, label: 'Open any time' };
  const days = hours.days ?? [];
  const dow = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = days[dow];
  if (today && minutes >= today[0] && minutes < today[1]) {
    const left = today[1] - minutes;
    return { open: true, label: `Open until ${fmt(today[1])}`, closingSoon: left <= 60 };
  }
  if (today && minutes < today[0]) return { open: false, label: `Opens ${fmt(today[0])}` };
  for (let i = 1; i <= 7; i++) {
    const d = days[(dow + i) % 7];
    if (d) {
      const dayName = i === 1 ? 'tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(dow + i) % 7];
      return { open: false, label: `Opens ${dayName} ${fmt(d[0])}` };
    }
  }
  return { open: false, label: 'Closed' };
}

export function hoursTable(hours: OpeningHours | undefined): { day: string; text: string }[] {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!hours) return [];
  if (hours.always) return [{ day: 'Every day', text: 'Open any time' }];
  return names.map((day, i) => {
    const d = hours.days?.[(i + 1) % 7];
    return { day, text: d ? `${fmt(d[0])} – ${fmt(d[1])}` : 'Closed' };
  });
}
