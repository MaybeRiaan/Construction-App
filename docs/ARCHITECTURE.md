# Architecture

## Stack

- **Expo SDK 57** (React Native 0.86, React 19.2, New Architecture), TypeScript strict.
- **React Navigation 7**: native stack on iOS/Android, the animated JS stack on web; custom floating tab bar.
- **Zustand** stores persisted with AsyncStorage (native) or guarded localStorage (web).
- **react-native-maps** on device (Apple Maps muted style on iOS, styled Google Maps on Android); a stylised SVG town on web.
- **react-native-svg** for every illustration; **lucide-react-native** icons (deep imports, so unused icons stay out of the bundle).
- Fonts: Bricolage Grotesque (display), Figtree (UI), Big Shoulders Stencil (Hard Hat Hunt signage).

React Navigation is used directly rather than Expo Router so the web build can run inside a claude.ai artifact, where the URL path belongs to the host page.

## Layers

```
screens/ ──► components/, ui/ (presentation)
   │
   ├──► state/ providers: Location → Community → Places (React context)
   │       └─ stores: settings, places (saved, vibes, filters), hunt (spots, hunts, XP claims, votes)
   │
   ├──► domain/ (pure, platform-free): geo, search/ranking, vibe scoring, opening hours, game rules
   │
   └──► services/ (side effects, platform-split):
           location(.web), camera(.web), weather(.web), storage(.web), haptics, directions,
           places/osm (Overpass import), ai (identify + ask), backend/{demo, artifact, supabase}
```

The domain layer has no React or platform imports, so XP, challenges, bingo, ranking and vibe maths can be unit-tested or moved to the server.

## Platform files

| Concern | Native (`*.tsx`/`*.ts`) | Web (`*.web.*`) |
| --- | --- | --- |
| Map | react-native-maps with custom markers, circle, polyline | SVG town with pan, pinch, wheel and double-tap zoom, clustering, radar pulse |
| Stack | `@react-navigation/native-stack` | `@react-navigation/stack` (animated cards inside the frame) |
| Location | expo-location | demo town centre |
| Camera | expo-image-picker + expo-image-manipulator (320 px thumb, 1024 px for AI) | hidden file input + canvas resize |
| Fonts | expo-font with @expo-google-fonts | Google Fonts stylesheet |
| Shell | SafeAreaProvider | phone frame with simulated status bar on wide screens; fills the screen on phones |
| Storage | AsyncStorage | localStorage with in-memory fallback |

## Data flow

- **LocationProvider** decides the origin: the device (when permission is granted) or the demo centre.
- **CommunityProvider** picks a backend once: artifact runtime if `window.claude` exists, Supabase if configured, otherwise the on-device demo. It merges other families' spots, votes, vibe checks and players with yours, and syncs your votes, vibe checks and player stats (debounced). Spots are published only when named, shared, and free of people.
- **PlacesProvider** loads places (demo town or OpenStreetMap import), folds in community and personal vibe checks, and decorates each place with distance, travel time, vibe score and open state.

## Backends

| | Demo | Artifact runtime | Supabase |
| --- | --- | --- | --- |
| Identity | none | `user.id()` | anonymous sign-in (REST) |
| Spots | local only | `spots/<id>` shared collection | `spots` table, `public_spots` view |
| Votes | local | `votes/<viewer>` docs (each viewer writes only their own) | `spot_votes` |
| Vibe checks | local | `vibes/<viewer>` | `vibe_checks` (one per family per place) |
| Leaderboard | sample crews | `players/<viewer>` | `leaderboard_weekly` view (XP recomputed server-side) |
| Photo AI / Ask | off | `sample` capability (viewer's Claude) | edge functions calling the Claude API |

## AI

Both AI features use Claude with JSON output:

- **identify-vehicle**: photo in, `{type, confidence, colour, isMachine, hasPeople, funFact}` out. `hasPeople` keeps the spot private.
- **ask-playdar**: question plus compact place summaries in, `{answer, picks[{id, why}]}` out; picks are filtered to known ids.

In production the Supabase functions use the official Anthropic SDK with `claude-opus-5-5`, structured outputs (`output_config.format`), low effort for the photo check and medium for Ask, server-side refusal fallback, and a per-family daily quota (`consume_ai_quota`). The prompt is assembled on the server from validated fields, so the endpoints can't be used as a general chatbot.

## Web prototype build

`scripts/build-artifact.mjs` runs `expo export --platform web`, then inlines the bundle into one HTML file (escaping `</script` sequences), adds the Google Fonts link and theme-aware page colours. The app avoids static image assets so nothing else needs hosting.

## Verifying changes

```bash
npm run typecheck        # app
npm run check:native     # bundles iOS + Android
npm run build:artifact   # web prototype
```
