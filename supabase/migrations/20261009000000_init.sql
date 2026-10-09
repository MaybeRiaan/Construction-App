-- Playdar: initial schema
-- Places and parent ratings ("vibe checks"), plus the Hard Hat Hunt game:
-- spotted machines, name votes and a weekly leaderboard.
--
-- Privacy model
-- * Every user is a parent account (anonymous sign-in is fine). Kids never
--   have accounts and their names are never stored here.
-- * Spots are private by default. Public spots are read through the
--   `public_spots` view, which exposes a location rounded to ~150 m and hides
--   photos until they pass moderation.
-- * Vibe checks are public but carry only a short author label such as
--   "Parent of 2", chosen client-side.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Reference data

create table public.vehicle_types (
  id text primary key,
  name text not null,
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'legendary')),
  xp smallint not null check (xp > 0)
);

insert into public.vehicle_types (id, name, rarity, xp) values
  ('excavator', 'Excavator', 'common', 10),
  ('bulldozer', 'Bulldozer', 'common', 10),
  ('backhoe', 'Backhoe loader', 'common', 10),
  ('wheelLoader', 'Wheel loader', 'common', 10),
  ('skidSteer', 'Skid steer', 'uncommon', 20),
  ('dumpTruck', 'Dump truck', 'common', 10),
  ('towerCrane', 'Tower crane', 'uncommon', 20),
  ('mobileCrane', 'Mobile crane', 'rare', 40),
  ('telehandler', 'Telehandler', 'uncommon', 20),
  ('forklift', 'Forklift', 'common', 10),
  ('cherryPicker', 'Cherry picker', 'uncommon', 20),
  ('roadRoller', 'Road roller', 'uncommon', 20),
  ('grader', 'Motor grader', 'rare', 40),
  ('paver', 'Asphalt paver', 'rare', 40),
  ('cementMixer', 'Cement mixer', 'common', 10),
  ('concretePump', 'Concrete pump', 'rare', 40),
  ('pileDriver', 'Pile driver', 'legendary', 80),
  ('tractor', 'Tractor', 'common', 10),
  ('garbageTruck', 'Garbage truck', 'common', 10),
  ('fireEngine', 'Fire engine', 'uncommon', 20);

-- ---------------------------------------------------------------------------
-- Places

create table public.places (
  id text primary key,                       -- 'osm:node/123', 'curated:<uuid>', ...
  source text not null check (source in ('osm', 'curated', 'business', 'community')),
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in ('parks', 'playgrounds', 'walks', 'books', 'indoor', 'water', 'animals', 'museums', 'cafes', 'events', 'sights')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography) stored,
  area text,
  address text,
  blurb text,
  description text,
  highlights text[] not null default '{}',
  amenities text[] not null default '{}',
  age_min smallint not null default 0,
  age_max smallint not null default 12,
  price smallint not null default 0 check (price between 0 and 3),
  price_note text,
  indoor boolean not null default false,
  opening_hours text,                        -- OpenStreetMap opening_hours syntax
  website text,
  phone text,
  keywords text[] not null default '{}',
  osm_tags jsonb,
  updated_at timestamptz not null default now()
);

create index places_location_idx on public.places using gist (location);
create index places_category_idx on public.places (category);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sponsorship never changes ratings or organic ranking; it only earns the
-- Featured row, a labelled pin and an offer line.
create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  tier text not null check (tier in ('featured', 'spotlight')),
  label text not null default 'Partner',
  offer text check (char_length(offer) <= 120),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index sponsorships_place_idx on public.sponsorships (place_id);

create table public.place_events (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  duration_min integer not null default 60 check (duration_min > 0),
  price text,
  ages text,
  sponsored boolean not null default false
);

create index place_events_place_idx on public.place_events (place_id, starts_at);

-- ---------------------------------------------------------------------------
-- Vibe checks: one per family per place. place_id is not a foreign key so
-- places imported on the device (live OpenStreetMap mode) can be rated
-- before they are mirrored into `places`.

