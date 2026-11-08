begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'reporter@timeline.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'other@timeline.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'custodian@timeline.test', '', now(), now(), '', '', '', '');

insert into public.monitored_sites (id, name_en, region_id) values ('timeline-site', 'Timeline site', 'test');
insert into public.monitored_vantages (id, site_id) values ('timeline-vantage', 'timeline-site');
insert into public.observations (id, vantage_id, site_id, captured_at, photo_path, user_id)
values ('timeline-observation', 'timeline-vantage', 'timeline-site', now(), 'timeline-site/timeline-observation.webp', '50000000-0000-0000-0000-000000000001');
insert into public.condition_reports (id, observation_id, site_id, category, subtype, severity, recorded_at, user_id)
values ('timeline-report', 'timeline-observation', 'timeline-site', 'surface', 'crack', 'medium', now(), '50000000-0000-0000-0000-000000000001');
insert into public.custodian_memberships (user_id, site_id) values ('50000000-0000-0000-0000-000000000003', 'timeline-site');

create or replace function pg_temp.as_user(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- Actions need a signed-in custodian of the site, as in production.
select pg_temp.as_user('50000000-0000-0000-0000-000000000003');
insert into public.condition_report_actions (report_id, target_status) values ('timeline-report', 'acknowledged');
insert into public.condition_report_actions (report_id, target_status, note) values ('timeline-report', 'in_progress', 'Mason booked');

select pg_temp.as_user('50000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.my_report_timeline()), 2, 'the reporter sees each step taken on their report');
select is((select array_agg(target_status order by target_status) from public.my_report_timeline()), array['acknowledged', 'in_progress'], 'with each step''s status');

select pg_temp.as_user('50000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.my_report_timeline()), 0, 'nobody else sees that timeline');
select is((select count(*)::int from public.condition_report_actions), 0, 'the action table itself stays custodian-only');

select * from finish();
rollback;
