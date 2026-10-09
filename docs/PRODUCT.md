# Playdar product spec (v0.1)

## The job

A parent has an hour, a bored kid and a phone. Playdar answers *"what can we do near here, right now, that's actually good?"* in a few taps, the way Uber answers *"where to?"* and Airbnb answers *"where could we stay?"*.

Three ideas carry the product:

1. **Radar range.** One slider from 1 km ("round the corner") to 50 km ("day trip"). The map draws the range as rings and the list re-ranks live.
2. **The Vibe Meter.** Parents rate a visit with one question, *was it a vibe?*, on five steps (Not a vibe, Meh, Decent, Good vibes, Total vibe), plus quick tags other parents care about (clean toilets, shade, fenced, gets busy). The meter shows 0–100 and the share of parents who said it was a vibe.
3. **Hard Hat Hunt.** A side game that turns car rides into a construction-machine safari, so the app earns a place on the home screen between outings.

## Explore

- **Categories:** Parks, Playgrounds, Walks, Books (bookshops and libraries), Indoor play, Splash & swim, Animals, Museums, Kid-friendly cafés, Events, Cool sights (trains, fire stations, bridge works).
- **Quick ideas:** Burn energy, Rainy day, Free, Close by (under 10 minutes), Little ones (fenced, toddler-friendly), Calm & quiet. They work like Uber's suggestion tiles.
- **Filters:** sort (for you, closest, best vibes), indoor/outdoor, free only, open now, good vibes only, right for my kids' ages, and must-haves (toilets, baby change, parking, café, shade, fenced, pram-friendly, accessible, rain cover).
- **Ranking:** vibe score (55%), proximity within the range (35%), open now and keyword relevance. Sponsorship is never an input.
- **Weather tip:** live conditions suggest an intent (showers lead to rainy-day ideas).
- **Ask Playdar:** plain-English search answered by Claude from the places in range, with a reason for each of up to three picks.

## Places

Name, category, distance and travel time, opening status, best ages, cost, indoor/outdoor, Vibe Meter with distribution and top tags, highlights, amenities, events, opening hours, parent tips, and for partners an offer card. Actions: Vibe check, Let's go (directions in Apple or Google Maps), Save.

Sources:
- **Live:** OpenStreetMap (parks, playgrounds, libraries, bookshops, pools, splash pads, zoos, museums, attractions, viewpoints, ice cream, fire stations), imported on the device for the chosen radius and cached for a day.
- **Curated and business listings:** in the `places` table (Supabase), for things OSM lacks (soft play, events, partner offers).
- **Demo:** Riverbend, a fictional town of 38 hand-written places, so the app always has something to show.

## Hard Hat Hunt rules

- **Spotting:** snap a photo (or pick the machine from the list). The spotter (Claude vision) suggests the machine type and colour, gives a fun fact, and flags people in the photo.
- **XP:** common 10, uncommon 20, rare 40, legendary 80. +25 the first time you find a type, +5 for a photo, +5 for naming it. Challenges add their own XP.
- **Levels:** Site Visitor (0) → Hard Hat Rookie (100) → Cone Captain (250) → Dirt Detective (450) → Digger Scout (700) → Crane Watcher (1000) → Site Supervisor (1400) → Foreman (1900) → Chief Engineer (2500) → Master Builder (3200).
- **The Yard:** 20 machines in five crews (Earthmovers, Lifters, Road crew, Concrete crew, Big trucks). Missing machines show as silhouettes.
- **Challenges:** Today's mission (a different machine each day), Digger Bingo (3×3 card, new every Monday, free centre square), The Big Ten (first in the family to 10 types), Rainbow hunt (5 colours), Crane spotter, Road crew (roller + grader + paver), Name game, Famous finder, Legend (a pile driver), On a roll (3 days in a row), Full yard.
- **Family Race:** each spot is credited to the child holding the phone; first to 10 different machines wins.
- **Names and fame:** named machines can be shared. Other families vote on names (one vote each) and can track a famous machine down and collect it ("I found it!").
- **Live hunt:** a session with a timer, distance, trail on the map, today's mission, and an alert when a famous machine is within ~450 m.
- **Leaderboard:** weekly, by team name, recomputed on the server from spots.

## Safety and privacy (non-negotiable)

- Parent accounts only. Kids' names and ages stay on the device.
- Shared spots use a location rounded to ~150 m, enforced again in the database.
- Photos with people stay private; public photos are hidden until moderation approves them.
- No comments, chat, followers or direct messages. The only social action is voting for a machine name.
- Gentle nudge in the game: spot from the passenger seat or the footpath, never near a work zone.
- Partner content is always labelled and never changes ratings or ranking.

## Business model

1. **Featured listings** for venues (from ~$49/month): Featured row, highlighted pin, an offer. Clearly labelled.
2. **Event boosts** (from ~$19/event): top of "Happening soon" and reminders for families who saved the venue.
3. **Claimed listings** (free): verified badge, edit details, reply to vibe checks. The funnel into paid tiers.
4. Later: **Playdar Plus** for families (offline maps for road trips, Hunt seasons and printable badges, multi-device family sync), and booking commissions for ticketed events.

## Roadmap

**Next (v0.2)**
- Real accounts (Sign in with Apple / Google) linking the anonymous family, multi-device sync.
- Mirror OSM imports into `places` nightly per region, so curated details and stats attach to real places.
- Photo moderation job (approve/reject public spot photos) and Storage for full-size photos.
- Push notifications: events this weekend, a famous machine near your usual routes, weekly bingo reset.

**Then**
- Business portal for claimed and featured listings, with simple analytics.
- Hunt seasons and city-wide events (e.g. "Bridge build week").
- Accessibility pass with real screen-reader testing on both platforms; localisation.
- Background location for hunts (needs careful permission UX), offline map tiles.

## Open questions for the next round

1. Which city or suburb should the demo show (or should it start on your real area by default)?
2. Is "Playdar" the name, and "Hard Hat Hunt" the game's name?
3. Who rates places: any parent, or only families who have checked in nearby?
4. Should Hard Hat Hunt be playable by kids on their own device, or always on a parent's phone?
5. Sponsored placements: just a Featured row, or also sponsored events and offers in the game?
6. Which markets first? That decides units, privacy law (COPPA vs GDPR-K vs POPIA) and partner sales.
