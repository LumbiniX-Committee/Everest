-- Production-pilot custodian access, append-only report actions, public
-- summaries, and optional vantage commitments.
--
-- This migration deliberately does not edit or depend on the retirement of
-- anonymous writes in 0007. Apply 0007 only after its operational readiness
-- check passes; this migration is safe on either side of that rollout.

create table if not exists public.monitored_sites (
  id text primary key,
  name_en text not null,
  name_ne text,
  region_id text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Measurements unavailable on the handset remain unknown. Earlier migrations
-- made these columns NOT NULL; that encouraged sentinel values which look like
-- real measurements. The production pilot stores null instead.
alter table public.observations
  alter column latitude drop not null,
  alter column longitude drop not null,
  alter column bearing drop not null,
  alter column pitch drop not null,
  alter column position_error_m drop not null,
  alter column bearing_error_deg drop not null;

-- Sync retries may execute an UPDATE through upsert, but evidence content is
-- immutable. An exact retry is accepted; any changed field is rejected. The
-- server receipt timestamp is ignored because INSERT defaults may be evaluated
-- again before ON CONFLICT resolves.
create or replace function public.prevent_evidence_overwrite()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'received_at') is distinct from (to_jsonb(old) - 'received_at') then
    raise exception 'evidence rows are immutable; add a new record instead';
  end if;
  return old;
end;
$$;

drop trigger if exists observations_immutable on public.observations;
create trigger observations_immutable
  before update on public.observations
  for each row execute function public.prevent_evidence_overwrite();

drop trigger if exists condition_reports_immutable on public.condition_reports;
create trigger condition_reports_immutable
  before update on public.condition_reports
  for each row execute function public.prevent_evidence_overwrite();

create table if not exists public.monitored_vantages (
  id text primary key,
  site_id text not null references public.monitored_sites (id) on delete restrict,
  active boolean not null default true,
  urgent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_monitored_vantages_site
  on public.monitored_vantages (site_id, active);

create table if not exists public.custodian_memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id text not null references public.monitored_sites (id) on delete restrict,
  role text not null default 'custodian' check (role in ('custodian', 'manager')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

comment on table public.custodian_memberships is
  'Invite-only site access. Rows are provisioned by an administrator; there is no public self-enrolment path.';

create table if not exists public.condition_report_actions (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.condition_reports (id) on delete restrict,
  actor_user_id uuid default auth.uid() references auth.users (id) on delete set null,
  target_status text not null check (target_status in ('open', 'acknowledged', 'in_progress', 'resolved')),
  note text,
  created_at timestamptz not null default now(),
  constraint condition_report_actions_note_length check (char_length(coalesce(note, '')) <= 2000)
);

create index if not exists idx_condition_report_actions_report
  on public.condition_report_actions (report_id, created_at desc, id desc);

comment on table public.condition_report_actions is
  'Append-only custodian audit trail. Current state is derived from the newest action; corrections add an action instead of rewriting history.';
comment on column public.condition_report_actions.actor_user_id is
  'Taken from auth.uid(). Null only when the actor account was later removed; the action itself remains evidence.';

create table if not exists public.vantage_priority_actions (
  id uuid primary key default gen_random_uuid(),
  vantage_id text not null references public.monitored_vantages (id) on delete restrict,
  actor_user_id uuid default auth.uid() references auth.users (id) on delete set null,
  urgent boolean not null,
  note text,
  created_at timestamptz not null default now(),
  constraint vantage_priority_actions_note_length check (char_length(coalesce(note, '')) <= 1000)
);

create index if not exists idx_vantage_priority_actions_vantage
  on public.vantage_priority_actions (vantage_id, created_at desc, id desc);

comment on table public.vantage_priority_actions is
  'Append-only custodian changes to survey urgency; public ranking derives the current value from the newest action.';

create table if not exists public.vantage_commitments (
  id uuid primary key default gen_random_uuid(),
  vantage_id text not null references public.monitored_vantages (id) on delete restrict,
  owner_user_id uuid default auth.uid() references auth.users (id) on delete set null,
  owner_kind text not null check (owner_kind in ('individual', 'school')),
  public_label text,
  cadence_days integer not null default 90 check (cadence_days between 30 and 365),
  next_due_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vantage_commitments_public_label_length check (char_length(coalesce(public_label, '')) <= 120)
);

create index if not exists idx_vantage_commitments_owner
  on public.vantage_commitments (owner_user_id, active, next_due_at);
create index if not exists idx_vantage_commitments_vantage
  on public.vantage_commitments (vantage_id, active, next_due_at);
create unique index if not exists idx_vantage_commitments_one_active_owner
  on public.vantage_commitments (vantage_id, owner_user_id)
  where active and owner_user_id is not null;

alter table public.monitored_sites enable row level security;
alter table public.monitored_vantages enable row level security;
alter table public.custodian_memberships enable row level security;
alter table public.condition_report_actions enable row level security;
alter table public.vantage_priority_actions enable row level security;
alter table public.vantage_commitments enable row level security;

-- The catalog contains no visitor evidence and is intentionally readable by
-- both the app and the public transparency page.
drop policy if exists monitored_sites_public_read on public.monitored_sites;
create policy monitored_sites_public_read
  on public.monitored_sites for select to anon, authenticated using (active);

drop policy if exists monitored_vantages_public_read on public.monitored_vantages;
create policy monitored_vantages_public_read
  on public.monitored_vantages for select to anon, authenticated using (active);

drop policy if exists custodian_memberships_own_read on public.custodian_memberships;
create policy custodian_memberships_own_read
  on public.custodian_memberships for select to authenticated
  using (user_id = auth.uid());

create or replace function public.is_custodian_for_site(p_site_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.custodian_memberships membership
    where membership.user_id = auth.uid()
      and membership.site_id = p_site_id
      and membership.active
  );
$$;

revoke all on function public.is_custodian_for_site(text) from public;
grant execute on function public.is_custodian_for_site(text) to authenticated;

-- Owner policies from 0006 remain in force. PostgreSQL combines permissive
-- policies with OR, so an author can still read their own row while a custodian
-- can read every row for a site they have explicitly been assigned.
drop policy if exists observations_custodian_select on public.observations;
create policy observations_custodian_select
  on public.observations for select to authenticated
  using (public.is_custodian_for_site(site_id));

drop policy if exists condition_reports_custodian_select on public.condition_reports;
create policy condition_reports_custodian_select
  on public.condition_reports for select to authenticated
  using (public.is_custodian_for_site(site_id));

drop policy if exists condition_report_actions_custodian_select on public.condition_report_actions;
create policy condition_report_actions_custodian_select
  on public.condition_report_actions for select to authenticated
  using (
    exists (
      select 1 from public.condition_reports report
      where report.id = report_id
        and public.is_custodian_for_site(report.site_id)
    )
  );

drop policy if exists condition_report_actions_custodian_insert on public.condition_report_actions;
create policy condition_report_actions_custodian_insert
  on public.condition_report_actions for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1 from public.condition_reports report
      where report.id = report_id
        and public.is_custodian_for_site(report.site_id)
    )
  );

