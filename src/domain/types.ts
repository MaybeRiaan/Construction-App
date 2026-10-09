export interface LatLng {
  latitude: number;
  longitude: number;
}

export type CategoryId =
  | 'parks'
  | 'playgrounds'
  | 'walks'
  | 'books'
  | 'indoor'
  | 'water'
  | 'animals'
  | 'museums'
  | 'cafes'
  | 'events'
  | 'sights';

export type AmenityId =
  | 'toilets'
  | 'babyChange'
  | 'parking'
  | 'cafe'
  | 'shade'
  | 'fenced'
  | 'stroller'
  | 'accessible'
  | 'fountain'
  | 'picnic'
  | 'bbq'
  | 'covered';

/** Age bands used for "best for" and vibe checks. */
export type AgeBand = 'baby' | 'toddler' | 'kid' | 'tween';

/** Weekly opening hours: minutes from midnight per weekday (0 = Sunday). `null` = closed. */
export interface OpeningHours {
  always?: boolean;
  days?: ([number, number] | null)[];
}

export interface VibeStats {
  count: number;
  /** Average score, 1–5. */
  avg: number;
  /** Count of checks per score, index 0 = score 1. */
  dist: [number, number, number, number, number];
  topTags: string[];
}

export interface Sponsorship {
  tier: 'featured' | 'spotlight';
  offer?: string;
  /** Short label shown on cards, e.g. "Partner". */
  label?: string;
}

export interface PlaceEvent {
  id: string;
  title: string;
  /** ISO start time. */
  startsAt: string;
  durationMin: number;
  price?: string;
  ages?: string;
  sponsored?: boolean;
}

export type PlaceSource = 'demo' | 'osm' | 'community' | 'business';

export interface Place {
  id: string;
  source: PlaceSource;
  name: string;
  category: CategoryId;
  coordinate: LatLng;
  area?: string;
  address?: string;
  blurb?: string;
  description?: string;
  highlights?: string[];
  amenities: AmenityId[];
  /** Recommended ages, inclusive. */
  ages: [number, number];
  /** 0 = free, 1–3 = $ to $$$. */
  price: 0 | 1 | 2 | 3;
  priceNote?: string;
  indoor: boolean;
  hours?: OpeningHours;
  durationHint?: string;
  website?: string;
  phone?: string;
  stats?: VibeStats;
  sponsored?: Sponsorship;
  events?: PlaceEvent[];
  keywords?: string[];
  /** Seed for the generated cover illustration. */
  coverSeed: number;
}

export type VibeScore = 1 | 2 | 3 | 4 | 5;

export interface VibeCheck {
  id: string;
  placeId: string;
  /** Short author label, e.g. "Parent of 2". Never a child's name. */
  author: string;
  authorId?: string;
  score: VibeScore;
  tags: string[];
  ages?: AgeBand[];
  note?: string;
  createdAt: string;
  /** Demo content shipped with the prototype. */
  sample?: boolean;
}

export type VehicleTypeId =
  | 'excavator'
  | 'bulldozer'
  | 'backhoe'
  | 'wheelLoader'
  | 'skidSteer'
  | 'dumpTruck'
  | 'towerCrane'
  | 'mobileCrane'
  | 'telehandler'
  | 'forklift'
  | 'cherryPicker'
  | 'roadRoller'
  | 'grader'
  | 'paver'
  | 'cementMixer'
  | 'concretePump'
  | 'pileDriver'
  | 'tractor'
  | 'garbageTruck'
  | 'fireEngine';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type MachineColour = 'yellow' | 'orange' | 'red' | 'green' | 'blue' | 'white' | 'other';

export interface Spot {
  id: string;
  typeId: VehicleTypeId;
  nickname?: string;
  colour?: MachineColour;
  /** Public spots are shown at a rounded location (see domain/privacy). */
  coordinate: LatLng;
  createdAt: string;
  /** Small JPEG data URL or remote URL. */
  photo?: string;
  ownerId: string;
  teamName?: string;
  /** Which child spotted it (own spots only, never shared). */
  kidId?: string;
  isPublic: boolean;
  sample?: boolean;
  area?: string;
  /** Set when this spot "finds" a famous machine someone else named. */
  foundOf?: string;
  aiConfidence?: number;
}

export type AvatarId = 'rocket' | 'cat' | 'dog' | 'bird' | 'fish' | 'rabbit' | 'turtle' | 'panda';

export interface Kid {
  id: string;
  name: string;
  age: number;
  avatar: AvatarId;
}

export interface HuntSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  path: LatLng[];
  spotIds: string[];
  distanceM: number;
  xpEarned: number;
}

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  xp: number;
  spots: number;
  types: number;
  isMe?: boolean;
  sample?: boolean;
}

export interface VoteTally {
  count: number;
  mine: boolean;
}
