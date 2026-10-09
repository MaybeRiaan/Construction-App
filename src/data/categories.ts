import type { IconName } from '../ui/iconRegistry';
import type { AmenityId, CategoryId } from '../domain/types';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  short: string;
  icon: IconName;
  /** Pin and cover colour. Chosen to read on both the light and dark map. */
  color: string;
  /** Second colour for generated cover art. */
  tint: string;
  /** OpenStreetMap tags that import into this category. */
  osm: string[];
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'parks', label: 'Parks', short: 'Park', icon: 'trees', color: '#2E9E62', tint: '#9AD9A8', osm: ['leisure=park', 'leisure=garden', 'leisure=nature_reserve'] },
  { id: 'playgrounds', label: 'Playgrounds', short: 'Playground', icon: 'ferris', color: '#F2711C', tint: '#FFC08A', osm: ['leisure=playground'] },
  { id: 'walks', label: 'Walks', short: 'Walk', icon: 'footprints', color: '#0F9C8F', tint: '#8EDDD2', osm: ['route=hiking', 'highway=footway+scenic', 'tourism=viewpoint'] },
  { id: 'books', label: 'Books', short: 'Books', icon: 'book', color: '#7556F2', tint: '#C2B3FF', osm: ['amenity=library', 'shop=books'] },
  { id: 'indoor', label: 'Indoor play', short: 'Indoor play', icon: 'blocks', color: '#E8457A', tint: '#FFB0C8', osm: ['leisure=indoor_play', 'leisure=trampoline_park', 'leisure=amusement_arcade'] },
  { id: 'water', label: 'Splash & swim', short: 'Splash', icon: 'droplets', color: '#2C86F0', tint: '#9CC7FF', osm: ['leisure=water_park', 'leisure=swimming_pool+public', 'leisure=splash_pad', 'natural=beach'] },
  { id: 'animals', label: 'Animals', short: 'Animals', icon: 'paw', color: '#B07A22', tint: '#EBC889', osm: ['tourism=zoo', 'tourism=aquarium', 'animal=farm', 'zoo=petting_zoo'] },
  { id: 'museums', label: 'Museums', short: 'Museum', icon: 'landmark', color: '#4E62E6', tint: '#AEB9FF', osm: ['tourism=museum', 'museum=children', 'tourism=gallery'] },
  { id: 'cafes', label: 'Kid-friendly cafés', short: 'Café', icon: 'coffee', color: '#9A5A3A', tint: '#E1B79E', osm: ['amenity=cafe+kids_area', 'amenity=ice_cream'] },
  { id: 'events', label: 'Events', short: 'Event', icon: 'ticket', color: '#CC3E94', tint: '#F6A9D3', osm: [] },
  { id: 'sights', label: 'Cool sights', short: 'Sight', icon: 'binoculars', color: '#4A5363', tint: '#B5BDCA', osm: ['tourism=attraction', 'amenity=fire_station', 'railway=station+heritage'] },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryDef>;

export interface AmenityDef {
  id: AmenityId;
  label: string;
  icon: IconName;
}

export const AMENITIES: AmenityDef[] = [
  { id: 'toilets', label: 'Toilets', icon: 'toilet' },
  { id: 'babyChange', label: 'Baby change', icon: 'baby' },
  { id: 'parking', label: 'Parking', icon: 'parking' },
  { id: 'cafe', label: 'Café', icon: 'coffee' },
  { id: 'shade', label: 'Shade', icon: 'umbrella' },
  { id: 'fenced', label: 'Fenced', icon: 'fence' },
  { id: 'stroller', label: 'Pram-friendly', icon: 'baby' },
  { id: 'accessible', label: 'Accessible', icon: 'accessibility' },
  { id: 'fountain', label: 'Water fountain', icon: 'droplet' },
  { id: 'picnic', label: 'Picnic spots', icon: 'utensils' },
  { id: 'bbq', label: 'BBQs', icon: 'flame' },
  { id: 'covered', label: 'Rain cover', icon: 'umbrella' },
];

export const AMENITY_BY_ID = Object.fromEntries(AMENITIES.map((a) => [a.id, a])) as Record<AmenityId, AmenityDef>;

/** Quick "intent" tiles on Explore, Uber-style suggestions. */
export interface IntentDef {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
}

export const INTENTS: IntentDef[] = [
  { id: 'energy', label: 'Burn energy', hint: 'Playgrounds, trampolines, big lawns', icon: 'zap' },
  { id: 'rainy', label: 'Rainy day', hint: 'Indoor and covered spots', icon: 'umbrella' },
  { id: 'free', label: 'Free', hint: 'Costs nothing', icon: 'gift' },
  { id: 'quick', label: 'Close by', hint: 'Under 10 minutes away', icon: 'timer' },
  { id: 'little', label: 'Little ones', hint: 'Toddler-friendly and fenced', icon: 'baby' },
  { id: 'calm', label: 'Calm & quiet', hint: 'Books, gardens, gentle walks', icon: 'leaf' },
];