-- No update or delete policy exists for report actions. The absence is the
-- enforcement of the append-only product promise, not an omitted capability.

create or replace function public.validate_condition_report_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status text;
begin
  -- Identity and chronology are server-owned even if a caller supplies values.
  if auth.uid() is null then
    raise exception 'an authenticated actor is required';
  end if;
  new.actor_user_id := auth.uid();
  new.created_at := now();

  -- Serialize concurrent transitions for the same report.
  perform 1
  from public.condition_reports report
  where report.id = new.report_id
  for update;

  select action.target_status
    into previous_status
  from public.condition_report_actions action
  where action.report_id = new.report_id
  order by action.created_at desc, action.id desc
  limit 1;

  previous_status := coalesce(previous_status, 'open');

  if new.target_status = previous_status then
    raise exception 'report is already in status %', previous_status;
  elsif previous_status = 'open' and new.target_status <> 'acknowledged' then
    raise exception 'an open report must be acknowledged first';
  elsif previous_status = 'acknowledged' and new.target_status not in ('in_progress', 'resolved') then
    raise exception 'an acknowledged report may move to in_progress or resolved';
  elsif previous_status = 'in_progress' and new.target_status <> 'resolved' then
    raise exception 'an in-progress report may only be resolved';
  elsif previous_status = 'resolved' and new.target_status <> 'open' then
    raise exception 'a resolved report must be explicitly reopened';
  elsif previous_status = 'resolved' and length(trim(coalesce(new.note, ''))) = 0 then
    raise exception 'reopening a resolved report requires an explanation';
  end if;

  return new;
end;
$$;

drop trigger if exists condition_report_actions_validate on public.condition_report_actions;
create trigger condition_report_actions_validate
  before insert on public.condition_report_actions
  for each row execute function public.validate_condition_report_action();

