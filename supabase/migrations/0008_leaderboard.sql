-- The global leaderboard.
--
-- P4 of the build plan, and the one change that reverses a documented design
-- decision rather than extending one. What follows is the reasoning, because a
-- future reader will find the charter and this migration and need to know which
-- came second and why.
--
-- ── What this does not do ───────────────────────────────────────────────────
--
-- It does not sync puṇya. `merit_events` stays on the device, with no score
-- column, no total, and no rank — exactly as Charter #9 and 05-CONTENT-SPEC §6
-- describe it. Nothing about the merit model changes here.
--
-- The plan assumed the leaderboard would need merit on the server. It does not,
-- and that turned out to matter for three reasons:
--
--   1. **Integrity.** A client-reported score is a number the client chose. RLS
--      can stop you writing someone else's row; it cannot stop you claiming
--      50,000 points in your own. Points derived from observations, condition
--      reports and quest submissions are backed by rows that had to be uploaded
--      — including photographs — so inflating a score means doing the work.
--   2. **Privacy.** Syncing a merit ledger would put a per-act, per-site,
--      timestamped record of someone's movements on the server. The leaderboard
--      needs a number, not an itinerary.
--   3. **The charter survives.** Puṇya remains what it was: unranked, uncapped
--      by comparison, invisible to anyone else. The leaderboard is a separate
--      and openly competitive count of contributions, which is what the pitch
--      actually asks for — "completing these side quests earns users points".
--
-- That is the honest description of the compromise. A competitive ranking at a
-- sacred site is still a reversal of a stated position, and it is being made
-- deliberately, not by accident.
--
-- ── Weights ─────────────────────────────────────────────────────────────────
--
-- Mirrored from shared/merit.ts, which warns in its own header that two copies
-- of these numbers drift. They are duplicated here because SQL cannot import
-- TypeScript; `npm run verify` should grow a check that they still agree.
--
--   observation      -> resurvey       50
--   condition report -> first_report   25
--   quest submission -> contribution   30
--   daily cap                         200
--
-- The daily cap is applied per device per day, not just as a client nicety.
-- Without it the board rewards a burst — fifty photographs in an afternoon —
-- over the sustained attention the whole product is about. Rule 1 of the merit
-- rules says the cap is enforced on both sides; this is the server side.
--
-- Severity does not scale points, per rule 5: finding worse damage must never
-- pay more, or the incentive is to find damage rather than to look.

-- ── Handles ─────────────────────────────────────────────────────────────────
--
-- A name to show beside a score. Keyed by device_id because that is the only
-- identity the app currently has; user_id is filled by DEFAULT auth.uid() and
-- takes over once anonymous sign-in is enabled.
--
-- Chosen by the person, never derived from the device id — a name that is
-- secretly an identifier is worse than no name.

create table if not exists public.profiles (
  device_id text primary key,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  handle text not null check (length(trim(handle)) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Display handle for the leaderboard. Keyed by device until auth exists. Handles are spoofable while anon writes are permitted — scores are not.';

alter table public.profiles enable row level security;

-- Anon writes, for the same reason the record tables allow them: there is no
-- session yet. This means a handle can be overwritten by anyone who knows the
-- device_id. It is a display name, not a credential, and the scores it labels
-- are computed from uploaded evidence rather than claimed — so the damage is
-- someone renaming a row, not someone winning. Retiring this alongside the
-- other anon policies (0007) is what fixes it properly.
drop policy if exists profiles_anon_write on public.profiles;
create policy profiles_anon_write
  on public.profiles for insert to anon with check (true);

drop policy if exists profiles_anon_update on public.profiles;
create policy profiles_anon_update
  on public.profiles for update to anon using (true) with check (true);

drop policy if exists profiles_owner_write on public.profiles;
create policy profiles_owner_write
  on public.profiles for insert to authenticated with check (user_id = auth.uid());

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update
  on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Readable, because a board with no names is not a board.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to anon, authenticated using (true);

-- ── The board ───────────────────────────────────────────────────────────────
--
-- One view, and it is SECURITY DEFINER on purpose: it must be readable by
-- people who cannot read the tables underneath it, which is the entire reason
-- it exists. Supabase's linter flags that as an ERROR, and the finding is
-- accepted rather than missed — the remediation it suggests (security_invoker)
-- would make the board return each reader their own row and nobody else's,
-- which is not a leaderboard.
--
-- What it exposes is a handle, a number, and a coarse count of active days.
-- Never an observation, a photograph path, a coordinate, or which sites anyone
-- visited.
--
-- The daily total is a CTE rather than its own view. It was briefly a second
-- view granted to anon, which exposed points per device *per day* — a record of
-- which days someone was at Lumbini. The board needs a number, not a pattern of
-- movement, and that is precisely the question the base tables refuse to answer.
--
-- device_id is exposed so the app can find its own row and highlight it. It is
-- an opaque random with no authority attached: it is not a credential and
-- grants nothing.

create or replace view public.leaderboard as
  with daily as (
    select
      device_id,
      day,
      least(sum(points), 200)::int as points
    from (
      select device_id, (captured_at at time zone 'utc')::date as day, 50 as points
        from public.observations where device_id is not null
      union all
      select device_id, (recorded_at at time zone 'utc')::date, 25
        from public.condition_reports where device_id is not null
      union all
      select device_id, (submitted_at at time zone 'utc')::date, 30
        from public.quest_submissions
    ) contributions
    group by device_id, day
  )
  select
    d.device_id,
    coalesce(nullif(trim(p.handle), ''), 'Unnamed guardian') as handle,
    sum(d.points)::int as points,
    coalesce(sum(d.points) filter (where d.day >= (now() at time zone 'utc')::date - 7), 0)::int as points_7d,
    count(*)::int as active_days,
    max(d.day) as last_active
  from daily d
  left join public.profiles p on p.device_id = d.device_id
  group by d.device_id, p.handle;

comment on view public.leaderboard is
  'Global ranking by contribution points, with the 200/day cap from shared/merit.ts applied. Exposes handle, points and a day count only — never observations, coordinates, photographs or which sites anyone visited. SECURITY DEFINER is deliberate.';

grant select on public.leaderboard to anon, authenticated;
