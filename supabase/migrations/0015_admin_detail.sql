-- The detail behind the admin console's sections: every report across all
-- sites with its full action history, weekly activity, account counts, and
-- crashes grouped by message. Read-only, admin-only, like 0014: each function
-- calls require_platform_admin() first and nothing here writes.

-- ── Overview, extended ──────────────────────────────────────────────────────
-- Adds accounts, admins and per-site photo counts to 0014's overview.
create or replace function public.admin_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
  v_prev timestamptz := now() - 2 * make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
begin
  perform public.require_platform_admin();
  return jsonb_build_object(
    'generated_at', now(),
    'since', v_since,
    'observations', jsonb_build_object(
      'total', (select count(*) from public.observations),
      'recent', (select count(*) from public.observations where received_at >= v_since),
      'previous', (select count(*) from public.observations where received_at >= v_prev and received_at < v_since),
      'contributors_recent', (select count(distinct user_id) from public.observations where received_at >= v_since)
    ),
    'reports', jsonb_build_object(
      'open', (select count(*) from public.report_current_status where status = 'open'),
      'acknowledged', (select count(*) from public.report_current_status where status = 'acknowledged'),
      'in_progress', (select count(*) from public.report_current_status where status = 'in_progress'),
      'resolved', (select count(*) from public.report_current_status where status = 'resolved'),
      'recent', (select count(*) from public.condition_reports where received_at >= v_since),
      'previous', (select count(*) from public.condition_reports where received_at >= v_prev and received_at < v_since),
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
          site.region_id,
          site.active,
          (select count(*) from public.report_current_status s where s.site_id = site.id) as reports,
          (select count(*) from public.report_current_status s where s.site_id = site.id and s.status <> 'resolved') as open,
          (select min(s.recorded_at) from public.report_current_status s where s.site_id = site.id and s.status <> 'resolved') as oldest_open_at,
          (select count(*) from public.custodian_memberships m where m.site_id = site.id and m.active) as custodians,
          (select count(*) from public.observations o where o.site_id = site.id) as photos,
          (select max(o.received_at) from public.observations o where o.site_id = site.id) as last_photo_at,
          (select count(*) from public.monitored_vantages v where v.site_id = site.id and v.active) as vantages
        from public.monitored_sites site
      ) site_row
    ), '[]'::jsonb),
    'custodians_active', (select count(distinct user_id) from public.custodian_memberships where active),
    'accounts', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'anonymous', (select count(*) from auth.users where is_anonymous),
      'with_email', (select count(*) from auth.users where not is_anonymous and email is not null),
      'new_recent', (select count(*) from auth.users where created_at >= v_since),
      'admins', (select count(*) from public.platform_admins)
    ),
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

-- ── Reports across every site ───────────────────────────────────────────────
-- One page of reports, newest first, with each report's full action trail.
-- The reporter's own note is included (custodians see it too); who filed the
-- report is not.
create or replace function public.admin_list_reports(
  p_status text default null,
  p_site_id text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id text,
  site_id text,
  site_name text,
  category text,
  subtype text,
  severity text,
  note text,
  recorded_at timestamptz,
  status text,
  status_at timestamptz,
  actions jsonb,
  total bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    with filtered as (
      select s.id, s.site_id, s.recorded_at, s.status, s.status_at
      from public.report_current_status s
      where (p_status is null or s.status = p_status)
        and (p_site_id is null or s.site_id = p_site_id)
    )
    select
      r.id,
      r.site_id,
      coalesce(site.name_en, r.site_id),
      r.category,
      r.subtype,
      r.severity,
      r.note,
      r.recorded_at,
      f.status,
      f.status_at,
      coalesce((
        select jsonb_agg(jsonb_build_object('status', a.target_status, 'note', a.note, 'at', a.created_at) order by a.created_at, a.id)
        from public.condition_report_actions a
        where a.report_id = r.id
      ), '[]'::jsonb),
      (select count(*) from filtered)
    from filtered f
    join public.condition_reports r on r.id = f.id
    left join public.monitored_sites site on site.id = r.site_id
    order by r.recorded_at desc, r.id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

-- ── Weekly activity ─────────────────────────────────────────────────────────
-- Every week in the window appears, with 0 where nothing happened that week:
-- a count of zero events is a measurement, not a missing value.
create or replace function public.admin_weekly_activity(p_weeks integer default 12)
returns table (week date, photos bigint, reports bigint, resolved bigint, accounts bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_weeks integer := greatest(4, least(coalesce(p_weeks, 12), 52));
begin
  perform public.require_platform_admin();
  return query
    with weeks as (
      select generate_series(
        date_trunc('week', now()) - make_interval(weeks => v_weeks - 1),
        date_trunc('week', now()),
        interval '1 week'
      ) as start
    )
    select
      w.start::date,
      (select count(*) from public.observations o where o.received_at >= w.start and o.received_at < w.start + interval '1 week'),
      (select count(*) from public.condition_reports r where r.received_at >= w.start and r.received_at < w.start + interval '1 week'),
      (select count(*) from public.condition_report_actions a where a.target_status = 'resolved' and a.created_at >= w.start and a.created_at < w.start + interval '1 week'),
      (select count(*) from auth.users u where u.created_at >= w.start and u.created_at < w.start + interval '1 week')
    from weeks w
    order by w.start;
end;
$$;

-- ── Crashes, grouped ────────────────────────────────────────────────────────
create or replace function public.admin_crash_groups(p_days integer default 30)
returns table (message text, occurrences bigint, fatal bigint, first_seen timestamptz, last_seen timestamptz, versions text[], platforms text[], routes text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select
      c.message,
      count(*),
      count(*) filter (where c.fatal),
      min(c.occurred_at),
      max(c.occurred_at),
      array_agg(distinct c.app_version order by c.app_version),
      array_agg(distinct c.platform order by c.platform),
      array_remove(array_agg(distinct c.route), null)
    from public.crash_reports c
    where c.received_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
    group by c.message
    order by max(c.occurred_at) desc
    limit 100;
end;
$$;

-- ── Admins ──────────────────────────────────────────────────────────────────
create or replace function public.admin_list_admins()
returns table (email text, note text, since timestamptz, last_sign_in_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select u.email::text, a.note, a.created_at, u.last_sign_in_at
    from public.platform_admins a
    join auth.users u on u.id = a.user_id
    order by a.created_at;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'admin_overview(integer)',
    'admin_list_reports(text, text, integer, integer)',
    'admin_weekly_activity(integer)',
    'admin_crash_groups(integer)',
    'admin_list_admins()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;