drop policy if exists vantage_priority_actions_custodian_select on public.vantage_priority_actions;
create policy vantage_priority_actions_custodian_select
  on public.vantage_priority_actions for select to authenticated
  using (
    exists (
      select 1 from public.monitored_vantages vantage
      where vantage.id = vantage_id
        and public.is_custodian_for_site(vantage.site_id)
    )
  );

drop policy if exists vantage_priority_actions_custodian_insert on public.vantage_priority_actions;
create policy vantage_priority_actions_custodian_insert
  on public.vantage_priority_actions for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1 from public.monitored_vantages vantage
      where vantage.id = vantage_id
        and public.is_custodian_for_site(vantage.site_id)
    )
  );

create or replace function public.stamp_vantage_priority_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'an authenticated actor is required';
  end if;
  new.actor_user_id := auth.uid();
  new.created_at := now();
  perform 1 from public.monitored_vantages vantage where vantage.id = new.vantage_id for update;
  return new;
end;
$$;

drop trigger if exists vantage_priority_actions_stamp on public.vantage_priority_actions;
create trigger vantage_priority_actions_stamp
  before insert on public.vantage_priority_actions
  for each row execute function public.stamp_vantage_priority_action();

drop policy if exists vantage_commitments_owner_select on public.vantage_commitments;
create policy vantage_commitments_owner_select
  on public.vantage_commitments for select to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists vantage_commitments_custodian_select on public.vantage_commitments;
create policy vantage_commitments_custodian_select
  on public.vantage_commitments for select to authenticated
  using (
    exists (
      select 1 from public.monitored_vantages vantage
      where vantage.id = vantage_id
        and public.is_custodian_for_site(vantage.site_id)
    )
  );

drop policy if exists vantage_commitments_owner_insert on public.vantage_commitments;
create policy vantage_commitments_owner_insert
  on public.vantage_commitments for insert to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists vantage_commitments_owner_update on public.vantage_commitments;
create policy vantage_commitments_owner_update
  on public.vantage_commitments for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- A custodian may read a private observation photograph only when its first
-- path segment is a site they manage. Buckets remain private and no anonymous
-- read policy is added.
drop policy if exists observations_bucket_custodian_select on storage.objects;
create policy observations_bucket_custodian_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'observations'
    and public.is_custodian_for_site((storage.foldername(name))[1])
  );

-- Photographs are evidence too. The app now uploads with upsert=false and
-- treats an existing object as a completed retry, so authenticated writers no
-- longer need UPDATE on either private evidence bucket. Keeping the old
-- policies would allow a holder of an object's path to replace its bytes while
-- leaving the immutable database row looking unchanged.
drop policy if exists observations_bucket_auth_update on storage.objects;
drop policy if exists quest_evidence_auth_update on storage.objects;

