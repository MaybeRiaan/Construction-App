import type { CategoryId, RejectReason } from '../domain/types';
import type { IconName } from '../ui/iconRegistry';

/**
 * Scout points: what parents earn for adding places other families love.
 * Points only come from a reviewer's decision or other families' vibe
 * checks, never from the submitter's own actions, so they can later be
 * swapped for partner rewards without being gamed.
 */
export const SCOUT_POINTS = {
  /** A reviewer says the place is a vibe and it goes live. */
  added: 50,
  /** Other families rate it a vibe too (see LOVED). */
  loved: 25,
} as const;

/** "Families love it": this many vibe checks from other families, averaging this score or better. */
export const LOVED = { checks: 3, avg: 4 } as const;

export const SCOUT_RANKS: { min: number; title: string }[] = [
  { min: 0, title: 'New scout' },
  { min: 100, title: 'Local scout' },
  { min: 300, title: 'Super scout' },
  { min: 750, title: 'Legend scout' },
];

/** Places a family can have waiting for review at once. */
export const MAX_PENDING = 5;

/** Kinds of place parents can add. Events come from venues and calendars instead. */
export const ADDABLE_CATEGORIES: CategoryId[] = ['playgrounds', 'parks', 'walks', 'water', 'indoor', 'books', 'animals', 'museums', 'cafes', 'sights'];

export const REJECT_REASONS: { id: RejectReason; label: string; hint: string; icon: IconName }[] = [
  { id: 'duplicate', label: 'Already on Playdar', hint: 'Someone added it first, or it’s part of a place we have.', icon: 'layers' },
  { id: 'private', label: 'Not open to the public', hint: 'Homes, schools and members-only spots stay off the map.', icon: 'lock' },
  { id: 'not-for-kids', label: 'Not a fit for kids', hint: 'It isn’t somewhere families would take children.', icon: 'info' },
  { id: 'not-enough-info', label: 'Needs more detail', hint: 'We couldn’t tell what or where it is.', icon: 'help' },
  { id: 'closed', label: 'Closed for good', hint: 'It has shut or been removed.', icon: 'close' },
];

export const REJECT_REASON_BY_ID = Object.fromEntries(REJECT_REASONS.map((r) => [r.id, r])) as Record<RejectReason, (typeof REJECT_REASONS)[number]>;
