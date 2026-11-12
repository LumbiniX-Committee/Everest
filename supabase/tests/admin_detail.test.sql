begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@detail.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'visitor@detail.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'keeper@detail.test', '', now(), now(), '', '', '', '');

insert into public.platform_admins (user_id, note) values ('70000000-0000-0000-0000-000000000001', 'Owner');
insert into public.monitored_sites (id, name_en, region_id) values ('detail-site', 'Detail site', 'test');
insert into public.monitored_vantages (id, site_id) values ('detail-vantage', 'detail-site');
insert into public.observations (id, vantage_id, site_id, captured_at, photo_path, user_id)
values ('detail-observation', 'detail-vantage', 'detail-site', now(), 'detail-site/detail-observation.webp', '70000000-0000-0000-0000-000000000002');
insert into public.condition_reports (id, observation_id, site_id, category, subtype, severity, recorded_at, user_id)
values
  ('detail-report-a', 'detail-observation', 'detail-site', 'surface', 'crack', 'medium', now() - interval '2 days', '70000000-0000-0000-0000-000000000002'),
  ('detail-report-b', 'detail-observation', 'detail-site', 'surface', 'crack', 'low', now() - interval '1 day', '70000000-0000-0000-0000-000000000002');
insert into public.custodian_memberships (user_id, site_id) values ('70000000-0000-0000-0000-000000000003', 'detail-site');
insert into public.crash_reports (user_id, app_version, platform, message, fatal, occurred_at)
values
  ('70000000-0000-0000-0000-000000000002', '1.0.0', 'android', 'Boom', true, now()),
  ('70000000-0000-0000-0000-000000000002', '1.0.1', 'android', 'Boom', false, now());

create or replace function pg_temp.as_user(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

select pg_temp.as_user('70000000-0000-0000-0000-000000000003');
insert into public.condition_report_actions (report_id, target_status, note) values ('detail-report-a', 'acknowledged', 'Seen');

select pg_temp.as_user('70000000-0000-0000-0000-000000000002');
select throws_ok($$ select * from public.admin_list_reports() $$, '42501', 'Platform admin access required', 'a visitor cannot list every report');
select throws_ok($$ select * from public.admin_weekly_activity(12) $$, '42501', 'Platform admin access required', 'a visitor cannot read activity');

select pg_temp.as_user('70000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.admin_list_reports()), 2, 'both reports are listed');
select is((select total::int from public.admin_list_reports() limit 1), 2, 'the total counts the whole filtered set');
select is((select count(*)::int from public.admin_list_reports('acknowledged')), 1, 'reports filter by current status');
select is((select jsonb_array_length(actions) from public.admin_list_reports('acknowledged')), 1, 'each report carries its action trail');
select is((select count(*)::int from public.admin_weekly_activity(12)), 12, 'every week appears, even empty ones');
select is((select occurrences::int from public.admin_crash_groups(30) where message = 'Boom'), 2, 'crashes group by message');
select is((public.admin_overview(30) -> 'accounts' ->> 'admins')::int, 1, 'the overview counts admins');

select * from finish();
rollback;