create table public.vibe_checks (
  id uuid primary key default gen_random_uuid(),
  place_id text not null check (char_length(place_id) <= 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  ages text[] not null default '{}',
  note text check (char_length(note) <= 280),
  author_label text check (char_length(author_label) <= 40),
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);

create index vibe_checks_place_idx on public.vibe_checks (place_id);

create view public.place_vibe_stats
with (security_invoker = true) as
select
  v.place_id,
  count(*)::integer as count,
  round(avg(v.score)::numeric, 2) as avg,
  array[
    count(*) filter (where v.score = 1),
    count(*) filter (where v.score = 2),
    count(*) filter (where v.score = 3),
    count(*) filter (where v.score = 4),
    count(*) filter (where v.score = 5)
  ]::integer[] as dist,
  coalesce((
    select array_agg(t.tag order by t.n desc)
    from (
      select tag, count(*) as n
      from public.vibe_checks v2, unnest(v2.tags) as tag
      where v2.place_id = v.place_id
      group by tag
      order by n desc
      limit 5
    ) t
  ), '{}') as top_tags
from public.vibe_checks v
group by v.place_id;

create table public.saved_places (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id text not null,
  list text not null default 'favourites' check (list in ('favourites', 'try', 'rainy')),
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- ---------------------------------------------------------------------------
-- Hard Hat Hunt

create table public.spots (
  id text primary key check (char_length(id) <= 64),     -- generated on the device
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_type text not null references public.vehicle_types (id),
  nickname text check (char_length(nickname) between 1 and 24),
  colour text check (colour in ('yellow', 'orange', 'red', 'green', 'blue', 'white', 'other')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography) stored,
  -- Small JPEG data URL (~320 px). Move to Storage when traffic grows.
  photo_data text check (photo_data is null or (photo_data like 'data:image/%' and char_length(photo_data) < 160000)),
  moderation text not null default 'pending' check (moderation in ('pending', 'approved', 'rejected')),
  team_name text check (char_length(team_name) <= 28),
  area text check (char_length(area) <= 60),
  is_public boolean not null default false,
  found_of text references public.spots (id) on delete set null,
  created_at timestamptz not null default now()
);

create index spots_location_idx on public.spots using gist (location);
create index spots_user_created_idx on public.spots (user_id, created_at desc);
create index spots_public_created_idx on public.spots (created_at desc) where is_public;

-- Public spots never reveal where a child stood: snap to a ~150 m grid
-- server-side too, whatever the client sent. Spots without a photo need no
-- review; photos wait for moderation before anyone else sees them.
create function public.prepare_spot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  lat_step double precision := 150.0 / 111320.0;
  lng_step double precision;
begin
  if new.is_public then
    lng_step := lat_step / greatest(cos(radians(new.lat)), 0.01);
    new.lat := round(new.lat / lat_step) * lat_step;
    new.lng := round(new.lng / lng_step) * lng_step;
  end if;
  if tg_op = 'INSERT' then
    new.moderation := case when new.photo_data is null then 'approved' else 'pending' end;
  elsif new.photo_data is distinct from old.photo_data then
    new.moderation := case when new.photo_data is null then 'approved' else 'pending' end;
  else
    new.moderation := old.moderation;
  end if;
  return new;
end;
$$;

create trigger spots_prepare
before insert or update on public.spots
for each row execute function public.prepare_spot();

-- Keep the game fair and the table tidy: at most 120 spots per family per day.
create function public.limit_spot_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.spots s
    where s.user_id = new.user_id and s.created_at > now() - interval '1 day'
  ) >= 120 then
    raise exception 'Daily spot limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger spots_rate_limit
before insert on public.spots
for each row execute function public.limit_spot_rate();

create table public.spot_votes (
  spot_id text not null references public.spots (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

create table public.players (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  team_name text not null default 'Hunters' check (char_length(team_name) between 1 and 28),
  -- Self-reported all-time stats for the profile screen. The leaderboard
  -- below recomputes XP on the server from spots.
  xp integer not null default 0 check (xp >= 0),
  spots integer not null default 0 check (spots >= 0),
  types integer not null default 0 check (types between 0 and 20),
  updated_at timestamptz not null default now()
);

-- Intentionally runs with the view owner's rights (not security_invoker):
-- it is the only way other families read spots, and it exposes just these
-- columns, the rounded location, and photos that passed moderation.
create view public.public_spots as
select
  s.id,
  s.user_id,
  s.vehicle_type,
  s.nickname,
  s.colour,
  s.lat,
  s.lng,
  case when s.moderation = 'approved' then s.photo_data end as photo_url,
  coalesce(s.team_name, p.team_name) as team_name,
  s.area,
  s.created_at
from public.spots s
left join public.players p on p.user_id = s.user_id
where s.is_public and s.nickname is not null and s.moderation <> 'rejected';

create view public.spot_vote_counts
with (security_invoker = true) as
select spot_id, count(*)::integer as votes
from public.spot_votes
group by spot_id;

-- Weekly XP (Monday start), recomputed from spots: rarity XP plus a bonus
-- for each machine type a family saw for the first time this week.
create view public.leaderboard_weekly as
with week_spots as (
  select s.user_id, s.vehicle_type, vt.xp
  from public.spots s
  join public.vehicle_types vt on vt.id = s.vehicle_type
  where s.created_at >= date_trunc('week', now())
)
select
  w.user_id,
  coalesce(p.team_name, 'Hunters') as team_name,
  (sum(w.xp) + 25 * count(distinct w.vehicle_type))::integer as xp,
  count(*)::integer as spots,
  count(distinct w.vehicle_type)::integer as types
from week_spots w
left join public.players p on p.user_id = w.user_id
group by w.user_id, p.team_name
order by xp desc
limit 100;

-- ---------------------------------------------------------------------------
-- Places near a point, with vibe stats and any live sponsorship.

create function public.places_nearby(
  at_lat double precision,
  at_lng double precision,
  radius_m double precision default 5000,
  categories text[] default null
)
returns table (
  id text,
  name text,
  category text,
  lat double precision,
  lng double precision,
  distance_m double precision,
  area text,
  address text,
  blurb text,
  amenities text[],
  age_min smallint,
  age_max smallint,
  price smallint,
  indoor boolean,
  opening_hours text,
  vibe_count integer,
  vibe_avg numeric,
  vibe_dist integer[],
  top_tags text[],
  sponsor_tier text,
  sponsor_label text,
  sponsor_offer text
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(at_lng, at_lat), 4326)::extensions.geography as g
  )
  select
    p.id, p.name, p.category, p.lat, p.lng,
    extensions.st_distance(p.location, o.g) as distance_m,
    p.area, p.address, p.blurb, p.amenities, p.age_min, p.age_max, p.price, p.indoor, p.opening_hours,
    coalesce(s.count, 0), s.avg, s.dist, coalesce(s.top_tags, '{}'),
    sp.tier, sp.label, sp.offer
  from public.places p
  cross join origin o
  left join public.place_vibe_stats s on s.place_id = p.id
  left join lateral (
    select x.tier, x.label, x.offer
    from public.sponsorships x
    where x.place_id = p.id and x.starts_at <= now() and (x.ends_at is null or x.ends_at > now())
    order by (x.tier = 'spotlight') desc, x.starts_at desc
    limit 1
  ) sp on true
  where extensions.st_dwithin(p.location, o.g, least(radius_m, 50000))
    and (categories is null or p.category = any (categories))
  order by distance_m
  limit 500;
$$;

-- ---------------------------------------------------------------------------
-- AI usage quota for the edge functions (per family, per day).

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('identify', 'ask')),
  count integer not null default 0,
  primary key (user_id, day, kind)
);

