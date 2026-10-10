# Playdar backend (Supabase)

Optional: the app runs without it. Connect it to share spots, votes, vibe checks, the leaderboard and places parents add between families, and to enable AI photo identification and Ask Playdar on phones.

## What's here

- `migrations/20261009000000_init.sql`: tables, PostGIS location columns, views, row-level security, triggers and SQL functions.
- `migrations/20261010000000_place_submissions.sql`: places added by parents, the review queue, moderators and the Scout points ledger.
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
8. Make yourself a moderator so the review queue shows up under Family: open the app once, find your user under Authentication → Users, then in the SQL editor run `insert into public.moderators (user_id) values ('<user id>');`

## How privacy is enforced

- `spots` rows are readable only by their owner. Everyone else reads `public_spots`, which shows named, shared spots with a location the `prepare_spot` trigger has snapped to a ~150 m grid, and photos only after `moderation = 'approved'`.
- Photo spots start as `pending`. Approve or reject them from the dashboard (or a moderation job) by updating `spots.moderation`.
- `limit_spot_rate` caps spots at 120 per family per day; `consume_ai_quota` caps AI calls (60 photo checks and 80 Ask questions per family per day, set in the functions).
- `vibe_checks` are public but carry only an author label like "Parent of 2".
- `place_submissions` are readable only by the family that sent them and by moderators. Approved places carry the same kind of label ("Added by Parent of 2") and are created at review time.

## Places

`places_nearby(at_lat, at_lng, radius_m, categories)` returns places with distance, vibe stats and any live sponsorship. Fill `places` from curated data or a nightly OpenStreetMap import (see `src/services/places/osm.ts` for the tag mapping the app uses on the device).

## Places added by parents

- Families insert into `place_submissions`. The `prepare_place_submission` trigger forces every new row to `pending`, clears the review fields, and allows at most 5 pending places per family. The app re-sends anything that didn't go through; rows that already exist are ignored.
- Moderators call `review_place_submission(submission_id, verdict, reject_reason)`. Approving inserts a `community` row into `places` (id `community_<submission id>`, ages from the chosen bands, `added_by` label) and awards 50 points. Rejecting needs a reason: `duplicate`, `private`, `not-for-kids`, `not-enough-info` or `closed`.
- `award_loved_place` (a trigger on `vibe_checks`) awards 25 more points once 3 other families' checks average 4 or better.
- `points_ledger` has one row per award (unique per family, reason and submission) and no write policies, so only these functions add points. Families read their own rows and the app shows the total.

## Model

The functions use `claude-opus-5-5` with structured JSON output, low effort for the photo check and medium for Ask, and server-side refusal fallback (`fallbacks: "default"`). Change `MODEL` in `functions/_shared/claude.ts` to trade cost for capability.
