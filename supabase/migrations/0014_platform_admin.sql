-- The owner's console: one place to see how the whole service is doing and to
-- run the jobs that used to need SQL or a service-role script.
--
-- Admins are listed in platform_admins, which only the service role can write,
-- so becoming an admin is never possible from a browser. Every function below
-- checks is_platform_admin() itself and is the only way the console reads or
-- changes anything; the tables keep RLS with no admin policies.
--
-- Nothing here deletes. A custodian is deactivated, a code batch is revoked,
-- and every change an admin makes is written to admin_actions, which is
-- append-only.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

drop policy if exists platform_admins_own_read on public.platform_admins;
create policy platform_admins_own_read on public.platform_admins
  for select to authenticated using (user_id = auth.uid());

comment on table public.platform_admins is
  'Service owners. Provisioned with the service role only (tools/grant-admin.mjs); there is no client write path.';

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_actions enable row level security;
-- No policies: written and read only through the functions below.

create or replace function public.prevent_admin_action_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'admin_actions is append-only';
end;
$$;

drop trigger if exists admin_actions_append_only on public.admin_actions;
create trigger admin_actions_append_only
  before update or delete on public.admin_actions
  for each row execute function public.prevent_admin_action_change();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.require_platform_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin access required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.require_platform_admin() from public;

-- The current state of every report: its newest custodian action, or open.
create or replace view public.report_current_status
with (security_invoker = true)
as
select
  report.id,
  report.site_id,
  report.recorded_at,
  coalesce(latest.target_status, 'open') as status,
  latest.created_at as status_at
from public.condition_reports report
left join lateral (
  select action.target_status, action.created_at
  from public.condition_report_actions action
  where action.report_id = report.id
  order by action.created_at desc, action.id desc
  limit 1
) latest on true;

revoke all on public.report_current_status from public, anon, authenticated;

-- ── Overview ────────────────────────────────────────────────────────────────

create or replace function public.admin_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
begin
  perform public.require_platform_admin();
  return jsonb_build_object(
    'generated_at', now(),
    'since', v_since,
    'observations', jsonb_build_object(
      'total', (select count(*) from public.observations),
      'recent', (select count(*) from public.observations where received_at >= v_since),
      'contributors_recent', (select count(distinct user_id) from public.observations where received_at >= v_since)
    ),
    'reports', jsonb_build_object(
      'open', (select count(*) from public.report_current_status where status = 'open'),
      'acknowledged', (select count(*) from public.report_current_status where status = 'acknowledged'),
      'in_progress', (select count(*) from public.report_current_status where status = 'in_progress'),
      'resolved', (select count(*) from public.report_current_status where status = 'resolved'),
      'recent', (select count(*) from public.condition_reports where received_at >= v_since),
      -- Filed more than a week ago and nobody has acted at all.
      'unanswered_week', (
        select count(*) from public.report_current_status
        where status = 'open' and status_at is null and recorded_at < now() - interval '7 days'
      )
    ),
    'sites', coalesce((
      select jsonb_agg(row_to_json(site_row) order by site_row.open desc, site_row.name_en)
      from (
        select
          site.id,
          site.name_en,
          site.active,
          (select count(*) from public.report_current_status s where s.site_id = site.id) as reports,
          (select count(*) from public.report_current_status s where s.site_id = site.id and s.status <> 'resolved') as open,
          (select min(s.recorded_at) from public.report_current_status s where s.site_id = site.id and s.status <> 'resolved') as oldest_open_at,
          (select count(*) from public.custodian_memberships m where m.site_id = site.id and m.active) as custodians
        from public.monitored_sites site
      ) site_row
    ), '[]'::jsonb),
    'custodians_active', (select count(distinct user_id) from public.custodian_memberships where active),
    'crashes', jsonb_build_object(
      'recent', (select count(*) from public.crash_reports where received_at >= v_since),
      'fatal_recent', (select count(*) from public.crash_reports where received_at >= v_since and fatal)
    ),
    'plans', jsonb_build_object(
      'codes_issued', (select count(*) from public.activation_codes),
      'codes_live', (
        select count(*) from public.activation_codes
        where not revoked and (valid_until is null or valid_until > now()) and redemption_count < max_redemptions
      ),
      'redemptions', (select count(*) from public.code_redemptions),
      'pro_active', (select count(*) from public.plan_entitlements where expires_at > now())
    )
  );
end;
$$;

-- ── Custodians ──────────────────────────────────────────────────────────────

