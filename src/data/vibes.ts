import type { AgeBand, VibeScore } from '../domain/types';
import type { IconName } from '../ui/iconRegistry';

export interface VibeLevel {
  score: VibeScore;
  label: string;
  short: string;
  icon: IconName;
}

/** The five steps of a vibe check. Parents answer one question: was it a vibe? */
export const VIBE_LEVELS: VibeLevel[] = [
  { score: 1, label: 'Not a vibe', short: 'Nope', icon: 'frown' },
  { score: 2, label: 'Meh', short: 'Meh', icon: 'meh' },
  { score: 3, label: 'Decent', short: 'Decent', icon: 'smile' },
  { score: 4, label: 'Good vibes', short: 'Good', icon: 'grin' },
  { score: 5, label: 'Total vibe', short: 'Total vibe', icon: 'sparkles' },
];

export interface VibeTagDef {
  id: string;
  label: string;
  /** Positive tags count toward highlights; others are honest warnings. */
  tone: 'good' | 'heads-up';
}

export const VIBE_TAGS: VibeTagDef[] = [
  { id: 'clean-toilets', label: 'Clean toilets', tone: 'good' },
  { id: 'shady', label: 'Plenty of shade', tone: 'good' },
  { id: 'fenced', label: 'Fully fenced', tone: 'good' },
  { id: 'toddlers', label: 'Great for toddlers', tone: 'good' },
  { id: 'big-kids', label: 'Great for big kids', tone: 'good' },
  { id: 'easy-parking', label: 'Easy parking', tone: 'good' },
  { id: 'coffee', label: 'Good coffee nearby', tone: 'good' },
  { id: 'pram', label: 'Pram-friendly', tone: 'good' },
  { id: 'lots-to-do', label: 'Lots to do', tone: 'good' },
  { id: 'friendly-staff', label: 'Friendly staff', tone: 'good' },
  { id: 'quiet', label: 'Calm & quiet', tone: 'good' },
  { id: 'value', label: 'Great value', tone: 'good' },
  { id: 'busy', label: 'Gets busy', tone: 'heads-up' },
  { id: 'no-shade', label: 'Not much shade', tone: 'heads-up' },
  { id: 'pricey', label: 'Pricey', tone: 'heads-up' },
  { id: 'needs-tlc', label: 'Needs some TLC', tone: 'heads-up' },
];

export const VIBE_TAG_BY_ID = Object.fromEntries(VIBE_TAGS.map((t) => [t.id, t])) as Record<string, VibeTagDef>;

export const AGE_BANDS: { id: AgeBand; label: string; range: [number, number] }[] = [
  { id: 'baby', label: 'Babies', range: [0, 1] },
  { id: 'toddler', label: 'Toddlers', range: [2, 4] },
  { id: 'kid', label: 'Kids', range: [5, 8] },
  { id: 'tween', label: 'Big kids', range: [9, 12] },
];

export function ageBandFor(age: number): AgeBand {
  if (age <= 1) return 'baby';
  if (age <= 4) return 'toddler';
  if (age <= 8) return 'kid';
  return 'tween';
}
