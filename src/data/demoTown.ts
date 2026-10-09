/**
 * "Riverbend" — the fictional demo town that ships with the prototype.
 *
 * Every place is defined by an offset in metres from a centre point, so the
 * same town can be dropped around any coordinate (the web demo uses a fixed
 * centre; native builds in demo mode use the device location). Live mode
 * replaces all of this with real places imported from OpenStreetMap.
 */
import { offset } from '../domain/geo';
import { daily, hoursAlways, split } from '../domain/hours';
import { makeStats } from '../domain/vibe';
import type { AmenityId, CategoryId, LatLng, OpeningHours, Place, PlaceEvent, Sponsorship, VibeCheck } from '../domain/types';

export const DEMO_TOWN_NAME = 'Riverbend';

/** Areas used for map labels and place subtitles (metres from centre). */
export const DEMO_AREAS = [
  { name: 'Riverbend', x: -200, y: 1150 },
  { name: 'Kestrel Hill', x: -2900, y: 2850 },
  { name: 'Old Mill', x: 3150, y: 1450 },
  { name: 'Fernleaf', x: 1700, y: -2300 },
  { name: 'Bluebell', x: -4500, y: 450 },
  { name: 'Willow Lake', x: 5200, y: 2850 },
  { name: 'Station Quarter', x: 4100, y: -1900 },
  { name: 'Southgate', x: -1700, y: -2700 },
];

/** Geography shared with the stylised web map so parks sit on green and walks follow the river. */
export const DEMO_GEO = {
  river: [
    [-13000, -500], [-10000, -1150], [-7200, -650], [-4800, -1200], [-2600, -1000],
    [-1200, -520], [200, -380], [1500, -620], [2800, -300], [4300, -760],
    [6400, -380], [8800, -980], [13000, -520],
  ] as [number, number][],
  riverWidth: 70,
  lake: { x: 5000, y: 2050, r: 640 },
  parks: [
    { x: 300, y: 450, r: 430 },
    { x: -2650, y: 2150, r: 680 },
    { x: 1900, y: -1450, r: 400 },
    { x: -900, y: -720, r: 170 },
    { x: 3200, y: 900, r: 270 },
    { x: -4250, y: -420, r: 760 },
    { x: 2500, y: -2150, r: 360 },
    { x: -3150, y: -1650, r: 210 },
    { x: 4200, y: -620, r: 190 },
    { x: -1800, y: 600, r: 150 },
    { x: 700, y: -2250, r: 150 },
    { x: -4550, y: 2950, r: 420 },
  ],
  townRadius: 5600,
};

const HOUR = 60;

function hoursOf(spec: 'always' | OpeningHours): OpeningHours {
  return spec === 'always' ? hoursAlways : spec;
}

/** Next occurrence of a weekday (0 = Sunday) at a local time, at least an hour from now. */
function next(dow: number, hour: number, minute = 0): string {
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  let add = (dow - now.getDay() + 7) % 7;
  if (add === 0 && d.getTime() - now.getTime() < HOUR * 60 * 1000) add = 7;
  d.setDate(d.getDate() + add);
  return d.toISOString();
}

