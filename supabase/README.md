# Playdar backend (Supabase)

Optional: the app runs without it. Connect it to share spots, votes, vibe checks and the leaderboard between families, and to enable AI photo identification and Ask Playdar on phones.

## What's here

- `migrations/20261009000000_init.sql`: tables, PostGIS location columns, views, row-level security, triggers and SQL functions.
- `functions/identify-vehicle`: names the machine in a photo and flags people in it.
- `functions/ask-playdar`: plain-English search over the places in range.

## Setup

1. Create a Supabase project and install the CLI (`npm i -g supabase` or `brew install supabase/tap/supabase`).
2. In this repo: `supabase init` (keep the existing `supabase/` folder), then `supabase link --project-ref <your-ref>`.
3. Apply the schema: `supabase db push`.
4. Turn on **Anonymous sign-ins** (Authentication → Providers). The app signs each family in anonymously; add Apple/Google sign-in later to link devices.
5. Add your Anthropic key for the functions: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
6. Deploy: `supabase functions deploy identify-vehicle ask-playdar`
7. Point the app at the project: copy `.env.example` to `.env.local` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then restart `npx expo start`.

## How privacy is enforced

- `spots` rows are readable only by their owner. Everyone else reads `public_spots`, which shows named, shared spots with a location the `prepare_spot` trigger has snapped to a ~150 m grid, and photos only after `moderation = 'approved'`.
- Photo spots start as `pending`. Approve or reject them from the dashboard (or a moderation job) by updating `spots.moderation`.
- `limit_spot_rate` caps spots at 120 per family per day; `consume_ai_quota` caps AI calls (60 photo checks and 80 Ask questions per family per day, set in the functions).
- `vibe_checks` are public but carry only an author label like "Parent of 2".

## Places

`places_nearby(at_lat, at_lng, radius_m, categories)` returns places with distance, vibe stats and any live sponsorship. Fill `places` from curated data or a nightly OpenStreetMap import (see `src/services/places/osm.ts` for the tag mapping the app uses on the device).

## Model

The functions use `claude-opus-5-5` with structured JSON output, low effort for the photo check and medium for Ask, and server-side refusal fallback (`fallbacks: "default"`). Change `MODEL` in `functions/_shared/claude.ts` to trade cost for capability.
