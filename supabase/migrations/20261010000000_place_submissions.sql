-- Playdar: places added by parents ("for parents, by parents") and Scout points.
--
-- Families suggest places. Each suggestion waits in a review queue that only
-- moderators see. An approved suggestion becomes a 'community' row in places
-- and earns the family Scout points; more points arrive when other families
-- rate the place a vibe. Points are written only by these functions, never by
-- clients, so they can later be exchanged for partner rewards.

-- ---------------------------------------------------------------------------
-- Moderators (the Playdar team). Add one in the SQL editor:
--   insert into public.moderators (user_id) values ('<auth user id>');

create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.moderators m where m.user_id = auth.uid());
$$;

-- Who added a community place, as a label such as "Parent of 2".
alter table public.places add column added_by text check (char_length(added_by) <= 40);

-- ---------------------------------------------------------------------------
-- Suggestions

create table public.place_submissions (
  id text primary key check (char_length(id) between 6 and 64),   -- generated on the device
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  category text not null check (category in ('parks', 'playgrounds', 'walks', 'books', 'indoor', 'water', 'animals', 'museums', 'cafes', 'sights')),
  -- The place itself (a public venue), not where the parent is standing.
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  ages text[] not null default '{}' check (ages <@ array['baby', 'toddler', 'kid', 'tween']::text[]),
  amenities text[] not null default '{}' check (cardinality(amenities) <= 12),
  price smallint not null default 0 check (price in (0, 1)),
  indoor boolean not null default false,
  tip text check (char_length(tip) <= 280),
  website text check (char_length(website) <= 200),
  author_label text check (char_length(author_label) <= 40),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text check (reason in ('duplicate', 'private', 'not-for-kids', 'not-enough-info', 'closed')),
  place_id text references public.places (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index place_submissions_user_idx on public.place_submissions (user_id, created_at desc);
create index place_submissions_pending_idx on public.place_submissions (created_at) where status = 'pending';
create index place_submissions_place_idx on public.place_submissions (place_id) where place_id is not null;

-- New suggestions always start as pending, whatever the client sent, and a
-- family can have at most 5 waiting at once. A re-sent suggestion that already
-- exists skips the cap and is dropped by the insert's on-conflict clause.
create function public.prepare_place_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.place_submissions s where s.id = new.id) then
    return new;
  end if;
  new.status := 'pending';
  new.reason := null;
  new.place_id := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  if (
    select count(*) from public.place_submissions s
    where s.user_id = new.user_id and s.status = 'pending'
  ) >= 5 then
    raise exception 'Too many places waiting for review' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger place_submissions_prepare
before insert on public.place_submissions
for each row execute function public.prepare_place_submission();

-- ---------------------------------------------------------------------------
-- Scout points ledger. One row per award, so the total is auditable and each
-- award can only happen once.

create table public.points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  points integer not null check (points > 0),
  reason text not null check (reason in ('place_added', 'place_loved')),
  ref text not null,                          -- the submission id
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);

create index points_ledger_user_idx on public.points_ledger (user_id);

-- ---------------------------------------------------------------------------
-- Review: moderators approve (publish the place, +50 points) or reject.

create function public.review_place_submission(submission_id text, verdict text, reject_reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.place_submissions%rowtype;
  pid text;
  age_lo smallint;
  age_hi smallint;
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can review places' using errcode = '42501';
  end if;
  select * into s from public.place_submissions where id = submission_id for update;
  if not found then
    raise exception 'No such submission' using errcode = 'P0002';
  end if;
  if s.status <> 'pending' then
    return s.place_id;
  end if;

  if verdict = 'approved' then
    pid := 'community_' || s.id;
    select coalesce(min(b.lo), 0)::smallint, coalesce(max(b.hi), 12)::smallint into age_lo, age_hi
    from (values ('baby', 0, 1), ('toddler', 2, 4), ('kid', 5, 8), ('tween', 9, 12)) as b (band, lo, hi)
    where b.band = any (s.ages);
    insert into public.places (id, source, name, category, lat, lng, blurb, amenities, age_min, age_max, price, indoor, website, keywords, added_by)
    values (pid, 'community', s.name, s.category, s.lat, s.lng, s.tip, s.amenities, age_lo, age_hi, s.price, s.indoor, s.website, array['added by a parent'], s.author_label)
    on conflict (id) do nothing;
    update public.place_submissions
    set status = 'approved', place_id = pid, reviewed_at = now(), reviewed_by = auth.uid()
    where id = s.id;
    insert into public.points_ledger (user_id, points, reason, ref)
    values (s.user_id, 50, 'place_added', s.id)
    on conflict do nothing;
    return pid;
  elsif verdict = 'rejected' then
    if reject_reason is null then
      raise exception 'A rejection needs a reason' using errcode = '22023';
    end if;
    update public.place_submissions
    set status = 'rejected', reason = reject_reason, reviewed_at = now(), reviewed_by = auth.uid()
    where id = s.id;
    return null;
  else
    raise exception 'verdict must be approved or rejected' using errcode = '22023';
  end if;
end;
$$;

-- +25 for the family who added a place once three other families have rated
-- it, averaging Good vibes (4) or better.
create function public.award_loved_place()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub public.place_submissions%rowtype;
begin
  select * into sub from public.place_submissions
  where place_id = new.place_id and status = 'approved'
  limit 1;
  if not found then
    return null;
  end if;
  if (
    select count(*) >= 3 and avg(v.score) >= 4
    from public.vibe_checks v
    where v.place_id = new.place_id and v.user_id <> sub.user_id
  ) then
    insert into public.points_ledger (user_id, points, reason, ref)
    values (sub.user_id, 25, 'place_loved', sub.id)
    on conflict do nothing;
  end if;
  return null;
end;
$$;

create trigger vibe_checks_award_loved
after insert or update on public.vibe_checks
for each row execute function public.award_loved_place();

-- ---------------------------------------------------------------------------
-- Row level security

alter table public.moderators enable row level security;
alter table public.place_submissions enable row level security;
alter table public.points_ledger enable row level security;

-- moderators has no policies: only is_moderator() (security definer) reads it.

create policy "Families read their own submissions; moderators read all" on public.place_submissions
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_moderator()));
create policy "Families add submissions" on public.place_submissions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Families withdraw pending submissions" on public.place_submissions
  for delete to authenticated using (user_id = (select auth.uid()) and status = 'pending');
-- No update policy: only review_place_submission changes a submission.

create policy "Families read their own points" on public.points_ledger
  for select to authenticated using (user_id = (select auth.uid()));
-- No write policies: points come only from the functions above.

grant execute on function public.is_moderator() to authenticated;
grant execute on function public.review_place_submission(text, text, text) to authenticated;
revoke execute on function public.review_place_submission(text, text, text) from anon, public;