function inDays(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

interface Raw {
  id: string;
  name: string;
  category: CategoryId;
  x: number;
  y: number;
  area: string;
  address: string;
  blurb: string;
  description: string;
  highlights: string[];
  amenities: AmenityId[];
  ages: [number, number];
  price: 0 | 1 | 2 | 3;
  priceNote?: string;
  indoor: boolean;
  hours: 'always' | OpeningHours;
  duration: string;
  vibe: [avg: number, count: number, tags: string[]];
  keywords?: string[];
  sponsored?: Sponsorship;
  events?: () => PlaceEvent[];
}

const RAW: Raw[] = [
  // Parks ------------------------------------------------------------------
  {
    id: 'riverbend-commons', name: 'Riverbend Commons', category: 'parks', x: 300, y: 450, area: 'Riverbend', address: 'Commons Rd',
    blurb: 'Big lawns, a duck pond and the best picnic trees in town.',
    description: 'The town’s main park. Wide flat paths loop the duck pond, there are huge shady oaks for picnics, and the kiosk does ice blocks in summer. Lots of space for scooters and kites.',
    highlights: ['Duck pond with a viewing jetty', 'Scooter-friendly loop path', 'Kiosk open on weekends'],
    amenities: ['toilets', 'babyChange', 'parking', 'shade', 'stroller', 'accessible', 'fountain', 'picnic', 'bbq', 'cafe'],
    ages: [0, 12], price: 0, indoor: false, hours: 'always', duration: '1–3 hrs',
    vibe: [4.6, 214, ['shady', 'pram', 'clean-toilets', 'lots-to-do', 'busy']], keywords: ['ducks', 'picnic', 'kites', 'scooter', 'pond', 'lawn'],
    events: () => [
      { id: 'puppets', title: 'Open-air puppet show', startsAt: next(6, 15, 0), durationMin: 45, price: 'Free', ages: '2–7' },
    ],
  },
  {
    id: 'kestrel-hill', name: 'Kestrel Hill Reserve', category: 'parks', x: -2650, y: 2150, area: 'Kestrel Hill', address: 'Summit Rd',
    blurb: 'Hilltop meadow with views across town. Bring a kite.',
    description: 'Windy grassy hilltop with a lookout over the whole valley. It is the best kite spot for miles and there is a rope swing on the old gum at the top. Steep in parts, so a carrier beats a pram.',
    highlights: ['360° lookout', 'Kite flying meadow', 'Rope swing on the summit tree'],
    amenities: ['parking', 'picnic', 'fountain'],
    ages: [3, 12], price: 0, indoor: false, hours: 'always', duration: '1–2 hrs',
    vibe: [4.4, 96, ['big-kids', 'quiet', 'no-shade']], keywords: ['kite', 'views', 'hill', 'sunset', 'lookout'],
  },
  {
    id: 'fernleaf-gardens', name: 'Fernleaf Gardens', category: 'parks', x: 1900, y: -1450, area: 'Fernleaf', address: '2 Garden Way',
    blurb: 'Botanic gardens with a fairy trail and a giant hedge maze.',
    description: 'Calm, beautiful gardens with a short fairy-door trail, a hedge maze that is just the right size for under-8s, and a glasshouse full of carnivorous plants that kids love.',
    highlights: ['Fairy door trail', 'Hedge maze', 'Carnivorous plant glasshouse'],
    amenities: ['toilets', 'babyChange', 'cafe', 'shade', 'stroller', 'accessible', 'picnic'],
    ages: [2, 10], price: 0, indoor: false, hours: daily(7, 18), duration: '1–2 hrs',
    vibe: [4.7, 158, ['quiet', 'pram', 'clean-toilets', 'coffee']], keywords: ['fairy', 'maze', 'garden', 'flowers', 'glasshouse', 'calm'],
  },
  {
    id: 'lantern-park', name: 'Lantern Park', category: 'parks', x: -900, y: -720, area: 'Riverbend', address: 'Lantern St',
    blurb: 'Small neighbourhood park with a fenced toddler corner.',
    description: 'A little local park that does the basics well: a fenced toddler play corner, a sandpit with diggers left by locals, and benches in the shade for parents.',
    highlights: ['Fenced toddler corner', 'Sandpit with community diggers', 'Quiet on weekdays'],
    amenities: ['fenced', 'shade', 'stroller', 'fountain'],
    ages: [0, 5], price: 0, indoor: false, hours: 'always', duration: '30–60 min',
    vibe: [4.2, 61, ['fenced', 'toddlers', 'quiet']], keywords: ['sandpit', 'toddler', 'fenced', 'local'],
  },
  {
    id: 'old-mill-green', name: 'Old Mill Green', category: 'parks', x: 3200, y: 900, area: 'Old Mill', address: 'Mill Lane',
    blurb: 'Village green with a working water wheel and a pump track.',
    description: 'A green beside the old flour mill. The water wheel still turns, there is a beginner bike pump track, and the café in the mill does great babycinos.',
    highlights: ['Working water wheel', 'Beginner pump track', 'Mill café'],
    amenities: ['toilets', 'cafe', 'parking', 'picnic', 'stroller'],
    ages: [3, 12], price: 0, indoor: false, hours: 'always', duration: '1–2 hrs',
    vibe: [4.3, 77, ['big-kids', 'coffee', 'easy-parking']], keywords: ['bike', 'pump track', 'water wheel', 'mill', 'scooter'],
  },

  // Playgrounds -------------------------------------------------------------
  {
    id: 'big-dig', name: 'The Big Dig Adventure Playground', category: 'playgrounds', x: 1250, y: 1500, area: 'Riverbend', address: '40 Quarry Rd',
    blurb: 'A construction-themed playground with ride-on diggers.',
    description: 'Built on an old quarry. Kids can work real (kid-sized) diggers in the sand pit, climb a crane tower and slide down a dump truck tray. A must for little machine lovers and a Hard Hat Hunt favourite.',
    highlights: ['Ride-on sand diggers', 'Climbable crane tower', 'Dump truck slide'],
    amenities: ['toilets', 'babyChange', 'parking', 'shade', 'fenced', 'picnic', 'fountain'],
    ages: [2, 10], price: 0, indoor: false, hours: daily(7, 19), duration: '1–2 hrs',
    vibe: [4.8, 302, ['lots-to-do', 'fenced', 'big-kids', 'busy']], keywords: ['digger', 'construction', 'sand', 'crane', 'slide', 'trucks'],
  },
  {
    id: 'rocket-park', name: 'Rocket Park', category: 'playgrounds', x: -1800, y: 600, area: 'Riverbend', address: 'Orbit Ave',
    blurb: 'Space-themed playground with a three-storey rocket tower.',
    description: 'A classic: the rocket climbing tower has three levels and a twisty slide out of the top. There is a separate little-kid area with a mini moon buggy and soft fall everywhere.',
    highlights: ['Three-level rocket tower', 'Moon buggy for toddlers', 'Soft-fall surfaces'],
    amenities: ['toilets', 'shade', 'fenced', 'picnic', 'stroller'],
    ages: [2, 10], price: 0, indoor: false, hours: 'always', duration: '1 hr',
    vibe: [4.5, 188, ['lots-to-do', 'fenced', 'toddlers']], keywords: ['space', 'rocket', 'climb', 'slide'],
  },
  {
    id: 'treetop-play', name: 'Treetop Nature Play', category: 'playgrounds', x: -3150, y: -1650, area: 'Southgate', address: 'Bush Track',
    blurb: 'Wild timber play space with rope bridges and a creek.',
    description: 'Logs, boulders, rope bridges and a shallow creek to splash in. Less polished than the big parks but the kids stay for hours. Bring spare clothes.',
    highlights: ['Rope bridges', 'Shallow creek', 'Cubby building zone'],
    amenities: ['shade', 'picnic', 'parking'],
    ages: [4, 12], price: 0, indoor: false, hours: 'always', duration: '1–3 hrs',
    vibe: [4.6, 121, ['big-kids', 'shady', 'quiet']], keywords: ['nature', 'creek', 'rope', 'muddy', 'cubby', 'adventure'],
  },
  {
    id: 'splash-lane-toddler', name: 'Little Steps Toddler Park', category: 'playgrounds', x: 700, y: -2250, area: 'Fernleaf', address: 'Daisy Ct',
    blurb: 'Fully fenced and built for under-4s.',
    description: 'Small, soft and fully fenced with one gate. Low slides, a sensory wall, baby swings and a covered sandpit. Very calm on weekday mornings.',
    highlights: ['One-gate fence', 'Baby swings', 'Covered sandpit'],
    amenities: ['fenced', 'shade', 'stroller', 'babyChange', 'toilets', 'covered'],
    ages: [0, 4], price: 0, indoor: false, hours: daily(6, 20), duration: '45 min',
    vibe: [4.7, 143, ['toddlers', 'fenced', 'clean-toilets', 'quiet']], keywords: ['toddler', 'baby', 'swings', 'sensory', 'fenced'],
  },
  {
    id: 'pirate-cove', name: 'Pirate Cove Playground', category: 'playgrounds', x: 4200, y: -620, area: 'Station Quarter', address: 'Wharf St',
    blurb: 'A full-size pirate ship by the river.',
    description: 'Climb the rigging, man the cannons and walk the plank (onto soft fall). The ship sits right on the river so you can watch boats while you play.',
    highlights: ['Climbable pirate ship', 'River views', 'Water play pump'],
    amenities: ['toilets', 'shade', 'picnic', 'cafe', 'parking'],
    ages: [3, 10], price: 0, indoor: false, hours: 'always', duration: '1 hr',
    vibe: [4.4, 109, ['lots-to-do', 'coffee', 'busy']], keywords: ['pirate', 'ship', 'boats', 'river', 'water play'],
  },

  // Walks ------------------------------------------------------------------
  {
    id: 'willow-loop', name: 'Willow River Loop', category: 'walks', x: -500, y: -170, area: 'Riverbend', address: 'Start at the footbridge',
    blurb: 'Flat 3.2 km river loop. Pram-friendly the whole way.',
    description: 'A smooth sealed path along both banks, crossing two footbridges. Spot ducks, rowers and the Big Dig bridge works. Benches every few hundred metres and a coffee cart at the halfway point.',
    highlights: ['3.2 km, flat and sealed', 'Two footbridges', 'Coffee cart halfway'],
    amenities: ['stroller', 'accessible', 'shade', 'fountain', 'toilets'],
    ages: [0, 12], price: 0, indoor: false, hours: 'always', duration: '45–75 min',
    vibe: [4.7, 236, ['pram', 'shady', 'coffee', 'quiet']], keywords: ['walk', 'river', 'pram', 'scooter', 'ducks', 'bridge', 'loop'],
  },
  {
    id: 'kestrel-summit', name: 'Kestrel Hill Summit Track', category: 'walks', x: -2950, y: 2550, area: 'Kestrel Hill', address: 'Summit Rd car park',
    blurb: '1.8 km climb with a big view at the top.',
    description: 'A short but steep zigzag through tall grass to the summit lookout. Little legs manage it with snack stops. Hawks often hover over the top.',
    highlights: ['Big valley view', 'Hawk spotting', 'Snack stops on the way'],
    amenities: ['parking'],
    ages: [4, 12], price: 0, indoor: false, hours: 'always', duration: '1 hr',
    vibe: [4.3, 64, ['big-kids', 'quiet', 'no-shade']], keywords: ['hike', 'hill', 'view', 'birds'],
  },
  {
    id: 'bluebell-woods', name: 'Bluebell Woods Fairy Trail', category: 'walks', x: -4250, y: -420, area: 'Bluebell', address: 'Woodland Rd',
    blurb: 'Shady woodland loop with 20 hidden fairy doors.',
    description: 'A gentle 1.5 km loop under tall trees with tiny fairy doors hidden in the trunks. Pick up a free spotter sheet from the box at the start. Magical in spring when the bluebells are out.',
    highlights: ['20 hidden fairy doors', 'Free spotter sheet', 'Bluebells in spring'],
    amenities: ['shade', 'parking', 'picnic'],
    ages: [2, 9], price: 0, indoor: false, hours: daily(6, 20), duration: '45 min',
    vibe: [4.8, 175, ['shady', 'quiet', 'toddlers']], keywords: ['fairy', 'woods', 'forest', 'trail', 'magic'],
  },
  {
    id: 'fernleaf-boardwalk', name: 'Fernleaf Wetland Boardwalk', category: 'walks', x: 2500, y: -2150, area: 'Fernleaf', address: 'Heron Rd',
    blurb: 'Raised boardwalk over the wetlands. Frogs, herons, turtles.',
    description: 'An 800 m raised boardwalk with bird hides and frog-listening posts. Flat and pram-friendly. Go at dusk to hear the frog chorus.',
    highlights: ['Bird hides', 'Frog listening posts', 'Turtle spotting'],
    amenities: ['stroller', 'accessible', 'parking'],
    ages: [0, 12], price: 0, indoor: false, hours: daily(6, 21), duration: '30–45 min',
    vibe: [4.5, 88, ['pram', 'quiet']], keywords: ['birds', 'frogs', 'wetland', 'nature', 'boardwalk'],
  },

  // Books ------------------------------------------------------------------
  {
    id: 'little-owl', name: 'Little Owl Books', category: 'books', x: 150, y: 950, area: 'Riverbend', address: '12 High St',
    blurb: 'Independent kids bookshop with a reading treehouse.',
    description: 'A tiny shop packed with picture books, a reading treehouse in the corner and staff who know every dinosaur book ever printed. Story time every Saturday at 10.',
    highlights: ['Reading treehouse', 'Saturday story time', 'Staff picks by age'],
    amenities: ['stroller', 'covered'],
    ages: [0, 12], price: 1, priceNote: 'Free to browse', indoor: true, hours: split([9, 17.5], [9, 16]), duration: '30–60 min',
    vibe: [4.9, 132, ['friendly-staff', 'quiet', 'toddlers']], keywords: ['books', 'story time', 'reading', 'dinosaurs', 'bookshop'],
    events: () => [
      { id: 'owl-story', title: 'Saturday story time', startsAt: next(6, 10), durationMin: 40, price: 'Free', ages: '2–6' },
    ],
  },
  {
    id: 'riverbend-library', name: 'Riverbend Library', category: 'books', x: -350, y: 1300, area: 'Riverbend', address: '1 Civic Square',
    blurb: 'Free baby rhyme time, Lego club and a toy library.',
    description: 'A bright children’s floor with beanbags, puzzles and a toy library you can borrow from. Rhyme time for babies on Tuesday mornings and Lego club after school on Thursdays.',
    highlights: ['Baby rhyme time (Tue)', 'Lego club (Thu)', 'Toy library'],
    amenities: ['toilets', 'babyChange', 'stroller', 'accessible', 'covered', 'fountain'],
    ages: [0, 12], price: 0, indoor: true, hours: split([9, 19], [10, 16]), duration: '1 hr',
    vibe: [4.7, 167, ['clean-toilets', 'quiet', 'toddlers', 'value']], keywords: ['library', 'rhyme time', 'lego', 'toys', 'free', 'rainy day'],
    events: () => [
      { id: 'rhyme', title: 'Baby rhyme time', startsAt: next(2, 10, 30), durationMin: 30, price: 'Free', ages: '0–2' },
      { id: 'lego', title: 'Lego club', startsAt: next(4, 15, 30), durationMin: 60, price: 'Free', ages: '5–11' },
    ],
  },
  {
    id: 'reading-nook', name: 'The Reading Nook', category: 'books', x: 2150, y: 380, area: 'Old Mill', address: '8 Mill Lane',
    blurb: 'Second-hand books and a play corner, with coffee.',
    description: 'A cosy second-hand bookshop with a big kids section, a play corner with a wooden train set and a coffee counter. Swap two books for one.',
    highlights: ['Book swap', 'Wooden train set', 'Coffee counter'],
    amenities: ['cafe', 'covered', 'stroller'],
    ages: [1, 10], price: 1, priceNote: 'Books from $2', indoor: true, hours: split([8, 17], [8, 15]), duration: '45 min',
    vibe: [4.4, 58, ['coffee', 'quiet', 'value']], keywords: ['books', 'second hand', 'trains', 'coffee'],
  },

  // Indoor play ------------------------------------------------------------
  {
    id: 'jumpin-jungle', name: "Jumpin' Jungle", category: 'indoor', x: -2200, y: -2300, area: 'Southgate', address: 'Unit 4, Southgate Park',
    blurb: 'Trampoline park with a toddler zone and ninja course.',
    description: 'Wall-to-wall trampolines, a foam pit, a ninja warrior course for big kids and a separate soft toddler zone. Grip socks required (sold at the desk).',
    highlights: ['Foam pit', 'Ninja course', 'Toddler-only sessions'],
    amenities: ['toilets', 'babyChange', 'cafe', 'parking', 'covered', 'accessible'],
    ages: [1, 14], price: 2, priceNote: 'From $16 per jumper', indoor: true, hours: daily(9, 19), duration: '1–2 hrs',
    vibe: [4.3, 245, ['lots-to-do', 'big-kids', 'busy', 'pricey']], keywords: ['trampoline', 'jump', 'ninja', 'rainy day', 'birthday', 'energy'],
    sponsored: { tier: 'featured', label: 'Partner', offer: '15% off weekday jumps with Playdar' },
    events: () => [
      { id: 'tots', title: 'Tiny tots jump (under 5s)', startsAt: next(3, 9, 30), durationMin: 60, price: '$10', ages: '1–5', sponsored: true },
    ],
  },
  {
    id: 'little-builders', name: 'Little Builders Soft Play', category: 'indoor', x: 3350, y: 2400, area: 'Old Mill', address: '22 Foundry St',
    blurb: 'Soft play built like a building site. Hard hats included.',
    description: 'A three-level soft play frame designed like a construction site, a giant foam brick zone, ride-on diggers and a café with a view of the play floor.',
    highlights: ['Foam brick building zone', 'Ride-on diggers', 'Café overlooking play'],
    amenities: ['toilets', 'babyChange', 'cafe', 'parking', 'covered', 'fenced'],
    ages: [0, 8], price: 2, priceNote: '$12 per child, adults free', indoor: true, hours: daily(9, 17), duration: '1–2 hrs',
    vibe: [4.5, 174, ['toddlers', 'coffee', 'clean-toilets', 'busy']], keywords: ['soft play', 'construction', 'diggers', 'rainy day', 'toddler', 'birthday'],
    sponsored: { tier: 'spotlight', label: 'Partner', offer: 'Free hot chocolate for Hard Hat Hunters' },
  },
  {
    id: 'clay-studio', name: 'Muddy Hands Clay Studio', category: 'indoor', x: 900, y: 2650, area: 'Riverbend', address: '5 Potter Ln',
    blurb: 'Drop-in clay and painting for kids. Messy and wonderful.',
    description: 'Drop-in sessions where kids make a pinch pot, paint a dino or try the pottery wheel. Aprons provided. Pieces are fired and ready a week later.',
    highlights: ['Drop-in sessions', 'Pottery wheel for 6+', 'Pieces fired for you'],
    amenities: ['toilets', 'covered', 'stroller'],
    ages: [3, 12], price: 2, priceNote: '$18 per session', indoor: true, hours: split([10, 17], [9, 16]), duration: '1 hr',
    vibe: [4.6, 72, ['friendly-staff', 'quiet', 'big-kids']], keywords: ['art', 'clay', 'painting', 'craft', 'rainy day', 'creative'],
  },

  // Splash & swim ---------------------------------------------------------
  {
    id: 'rainbow-splash', name: 'Rainbow Splash Pad', category: 'water', x: 1600, y: 300, area: 'Riverbend', address: 'Commons Rd East',
    blurb: 'Free splash pad with tipping buckets and rainbow jets.',
    description: 'Ground jets, a giant tipping bucket and rainbow arches. Runs October to April. Zero depth, so it works for crawlers too. Bring towels and sun hats.',
    highlights: ['Giant tipping bucket', 'Zero depth', 'Free'],
    amenities: ['toilets', 'shade', 'picnic', 'fountain', 'stroller'],
    ages: [0, 10], price: 0, indoor: false, hours: daily(9, 19), duration: '1 hr',
    vibe: [4.7, 196, ['toddlers', 'value', 'busy', 'clean-toilets']], keywords: ['water', 'splash', 'summer', 'free', 'hot day'],
  },
  {
    id: 'aquatic-centre', name: 'Riverbend Aquatic Centre', category: 'water', x: -1300, y: -1700, area: 'Southgate', address: '200 Pool Rd',
    blurb: 'Heated indoor pools with a toddler beach and water slide.',
    description: 'A warm indoor learn-to-swim pool, a beach-entry toddler pool with a mini slide, and a big twisty slide for confident swimmers. Family change rooms are spotless.',
    highlights: ['Beach-entry toddler pool', 'Twisty water slide (8+)', 'Family change rooms'],
    amenities: ['toilets', 'babyChange', 'cafe', 'parking', 'covered', 'accessible'],
    ages: [0, 14], price: 1, priceNote: '$7 child, under 3s free', indoor: true, hours: daily(6, 20), duration: '1–2 hrs',
    vibe: [4.4, 154, ['clean-toilets', 'value', 'busy']], keywords: ['swim', 'pool', 'slide', 'rainy day', 'lessons'],
  },
  {
    id: 'willow-lake-beach', name: 'Willow Lake Beach', category: 'water', x: 4700, y: 1450, area: 'Willow Lake', address: 'Lakeshore Dr',
    blurb: 'Sandy lake beach with calm shallows and pedal boats.',
    description: 'A small sandy beach with a roped-off shallow swimming area, pedal boat hire in summer and a grassy bank for picnics. Lifeguards on summer weekends.',
    highlights: ['Calm roped shallows', 'Pedal boats', 'Summer lifeguards'],
    amenities: ['toilets', 'parking', 'picnic', 'bbq', 'shade'],
    ages: [1, 12], price: 0, priceNote: 'Pedal boats $15', indoor: false, hours: 'always', duration: '2–3 hrs',
    vibe: [4.5, 119, ['lots-to-do', 'easy-parking', 'busy']], keywords: ['beach', 'lake', 'swim', 'sand', 'boats', 'summer'],
  },

  // Animals ---------------------------------------------------------------
  {
    id: 'hilltop-farm', name: 'Hilltop Farm', category: 'animals', x: -4550, y: 2950, area: 'Kestrel Hill', address: '88 Farm Rd',
    blurb: 'Petting farm with lamb feeding, pony rides and a hay maze.',
    description: 'Feed the lambs at 11, collect eggs at 2, ride a pony and get lost in the hay bale maze. The farm shop does great ice cream.',
    highlights: ['Lamb feeding at 11am', 'Pony rides', 'Hay bale maze'],
    amenities: ['toilets', 'babyChange', 'cafe', 'parking', 'picnic'],
    ages: [1, 10], price: 2, priceNote: '$14 child, $10 adult', indoor: false, hours: daily(9.5, 16.5), duration: '2–3 hrs',
    vibe: [4.6, 201, ['lots-to-do', 'toddlers', 'friendly-staff']], keywords: ['farm', 'animals', 'lambs', 'pony', 'tractor', 'eggs'],
  },
  {
    id: 'bug-house', name: 'The Bug House', category: 'animals', x: 2800, y: -3200, area: 'Fernleaf', address: '3 Beetle Way',
    blurb: 'Mini zoo of insects, lizards and the world’s friendliest stick insects.',
    description: 'Hold a stick insect, watch leafcutter ants at work and meet a blue-tongue lizard at the 1pm keeper talk. Small, so it is perfect for a quick rainy-day visit.',
    highlights: ['Keeper talk at 1pm', 'Leafcutter ant highway', 'Hold a stick insect'],
    amenities: ['toilets', 'covered', 'stroller', 'parking'],
    ages: [2, 12], price: 1, priceNote: '$9 child, $12 adult', indoor: true, hours: daily(10, 16), duration: '1 hr',
    vibe: [4.5, 83, ['friendly-staff', 'quiet', 'value']], keywords: ['bugs', 'insects', 'lizards', 'zoo', 'rainy day'],
  },
  {
    id: 'aquarium', name: 'Riverbend Aquarium', category: 'animals', x: -600, y: 3400, area: 'Riverbend', address: 'Harbour Walk',
    blurb: 'River fish, a touch pool and a walk-through eel tunnel.',
    description: 'A compact aquarium with a touch pool of sea stars and shrimp, a walk-through tunnel and otter feeding twice a day. Quiet first thing in the morning.',
    highlights: ['Touch pool', 'Otter feeding at 10:30 and 2:30', 'Walk-through tunnel'],
    amenities: ['toilets', 'babyChange', 'cafe', 'covered', 'accessible', 'stroller'],
    ages: [0, 12], price: 2, priceNote: '$18 child, $24 adult', indoor: true, hours: daily(9, 17), duration: '1–2 hrs',
    vibe: [4.2, 177, ['toddlers', 'pricey', 'busy']], keywords: ['fish', 'otters', 'aquarium', 'rainy day', 'sea'],
  },

  // Museums ---------------------------------------------------------------
  {
    id: 'dino-museum', name: 'Dino Discovery Museum', category: 'museums', x: 500, y: 3000, area: 'Riverbend', address: '1 Fossil Rd',
    blurb: 'Life-size T. rex, a fossil dig pit and roaring animatronics.',
    description: 'The big one. A full T. rex skeleton, a sandpit where kids dig for fossils, and a walk-through jungle of moving, roaring dinosaurs. Under-4s go free.',
    highlights: ['Full T. rex skeleton', 'Fossil dig pit', 'Animatronic dino jungle'],
    amenities: ['toilets', 'babyChange', 'cafe', 'parking', 'covered', 'accessible', 'stroller'],
    ages: [2, 12], price: 2, priceNote: '$15 child, under 4s free', indoor: true, hours: daily(9, 17), duration: '2–3 hrs',
    vibe: [4.8, 268, ['lots-to-do', 'clean-toilets', 'big-kids', 'busy']], keywords: ['dinosaurs', 'fossils', 't rex', 'museum', 'rainy day'],
    sponsored: { tier: 'featured', label: 'Partner', offer: 'Kids go free on weekday afternoons' },
    events: () => [
      { id: 'dino-night', title: 'Dino sleepover night', startsAt: inDays(9, 18), durationMin: 840, price: '$65', ages: '6–12', sponsored: true },
    ],
  },
  {
    id: 'spark-science', name: 'Spark Science Centre', category: 'museums', x: -3500, y: 1000, area: 'Kestrel Hill', address: '9 Tesla St',
    blurb: 'Hands-on science with a tornado machine and a bubble lab.',
    description: 'Over 80 hands-on exhibits. Stand inside a giant bubble, build a tornado, and launch paper rockets. The little explorers room is great for under-5s.',
    highlights: ['Giant bubble lab', 'Tornado machine', 'Little explorers room'],
    amenities: ['toilets', 'babyChange', 'cafe', 'parking', 'covered', 'accessible'],
    ages: [3, 14], price: 2, priceNote: '$16 child, $20 adult', indoor: true, hours: daily(10, 17), duration: '2 hrs',
    vibe: [4.6, 139, ['lots-to-do', 'big-kids', 'friendly-staff']], keywords: ['science', 'bubbles', 'rockets', 'experiments', 'rainy day'],
  },
  {
    id: 'railway-museum', name: 'Riverbend Railway Museum', category: 'museums', x: 3900, y: -2400, area: 'Station Quarter', address: 'Old Station Yard',
    blurb: 'Climb into steam engines and ride the miniature railway.',
    description: 'Old steam engines you can climb aboard, a huge model railway, and a miniature train that runs every Sunday around the yard.',
    highlights: ['Climb-aboard steam engines', 'Sunday miniature train', 'Model railway'],
    amenities: ['toilets', 'parking', 'cafe', 'picnic', 'covered'],
    ages: [2, 12], price: 1, priceNote: '$6 entry, train rides $3', indoor: false, hours: split(null, [10, 16]), duration: '1–2 hrs',
    vibe: [4.7, 92, ['friendly-staff', 'value', 'lots-to-do']], keywords: ['trains', 'steam', 'railway', 'miniature train', 'engines'],
    events: () => [
      { id: 'mini-train', title: 'Miniature train rides', startsAt: next(0, 10), durationMin: 360, price: '$3 a ride', ages: 'All ages' },
    ],
  },

  // Cafés -----------------------------------------------------------------
  {
    id: 'babyccino-bar', name: 'Babyccino Bar', category: 'cafes', x: 650, y: 720, area: 'Riverbend', address: '30 High St',
    blurb: 'Café with a glassed-in play room so you can drink your coffee hot.',
    description: 'Good coffee for you, babycinos and toasties for them, and a glassed-in play room with a kitchen set and books where you can still see them from your table.',
    highlights: ['Glassed-in play room', 'Pram parking', 'Kids menu all day'],
    amenities: ['toilets', 'babyChange', 'stroller', 'covered', 'cafe'],
    ages: [0, 6], price: 1, indoor: true, hours: daily(7, 15), duration: '45–60 min',
    vibe: [4.6, 187, ['coffee', 'toddlers', 'clean-toilets', 'busy']], keywords: ['coffee', 'cafe', 'babycino', 'play room', 'brunch'],
    sponsored: { tier: 'featured', label: 'Partner', offer: 'Free babycino with any coffee' },
  },
  {
    id: 'potting-shed', name: 'The Potting Shed Café', category: 'cafes', x: 2050, y: -1200, area: 'Fernleaf', address: 'Fernleaf Gardens',
    blurb: 'Garden café with a play lawn and a giant chess set.',
    description: 'Tables on a lawn surrounded by veggie beds, a mud kitchen and giant garden chess. Great scones. Inside Fernleaf Gardens.',
    highlights: ['Mud kitchen', 'Giant chess', 'Garden seating'],
    amenities: ['toilets', 'cafe', 'shade', 'stroller'],
    ages: [1, 10], price: 1, indoor: false, hours: daily(8, 16), duration: '45 min',
    vibe: [4.5, 94, ['coffee', 'quiet', 'shady']], keywords: ['cafe', 'garden', 'mud kitchen', 'scones', 'coffee'],
  },
  {
    id: 'crumbs-crayons', name: 'Crumbs & Crayons', category: 'cafes', x: -1500, y: 200, area: 'Riverbend', address: '7 Orbit Ave',
    blurb: 'Colour-in tablecloths and pancakes shaped like animals.',
    description: 'Every table has a paper tablecloth and crayons, the pancakes come shaped like animals and there is a little reading nook. Opposite Rocket Park.',
    highlights: ['Animal pancakes', 'Colour-in tables', 'Opposite Rocket Park'],
    amenities: ['toilets', 'babyChange', 'stroller', 'cafe'],
    ages: [1, 10], price: 1, indoor: true, hours: daily(7, 14), duration: '45 min',
    vibe: [4.3, 76, ['coffee', 'friendly-staff']], keywords: ['pancakes', 'cafe', 'breakfast', 'colouring'],
  },

  // Events ----------------------------------------------------------------
  {
    id: 'touch-a-truck', name: 'Touch-a-Truck Day', category: 'events', x: 2650, y: 1300, area: 'Old Mill', address: 'Old Mill Showgrounds',
    blurb: 'Climb into real diggers, fire engines and cranes. Horn hour at noon!',
    description: 'Once a year the showgrounds fill with real working machines kids can climb into: excavators, a fire engine, a cherry picker and a street sweeper. Quiet hour from 9 to 10 for noise-sensitive kids.',
    highlights: ['Climb into real machines', 'Quiet hour 9–10am', 'Counts for Hard Hat Hunt spots'],
    amenities: ['toilets', 'parking', 'cafe', 'babyChange'],
    ages: [1, 12], price: 1, priceNote: '$5 per family', indoor: false, hours: daily(9, 15), duration: '2 hrs',
    vibe: [4.9, 155, ['lots-to-do', 'big-kids', 'toddlers', 'busy']], keywords: ['trucks', 'diggers', 'fire engine', 'construction', 'machines', 'event'],
    events: () => [
      { id: 'tat', title: 'Touch-a-Truck Day', startsAt: next(6, 9), durationMin: 360, price: '$5 per family', ages: 'All ages' },
    ],
  },
  {
    id: 'farmers-market', name: 'Riverbend Farmers Market', category: 'events', x: 200, y: 180, area: 'Riverbend', address: 'Commons car park',
    blurb: 'Sunday market with a kids craft tent and live music.',
    description: 'Local produce, a kids craft tent, face painting, and a busker who plays requests. Best before 10 when it is calmer.',
    highlights: ['Kids craft tent', 'Face painting', 'Live music'],
    amenities: ['toilets', 'parking', 'stroller', 'cafe'],
    ages: [0, 12], price: 0, indoor: false, hours: split(null, [8, 13]), duration: '1–2 hrs',
    vibe: [4.4, 112, ['coffee', 'busy', 'value']], keywords: ['market', 'craft', 'face painting', 'music', 'food'],
    events: () => [
      { id: 'market', title: 'Sunday farmers market', startsAt: next(0, 8), durationMin: 300, price: 'Free entry', ages: 'All ages' },
    ],
  },
  {
    id: 'lantern-parade', name: 'Kids Lantern Parade', category: 'events', x: -700, y: 820, area: 'Riverbend', address: 'Civic Square',
    blurb: 'Make a paper lantern, then parade along the river at dusk.',
    description: 'A free lantern-making workshop in the library courtyard followed by a dusk parade along the river with a brass band.',
    highlights: ['Free lantern workshop', 'Dusk river parade', 'Brass band'],
    amenities: ['toilets', 'stroller', 'accessible'],
    ages: [2, 12], price: 0, indoor: false, hours: split(null, [16, 20]), duration: '2 hrs',
    vibe: [4.8, 47, ['lots-to-do', 'value']], keywords: ['lantern', 'parade', 'craft', 'night', 'festival'],
    events: () => [
      { id: 'lanterns', title: 'Lantern workshop and parade', startsAt: inDays(5, 16), durationMin: 240, price: 'Free', ages: '2–12' },
    ],
  },

  // Cool sights -----------------------------------------------------------
  {
    id: 'bridge-works', name: 'Big Dig Bridge Viewing Deck', category: 'sights', x: 1000, y: -420, area: 'Riverbend', address: 'Willow Rd',
    blurb: 'Watch cranes and pile drivers build the new river bridge.',
    description: 'A safe viewing deck over the new bridge build. On weekdays you can watch a mobile crane, excavators and (if you are lucky) the pile driver. Info boards explain each machine. Top Hard Hat Hunt spot.',
    highlights: ['Live bridge construction', 'Machine info boards', 'Weekday action 7am–4pm'],
    amenities: ['parking', 'stroller', 'accessible'],
    ages: [1, 12], price: 0, indoor: false, hours: 'always', duration: '20–40 min',
    vibe: [4.7, 98, ['big-kids', 'toddlers', 'easy-parking']], keywords: ['construction', 'crane', 'diggers', 'bridge', 'machines', 'pile driver'],
  },
  {
    id: 'fire-station', name: 'Riverbend Fire Station', category: 'sights', x: -800, y: 2200, area: 'Riverbend', address: '50 Ladder St',
    blurb: 'Wave at the fire engines. Open day on the first Saturday.',
    description: 'The big doors are usually open on weekday afternoons and the crew are happy to wave. On open days kids can sit in the engine and try the hose.',
    highlights: ['Open day monthly', 'Sit in a real fire engine', 'Try the hose'],
    amenities: ['parking'],
    ages: [1, 10], price: 0, indoor: false, hours: daily(8, 18), duration: '20 min',
    vibe: [4.6, 51, ['friendly-staff', 'toddlers']], keywords: ['fire engine', 'fire truck', 'firefighters', 'trucks'],
  },
  {
    id: 'swing-bridge', name: 'The Swing Bridge', category: 'sights', x: -2000, y: -900, area: 'Southgate', address: 'Bridge St',
    blurb: 'An old bridge that swings open for boats on the hour.',
    description: 'A heritage iron bridge that swings sideways so tall boats can pass. It opens on the hour from 10 to 4 on weekends, with bells and flashing lights.',
    highlights: ['Opens on the hour (weekends)', 'Bells and lights', 'Boat spotting'],
    amenities: ['stroller', 'picnic'],
    ages: [1, 12], price: 0, indoor: false, hours: 'always', duration: '20 min',
    vibe: [4.4, 39, ['quiet', 'toddlers']], keywords: ['bridge', 'boats', 'river', 'history'],
  },
  {
    id: 'train-lookout', name: 'Steam Train Lookout', category: 'sights', x: 3550, y: -1350, area: 'Station Quarter', address: 'Signal Hill',
    blurb: 'Grassy bank where freight trains pass every 20 minutes.',
    description: 'A grassy bank above the line where long freight trains pass every 20 minutes. Count the wagons and wave to the drivers, who usually toot back.',
    highlights: ['Trains every 20 min', 'Drivers toot back', 'Picnic bank'],
    amenities: ['picnic', 'parking'],
    ages: [1, 10], price: 0, indoor: false, hours: 'always', duration: '30 min',
    vibe: [4.5, 44, ['quiet', 'toddlers']], keywords: ['trains', 'railway', 'freight', 'picnic'],
  },
];

let cache: { key: string; places: Place[] } | null = null;

export function buildDemoPlaces(center: LatLng): Place[] {
  const key = `${center.latitude.toFixed(5)},${center.longitude.toFixed(5)}`;
  if (cache?.key === key) return cache.places;
  const places = RAW.map((r, i): Place => ({
    id: `demo:${r.id}`,
    source: 'demo',
    name: r.name,
    category: r.category,
    coordinate: offset(center, r.x, r.y),
    area: r.area,
    address: r.address,
    blurb: r.blurb,
    description: r.description,
    highlights: r.highlights,
    amenities: r.amenities,
    ages: r.ages,
    price: r.price,
    priceNote: r.priceNote,
    indoor: r.indoor,
    hours: hoursOf(r.hours),
    durationHint: r.duration,
    stats: makeStats(r.vibe[0], r.vibe[1], r.vibe[2]),
    sponsored: r.sponsored,
    events: r.events?.().map((e) => ({ ...e, id: `${r.id}:${e.id}` })),
    keywords: r.keywords,
    coverSeed: i * 7919 + 13,
  }));
  cache = { key, places };
  return places;
}

/** Sample vibe checks so the demo has something to read. Marked `sample`. */
const SAMPLE_REVIEWS: [placeId: string, author: string, score: 1 | 2 | 3 | 4 | 5, tags: string[], note: string, daysAgo: number][] = [
  ['big-dig', 'Parent of 2 (3 and 6)', 5, ['lots-to-do', 'fenced'], 'My digger-obsessed 3yo cried when we left. The sand diggers actually work. Go early on weekends.', 2],
  ['big-dig', 'Parent of a 5yo', 5, ['big-kids', 'clean-toilets'], 'Crane tower is a hit. Toilets were clean and there is shade over the sandpit.', 6],
  ['big-dig', 'Grandparent of 3', 4, ['busy'], 'Brilliant but packed by 10am on Saturday. Weekday afternoons are calmer.', 11],
  ['riverbend-commons', 'Parent of 3', 5, ['shady', 'pram', 'clean-toilets'], 'Our go-to. Scooters around the pond, picnic under the oaks, ice blocks from the kiosk.', 3],
  ['riverbend-commons', 'Parent of a toddler', 4, ['busy', 'pram'], 'Lovely but the ducks are aggressive about bread. Bring peas instead.', 9],
  ['little-owl', 'Parent of 2 (1 and 4)', 5, ['friendly-staff', 'quiet'], 'Saturday story time is magic. The treehouse corner kept my 4yo busy for an hour.', 4],
  ['little-owl', 'Parent of a 7yo', 5, ['friendly-staff'], 'Staff found the exact dinosaur book my son had been describing badly for weeks.', 15],
  ['willow-loop', 'Parent of twins', 5, ['pram', 'coffee', 'shady'], 'Double pram the whole loop with zero trouble. Coffee cart at the halfway bridge is a lifesaver.', 1],
  ['willow-loop', 'Parent of 2', 4, ['pram', 'quiet'], 'Kids loved watching the bridge diggers from the path. Bit windy in the afternoon.', 8],
  ['rainbow-splash', 'Parent of 2 (2 and 5)', 5, ['toddlers', 'value'], 'Free and the tipping bucket gets huge screams of joy. Arrive by 10 for a shady spot.', 2],
  ['rainbow-splash', 'Parent of a 1yo', 4, ['toddlers', 'busy'], 'Zero depth is perfect for a crawler. Very busy on hot weekends.', 5],
  ['jumpin-jungle', 'Parent of 3', 4, ['lots-to-do', 'pricey'], 'They were exhausted afterwards, which is the dream. Socks add up with three kids.', 6],
  ['jumpin-jungle', 'Parent of a 4yo', 5, ['toddlers', 'friendly-staff'], 'The tiny tots session on Wednesday is calm and the staff are great with little ones.', 13],
  ['dino-museum', 'Parent of a 6yo', 5, ['lots-to-do', 'big-kids'], 'The fossil dig pit is the best thing in town on a rainy day. Allow 3 hours.', 3],
  ['dino-museum', 'Parent of 2', 4, ['busy', 'clean-toilets'], 'The animatronic room scared my 3yo a bit but my 7yo loved it. Café is fine.', 10],
  ['fernleaf-gardens', 'Parent of a 3yo', 5, ['quiet', 'pram'], 'We found 14 fairy doors and the hedge maze is just the right size. Very calm.', 5],
  ['bluebell-woods', 'Parent of 2', 5, ['shady', 'quiet'], 'Grab the spotter sheet from the box at the start. My kids ran the whole loop.', 7],
  ['babyccino-bar', 'Parent of a 2yo', 5, ['coffee', 'toddlers'], 'I drank a hot coffee! The glass play room is genius.', 2],
  ['babyccino-bar', 'Parent of a 10-month-old', 4, ['busy', 'clean-toilets'], 'Good change room. Gets loud at 10am but that is part of the deal.', 12],
  ['hilltop-farm', 'Parent of 2 (4 and 8)', 5, ['lots-to-do', 'friendly-staff'], 'Lamb feeding is adorable. Do the hay maze after lunch when it is quieter.', 9],
  ['bridge-works', 'Parent of a digger-mad 4yo', 5, ['toddlers', 'easy-parking'], 'Saw the pile driver going. He talked about it for three days.', 1],
  ['little-builders', 'Parent of a 3yo', 4, ['toddlers', 'coffee', 'busy'], 'The foam brick zone is brilliant. Gets hot inside in summer.', 4],
  ['touch-a-truck', 'Parent of 3', 5, ['lots-to-do', 'big-kids'], 'Kids sat in an excavator and a fire engine. Quiet hour was perfect for our eldest.', 30],
  ['spark-science', 'Parent of a 9yo', 5, ['big-kids', 'lots-to-do'], 'Bubble lab and tornado machine were the highlights. Great for older kids.', 14],
  ['rocket-park', 'Parent of 2', 4, ['fenced', 'lots-to-do'], 'Rocket slide is fast. Fenced so you can relax a bit.', 3],
  ['riverbend-library', 'Parent of a baby', 5, ['quiet', 'value'], 'Rhyme time is lovely and free. The toy library saved our rainy week.', 6],
  ['aquatic-centre', 'Parent of 2', 4, ['clean-toilets', 'busy'], 'Toddler beach pool is warm. Family change rooms are the cleanest in town.', 8],
  ['willow-lake-beach', 'Parent of 3', 4, ['busy', 'easy-parking'], 'Calm shallows, good for little ones. Bring shade, the trees are at the back.', 20],
];

export function demoReviews(): VibeCheck[] {
  return SAMPLE_REVIEWS.map(([placeId, author, score, tags, note, daysAgo], i) => ({
    id: `sample-review-${i}`,
    placeId: `demo:${placeId}`,
    author,
    score,
    tags,
    note,
    createdAt: new Date(Date.now() - daysAgo * 86400000 - i * 3600000).toISOString(),
    sample: true,
  }));
}