-- Public coverage exposes only a last-survey timestamp and a priority score.
-- Coordinates, authors, photographs, and notes never cross this boundary.
create or replace function public.get_public_vantage_coverage(p_days integer default 90)
returns table (
  vantage_id text,
  site_id text,
  last_capture_at timestamptz,
  survey_age_days integer,
  priority integer,
  urgent boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with last_capture as (
    select observation.vantage_id, max(observation.captured_at) as captured_at
    from public.observations observation
    group by observation.vantage_id
  ), latest_priority as (
    select distinct on (action.vantage_id) action.vantage_id, action.urgent
    from public.vantage_priority_actions action
    order by action.vantage_id, action.created_at desc, action.id desc
  )
  select
    vantage.id,
    vantage.site_id,
    last_capture.captured_at,
    case
      when last_capture.captured_at is null then null
      else floor(extract(epoch from (now() - last_capture.captured_at)) / 86400)::integer
    end,
    (case when coalesce(latest_priority.urgent, vantage.urgent) then 1000000 else 0 end)
      + coalesce(floor(extract(epoch from (now() - last_capture.captured_at)) / 86400)::integer, 36500),
    coalesce(latest_priority.urgent, vantage.urgent)
  from public.monitored_vantages vantage
  left join last_capture on last_capture.vantage_id = vantage.id
  left join latest_priority on latest_priority.vantage_id = vantage.id
  where vantage.active
  order by priority desc, vantage.id;
$$;

revoke all on function public.get_public_vantage_coverage(integer) from public;
grant execute on function public.get_public_vantage_coverage(integer) to anon, authenticated;

-- Public condition summaries are deliberately aggregate and omit reporter
-- identity, notes, coordinates, paths, and reports that no custodian has acted
-- on. This function is the only anonymous route into condition evidence.
create or replace function public.get_public_site_condition(p_site_id text, p_days integer default 90)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select case when p_days in (30, 90, 365) then p_days else 90 end as days
  ), site_row as (
    select site.id, site.name_en, site.name_ne
    from public.monitored_sites site
    where site.id = p_site_id and site.active
  ), vantage_rows as (
    select vantage.id
    from public.monitored_vantages vantage
    where vantage.site_id = p_site_id and vantage.active
  ), last_observations as (
    select observation.vantage_id, max(observation.captured_at) as last_capture_at
    from public.observations observation
    where observation.site_id = p_site_id
    group by observation.vantage_id
  ), recent_vantages as (
    select distinct observation.vantage_id
    from public.observations observation, params
    where observation.site_id = p_site_id
      and observation.captured_at >= now() - make_interval(days => params.days)
  ), latest_actions as (
    select distinct on (action.report_id)
      action.report_id, action.target_status, action.created_at
    from public.condition_report_actions action
    order by action.report_id, action.created_at desc, action.id desc
  ), publicly_acknowledged_reports as (
    select distinct action.report_id
    from public.condition_report_actions action
    where action.target_status in ('acknowledged', 'in_progress', 'resolved')
  ), visible_conditions as (
    select report.category, report.subtype, report.severity,
      report.recorded_at, latest.target_status, latest.created_at as status_changed_at,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'status', history.target_status,
          'changed_at', history.created_at
        ) order by history.created_at, history.id)
        from public.condition_report_actions history
        where history.report_id = report.id
          and history.created_at >= (
            select min(first_ack.created_at)
            from public.condition_report_actions first_ack
            where first_ack.report_id = report.id
              and first_ack.target_status in ('acknowledged', 'in_progress', 'resolved')
          )
      ), '[]'::jsonb) as history
    from public.condition_reports report
    join latest_actions latest on latest.report_id = report.id
    join publicly_acknowledged_reports approved on approved.report_id = report.id
    cross join params
    where report.site_id = p_site_id
      and report.recorded_at >= now() - make_interval(days => params.days)
  )
  select case when count(site_row.id) = 0 then null else jsonb_build_object(
    'site_id', max(site_row.id),
    'name', jsonb_build_object('en', max(site_row.name_en), 'ne', max(site_row.name_ne)),
    'window_days', (select days from params),
    'vantages_total', (select count(*) from vantage_rows),
    'vantages_surveyed', (select count(*) from vantage_rows v join recent_vantages r on r.vantage_id = v.id),
    'coverage_pct', coalesce(round(100.0 * (select count(*) from vantage_rows v join recent_vantages r on r.vantage_id = v.id) / nullif((select count(*) from vantage_rows), 0)), 0),
    'vantages', coalesce((
      select jsonb_agg(jsonb_build_object('id', v.id, 'last_survey_at', r.last_capture_at) order by v.id)
      from vantage_rows v left join last_observations r on r.vantage_id = v.id
    ), '[]'::jsonb),
    'conditions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category', condition.category,
        'subtype', condition.subtype,
        'severity', condition.severity,
        'reported_at', condition.recorded_at,
        'status', condition.target_status,
        'status_changed_at', condition.status_changed_at,
        'history', condition.history
      ) order by condition.recorded_at desc)
      from visible_conditions condition
    ), '[]'::jsonb)
  ) end
  from site_row;
$$;

revoke all on function public.get_public_site_condition(text, integer) from public;
grant execute on function public.get_public_site_condition(text, integer) to anon, authenticated;

-- Supabase projects may grant broad default table privileges in `public`.
-- Replace those defaults with the smallest API surface; RLS remains the second,
-- row-level boundary.
revoke all on public.monitored_sites, public.monitored_vantages from anon, authenticated;
revoke all on public.custodian_memberships from anon, authenticated;
revoke all on public.condition_report_actions from anon, authenticated;
revoke all on public.vantage_priority_actions from anon, authenticated;
revoke all on public.vantage_commitments from anon, authenticated;

grant select on public.monitored_sites, public.monitored_vantages to anon, authenticated;
grant select on public.custodian_memberships to authenticated;
grant select, insert on public.condition_report_actions to authenticated;
grant select, insert on public.vantage_priority_actions to authenticated;
-- Owners may end a commitment, but cannot use the public client to move it to
-- another vantage, change its owner/cadence, or edit its due date.
grant select, insert, update (active) on public.vantage_commitments to authenticated;
