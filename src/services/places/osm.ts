import { config } from '../../config';
import { distanceM } from '../../domain/geo';
import type { AmenityId, CategoryId, LatLng, OpeningHours, Place } from '../../domain/types';
import { appStorage } from '../storage';

/**
 * Live mode: import real kid-friendly places near the user from
 * OpenStreetMap via the Overpass API. Free, no key, worldwide. Results are
 * cached on the device for a day. Ratings come from Playdar users, not OSM.
 */

interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function overpassQuery(center: LatLng, radiusM: number): string {
  const a = `(around:${Math.round(radiusM)},${center.latitude.toFixed(5)},${center.longitude.toFixed(5)})`;
  const sel = [
    'nwr["leisure"="playground"]',
    'nwr["leisure"="park"]["name"]',
    'nwr["leisure"="garden"]["name"]["access"!="private"]',
    'nwr["leisure"="nature_reserve"]["name"]',
    'nwr["amenity"="library"]',
    'nwr["shop"="books"]',
    'nwr["leisure"="water_park"]',
    'nwr["leisure"="swimming_pool"]["name"]["access"!="private"]',
    'nwr["natural"="beach"]["name"]',
    'nwr["tourism"="zoo"]',
    'nwr["tourism"="aquarium"]',
    'nwr["tourism"="museum"]',
    'nwr["tourism"="theme_park"]',
    'nwr["leisure"="trampoline_park"]',
    'nwr["leisure"="indoor_play"]',
    'nwr["amenity"="ice_cream"]["name"]',
    'nwr["tourism"="viewpoint"]["name"]',
    'nwr["tourism"="attraction"]["name"]',
    'nwr["amenity"="fire_station"]["name"]',
  ];
  return `[out:json][timeout:25];(${sel.map((s) => `${s}${a};`).join('')});out center tags 500;`;
}

function categoryFor(t: Record<string, string>): CategoryId | null {
  if (t.leisure === 'playground') return t.playground === 'splash_pad' || t.playground === 'water_play' ? 'water' : 'playgrounds';
  if (t.leisure === 'park' || t.leisure === 'garden') return 'parks';
  if (t.leisure === 'nature_reserve' || t.tourism === 'viewpoint') return 'walks';
  if (t.amenity === 'library' || t.shop === 'books') return 'books';
  if (t.leisure === 'water_park' || t.leisure === 'swimming_pool' || t.natural === 'beach') return 'water';
  if (t.tourism === 'zoo' || t.tourism === 'aquarium') return 'animals';
  if (t.tourism === 'museum') return 'museums';
  if (t.leisure === 'trampoline_park' || t.leisure === 'indoor_play') return 'indoor';
  if (t.amenity === 'ice_cream') return 'cafes';
  if (t.tourism === 'theme_park' || t.tourism === 'attraction' || t.amenity === 'fire_station') return 'sights';
  return null;
}

const FALLBACK_NAME: Record<CategoryId, string> = {
  parks: 'Park',
  playgrounds: 'Playground',
  walks: 'Nature walk',
  books: 'Library',
  indoor: 'Indoor play',
  water: 'Splash pad',
  animals: 'Animal park',
  museums: 'Museum',
  cafes: 'Ice cream',
  events: 'Event',
  sights: 'Sight',
};

const DEFAULT_AGES: Record<CategoryId, [number, number]> = {
  parks: [0, 12],
  playgrounds: [1, 10],
  walks: [3, 12],
  books: [0, 12],
  indoor: [1, 10],
  water: [1, 12],
  animals: [1, 12],
  museums: [3, 12],
  cafes: [0, 12],
  events: [0, 12],
  sights: [1, 12],
};

const DAY_INDEX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

/** Parses the common subset of OSM opening_hours ("Mo-Fr 09:00-17:00; Sa,Su 10:00-16:00", "24/7"). */
export function parseOpeningHours(raw?: string): OpeningHours | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (s === '24/7') return { always: true };
  const days: ([number, number] | null)[] = [null, null, null, null, null, null, null];
  let matched = false;
  for (const rule of s.split(';').map((r) => r.trim()).filter(Boolean)) {
    const m = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!m) {
      if (/^(Mo|Tu|We|Th|Fr|Sa|Su)[-,A-Za-z\s]*off$/.test(rule)) continue;
      return undefined;
    }
    const span: [number, number] = [Number(m[2]) * 60 + Number(m[3]), Number(m[4]) * 60 + Number(m[5])];
    const which = new Set<number>();
    if (!m[1]) [0, 1, 2, 3, 4, 5, 6].forEach((d) => which.add(d));
    else
      for (const part of m[1].split(',').map((p) => p.trim())) {
        const [from, to] = part.split('-').map((p) => DAY_INDEX[p.trim()]);
        if (to === undefined) which.add(from);
        else for (let d = from; ; d = (d + 1) % 7) {
          which.add(d);
          if (d === to) break;
        }
      }
    which.forEach((d) => (days[d] = span));
    matched = true;
  }
  return matched ? { days } : undefined;
}

