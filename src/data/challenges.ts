import type { VehicleTypeId } from '../domain/types';
import type { IconName } from '../ui/iconRegistry';

export type ChallengeKind =
  | 'firstSpot'
  | 'distinctTypes'
  | 'typeCount'
  | 'daily'
  | 'colours'
  | 'named'
  | 'famous'
  | 'set'
  | 'bingo'
  | 'streak'
  | 'legendary';

export type Cadence = 'once' | 'daily' | 'weekly';

export interface ChallengeDef {
  id: string;
  title: string;
  /** Rules in one sentence, written for a parent to read aloud. */
  description: string;
  icon: IconName;
  kind: ChallengeKind;
  target: number;
  types?: VehicleTypeId[];
  cadence: Cadence;
  xp: number;
  badge?: BadgeId;
}

export type BadgeId =
  | 'first-spot'
  | 'big-ten'
  | 'crane-spotter'
  | 'rainbow'
  | 'road-crew'
  | 'bingo'
  | 'famous-finder'
  | 'legend'
  | 'namer'
  | 'streak'
  | 'full-yard'
  | 'daily';

export const CHALLENGES: ChallengeDef[] = [
  { id: 'daily', title: "Today's mission", description: 'Spot the machine of the day before bedtime.', icon: 'target', kind: 'daily', target: 1, cadence: 'daily', xp: 30, badge: 'daily' },
  { id: 'first-spot', title: 'First spot', description: 'Snap your very first construction machine.', icon: 'camera', kind: 'firstSpot', target: 1, cadence: 'once', xp: 20, badge: 'first-spot' },
  { id: 'big-ten', title: 'The Big Ten', description: 'Be the first in the family to spot 10 different machines.', icon: 'trophy', kind: 'distinctTypes', target: 10, cadence: 'once', xp: 150, badge: 'big-ten' },
  { id: 'bingo', title: 'Digger Bingo', description: 'Fill a row, column or diagonal on this week’s bingo card.', icon: 'grid', kind: 'bingo', target: 1, cadence: 'weekly', xp: 100, badge: 'bingo' },
  { id: 'rainbow', title: 'Rainbow hunt', description: 'Spot machines in 5 different colours.', icon: 'palette', kind: 'colours', target: 5, cadence: 'once', xp: 80, badge: 'rainbow' },
  { id: 'cranes', title: 'Crane spotter', description: 'Spot 3 cranes. Tower or mobile both count.', icon: 'construction', kind: 'typeCount', target: 3, types: ['towerCrane', 'mobileCrane'], cadence: 'once', xp: 60, badge: 'crane-spotter' },
  { id: 'road-crew', title: 'Road crew', description: 'Find the whole road crew: a roller, a grader and a paver.', icon: 'route', kind: 'set', target: 3, types: ['roadRoller', 'grader', 'paver'], cadence: 'once', xp: 120, badge: 'road-crew' },
  { id: 'name-game', title: 'Name game', description: 'Give 3 machines a name. Other hunters vote for the best ones.', icon: 'pencil', kind: 'named', target: 3, cadence: 'once', xp: 40, badge: 'namer' },
  { id: 'famous', title: 'Famous finder', description: 'Track down 2 famous machines that other families named.', icon: 'binoculars', kind: 'famous', target: 2, cadence: 'once', xp: 90, badge: 'famous-finder' },
  { id: 'legend', title: 'Legend', description: 'Spot a legendary machine. Listen for the BOOM of a pile driver.', icon: 'crown', kind: 'legendary', target: 1, cadence: 'once', xp: 150, badge: 'legend' },
  { id: 'streak', title: 'On a roll', description: 'Go hunting 3 days in a row.', icon: 'flame', kind: 'streak', target: 3, cadence: 'once', xp: 60, badge: 'streak' },
  { id: 'full-yard', title: 'Full yard', description: 'Collect every machine in the Yard.', icon: 'hardHat', kind: 'distinctTypes', target: 20, cadence: 'once', xp: 500, badge: 'full-yard' },
];

export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c])) as Record<string, ChallengeDef>;

export interface BadgeDef {
  id: BadgeId;
  name: string;
  icon: IconName;
  color: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-spot', name: 'First Spot', icon: 'camera', color: '#FFC21A' },
  { id: 'daily', name: 'Mission Done', icon: 'target', color: '#F2711C' },
  { id: 'big-ten', name: 'Big Ten', icon: 'trophy', color: '#E2A100' },
  { id: 'bingo', name: 'Bingo!', icon: 'grid', color: '#CC3E94' },
  { id: 'rainbow', name: 'Rainbow Hunter', icon: 'palette', color: '#7556F2' },
  { id: 'crane-spotter', name: 'Crane Spotter', icon: 'construction', color: '#2C86F0' },
  { id: 'road-crew', name: 'Road Crew', icon: 'route', color: '#4A5363' },
  { id: 'namer', name: 'Name Game', icon: 'pencil', color: '#0F9C8F' },
  { id: 'famous-finder', name: 'Famous Finder', icon: 'binoculars', color: '#2E9E62' },
  { id: 'legend', name: 'Legend', icon: 'crown', color: '#B4549B' },
  { id: 'streak', name: 'On a Roll', icon: 'flame', color: '#D93D42' },
  { id: 'full-yard', name: 'Full Yard', icon: 'hardHat', color: '#101216' },
];

export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b])) as Record<BadgeId, BadgeDef>;

export const LEVELS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: 'Site Visitor' },
  { level: 2, xp: 100, title: 'Hard Hat Rookie' },
  { level: 3, xp: 250, title: 'Cone Captain' },
  { level: 4, xp: 450, title: 'Dirt Detective' },
  { level: 5, xp: 700, title: 'Digger Scout' },
  { level: 6, xp: 1000, title: 'Crane Watcher' },
  { level: 7, xp: 1400, title: 'Site Supervisor' },
  { level: 8, xp: 1900, title: 'Foreman' },
  { level: 9, xp: 2500, title: 'Chief Engineer' },
  { level: 10, xp: 3200, title: 'Master Builder' },
];