create or replace function public.admin_list_custodians()
returns table (user_id uuid, email text, site_id text, site_name text, role text, active boolean, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select m.user_id, u.email::text, m.site_id, s.name_en, m.role, m.active, m.created_at
    from public.custodian_memberships m
    join auth.users u on u.id = m.user_id
    join public.monitored_sites s on s.id = m.site_id
    order by m.active desc, s.name_en, u.email;
end;
$$;

-- Grants or changes a person's access to one site. The person must already
-- have an account; access is turned off with p_active = false, never deleted.
create or replace function public.admin_set_custodian(p_email text, p_site_id text, p_role text default 'custodian', p_active boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_role text := coalesce(p_role, 'custodian');
begin
  perform public.require_platform_admin();
  if v_role not in ('custodian', 'manager') then
    raise exception 'Role must be custodian or manager' using errcode = '22023';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(coalesce(p_email, ''))) limit 1;
  if v_user is null then
    return jsonb_build_object('status', 'no_account');
  end if;
  if not exists (select 1 from public.monitored_sites where id = p_site_id) then
    return jsonb_build_object('status', 'no_site');
  end if;

  insert into public.custodian_memberships (user_id, site_id, role, active)
  values (v_user, p_site_id, v_role, coalesce(p_active, true))
  on conflict (user_id, site_id) do update set role = excluded.role, active = excluded.active;

  insert into public.admin_actions (admin_id, action, detail)
  values (auth.uid(), 'set_custodian', jsonb_build_object('user_id', v_user, 'site_id', p_site_id, 'role', v_role, 'active', coalesce(p_active, true)));
  return jsonb_build_object('status', 'ok');
end;
$$;

-- ── Pro codes ───────────────────────────────────────────────────────────────

-- Codes are returned once, here, and only their hashes are stored, exactly as
-- tools/issue-codes.mjs does. Same alphabet: no 0/O or 1/I.
create or replace function public.admin_issue_codes(p_count integer, p_days integer default 30, p_valid_days integer default 180, p_note text default null)
returns setof text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_bytes bytea;
  i integer;
  j integer;
begin
  perform public.require_platform_admin();
  if p_count is null or p_count < 1 or p_count > 200 then
    raise exception 'Issue between 1 and 200 codes at a time' using errcode = '22023';
  end if;
  if p_days is null or p_days < 1 or p_days > 366 or p_valid_days is null or p_valid_days < 1 or p_valid_days > 730 then
    raise exception 'Days must be 1-366 and validity 1-730' using errcode = '22023';
  end if;

  for i in 1..p_count loop
    v_bytes := extensions.gen_random_bytes(12);
    v_code := '';
    for j in 0..11 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, j) % 32) + 1, 1);
    end loop;
    v_code := 'SAKSI' || v_code;
    insert into public.activation_codes (code_hash, duration_days, valid_until, note)
    values (encode(extensions.digest(v_code, 'sha256'), 'hex'), p_days, now() + make_interval(days => p_valid_days), nullif(trim(coalesce(p_note, '')), ''));
    return next 'SAKSI-' || substr(v_code, 6, 4) || '-' || substr(v_code, 10, 4) || '-' || substr(v_code, 14, 4);
  end loop;

  insert into public.admin_actions (admin_id, action, detail)
  values (auth.uid(), 'issue_codes', jsonb_build_object('count', p_count, 'days', p_days, 'valid_days', p_valid_days, 'note', p_note));
end;
$$;

create or replace function public.admin_code_batches()
returns table (note text, issued_on date, duration_days integer, issued bigint, redeemed bigint, revoked bigint, valid_until date)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select c.note, c.created_at::date, c.duration_days, count(*), sum(c.redemption_count)::bigint, count(*) filter (where c.revoked), max(c.valid_until)::date
    from public.activation_codes c
    group by c.note, c.created_at::date, c.duration_days
    order by c.created_at::date desc, c.note;
end;
$$;

-- Revokes the codes of one batch. Time already granted to
-- people who redeemed stays theirs; only further redemptions stop.
create or replace function public.admin_revoke_batch(p_note text, p_issued_on date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform public.require_platform_admin();
  update public.activation_codes
  set revoked = true
  where note is not distinct from p_note and created_at::date = p_issued_on and not revoked;
  get diagnostics v_count = row_count;
  insert into public.admin_actions (admin_id, action, detail)
  values (auth.uid(), 'revoke_batch', jsonb_build_object('note', p_note, 'issued_on', p_issued_on, 'count', v_count));
  return v_count;
end;
$$;

-- ── Crashes and the audit trail ─────────────────────────────────────────────

create or replace function public.admin_recent_crashes(p_limit integer default 50)
returns table (app_version text, platform text, message text, route text, fatal boolean, occurred_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  -- No user id and no stack: enough to triage, nothing that identifies a visitor.
  return query
    select c.app_version, c.platform, c.message, c.route, c.fatal, c.occurred_at
    from public.crash_reports c
    order by c.received_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

create or replace function public.admin_recent_actions(p_limit integer default 50)
returns table (admin_email text, action text, detail jsonb, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select u.email::text, a.action, a.detail, a.created_at
    from public.admin_actions a
    left join auth.users u on u.id = a.admin_id
    order by a.created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'admin_overview(integer)',
    'admin_list_custodians()',
    'admin_set_custodian(text, text, text, boolean)',
    'admin_issue_codes(integer, integer, integer, text)',
    'admin_code_batches()',
    'admin_revoke_batch(text, date)',
    'admin_recent_crashes(integer)',
    'admin_recent_actions(integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;