export function mapOsmElement(el: OsmElement, seedBase = 0): Place | null {
  const t = el.tags ?? {};
  const category = categoryFor(t);
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!category || lat == null || lon == null) return null;
  if (t.access === 'private' || t.access === 'customers') return null;
  const amenities: AmenityId[] = [];
  if (t.toilets === 'yes') amenities.push('toilets');
  if (t.changing_table === 'yes' || t.diaper === 'yes') amenities.push('babyChange');
  if (t.wheelchair === 'yes') amenities.push('accessible', 'stroller');
  if (t.covered === 'yes' || t.indoor === 'yes') amenities.push('covered');
  if (t.drinking_water === 'yes') amenities.push('fountain');
  if (t.barrier === 'fence' || t.fenced === 'yes') amenities.push('fenced');
  if (t.leisure === 'park') amenities.push('picnic');
  const street = t['addr:street'];
  const name = t.name ?? (street ? `${FALLBACK_NAME[category]} on ${street}` : `Local ${FALLBACK_NAME[category].toLowerCase()}`);
  const indoor = ['books', 'indoor', 'museums'].includes(category) || t.indoor === 'yes' || (t.leisure === 'swimming_pool' && t.indoor === 'yes');
  const minAge = Number(t['min_age'] ?? t['playground:min_age']);
  const maxAge = Number(t['max_age'] ?? t['playground:max_age']);
  return {
    id: `osm:${el.type}/${el.id}`,
    source: 'osm',
    name,
    category,
    coordinate: { latitude: lat, longitude: lon },
    area: t['addr:suburb'] ?? t['addr:city'],
    address: [t['addr:housenumber'], street].filter(Boolean).join(' ') || undefined,
    blurb: t.description?.slice(0, 120),
    amenities: [...new Set(amenities)],
    ages: [Number.isFinite(minAge) ? minAge : DEFAULT_AGES[category][0], Number.isFinite(maxAge) ? maxAge : DEFAULT_AGES[category][1]],
    price: t.fee === 'yes' ? 1 : 0,
    indoor,
    hours: parseOpeningHours(t.opening_hours),
    website: t.website ?? t['contact:website'],
    phone: t.phone ?? t['contact:phone'],
    keywords: [t.leisure, t.amenity, t.tourism, t.shop, t.playground].filter(Boolean) as string[],
    coverSeed: (el.id + seedBase) % 100000,
  };
}

interface CacheEntry {
  at: number;
  center: LatLng;
  radiusM: number;
  places: Place[];
}

const CACHE_KEY = 'playdar.osm.cache.v1';

export async function importNearby(center: LatLng, radiusKm: number, signal?: AbortSignal): Promise<Place[]> {
  const radiusM = Math.min(radiusKm, config.maxImportRadiusKm) * 1000;
  try {
    const raw = await appStorage.getItem(CACHE_KEY);
    if (raw) {
      const c = JSON.parse(raw) as CacheEntry;
      if (Date.now() - c.at < 86400000 && distanceM(c.center, center) < 1500 && c.radiusM >= radiusM) return c.places;
    }
  } catch {
    // ignore a bad cache
  }
  const res = await fetch(config.overpassUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(overpassQuery(center, radiusM))}`,
    signal,
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  const json = (await res.json()) as { elements?: OsmElement[] };
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const el of json.elements ?? []) {
    const p = mapOsmElement(el);
    if (!p) continue;
    // OSM often has a park and its playground as separate features with the same name; keep both but dedupe exact repeats.
    const key = `${p.name}|${p.category}|${p.coordinate.latitude.toFixed(4)}|${p.coordinate.longitude.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(p);
  }
  try {
    await appStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), center, radiusM, places } satisfies CacheEntry));
  } catch {
    // cache is best-effort
  }
  return places;
}