create function public.consume_ai_quota(quota_kind text, daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, kind, count)
  values (auth.uid(), current_date, quota_kind, 1)
  on conflict (user_id, day, kind) do update set count = public.ai_usage.count + 1
  returning count into used;
  return used <= daily_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security

alter table public.vehicle_types enable row level security;
alter table public.places enable row level security;
alter table public.businesses enable row level security;
alter table public.sponsorships enable row level security;
alter table public.place_events enable row level security;
alter table public.vibe_checks enable row level security;
alter table public.saved_places enable row level security;
alter table public.spots enable row level security;
alter table public.spot_votes enable row level security;
alter table public.players enable row level security;
alter table public.ai_usage enable row level security;

create policy "Reference data is public" on public.vehicle_types for select using (true);
create policy "Places are public" on public.places for select using (true);
create policy "Live sponsorships are public" on public.sponsorships for select using (true);
create policy "Events are public" on public.place_events for select using (true);

create policy "Owners manage their business" on public.businesses
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "Vibe checks are public" on public.vibe_checks for select using (true);
create policy "Families write their own vibe checks" on public.vibe_checks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Families edit their own vibe checks" on public.vibe_checks
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Families delete their own vibe checks" on public.vibe_checks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Saved places are private" on public.saved_places
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Direct table access is owner-only; everyone else reads public_spots.
create policy "Families read their own spots" on public.spots
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Families add spots" on public.spots
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Families edit their own spots" on public.spots
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Families delete their own spots" on public.spots
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Votes are countable by everyone" on public.spot_votes for select using (true);
create policy "Families cast their own votes" on public.spot_votes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Families withdraw their own votes" on public.spot_votes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Team names are public" on public.players for select using (true);
create policy "Families manage their own player row" on public.players
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Families update their own player row" on public.players
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ai_usage has no policies: only consume_ai_quota (security definer) touches it.

grant select on public.public_spots, public.spot_vote_counts, public.leaderboard_weekly, public.place_vibe_stats to anon, authenticated;
grant execute on function public.places_nearby(double precision, double precision, double precision, text[]) to anon, authenticated;
grant execute on function public.consume_ai_quota(text, integer) to authenticated;
revoke execute on function public.consume_ai_quota(text, integer) from anon, public;
