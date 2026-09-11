begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('public', 'custodian_memberships', 'custodian memberships exist');
select has_table('public', 'condition_report_actions', 'append-only actions exist');
select has_table('public', 'vantage_priority_actions', 'append-only vantage priority actions exist');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.condition_report_actions'::regclass),
  'report actions have RLS enabled'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'visitor-a@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'visitor-b@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'custodian-a@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'custodian-b@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'empty-visitor@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.monitored_sites (id, name_en, region_id)
values ('test-site-a', 'Test site A', 'test'), ('test-site-b', 'Test site B', 'test');
insert into public.monitored_vantages (id, site_id)
values ('test-vantage-a', 'test-site-a'), ('test-vantage-b', 'test-site-b');
insert into public.custodian_memberships (user_id, site_id)
values
  ('20000000-0000-0000-0000-000000000001', 'test-site-a'),
  ('20000000-0000-0000-0000-000000000002', 'test-site-b');

insert into public.observations (
  id, vantage_id, site_id, captured_at, photo_path, latitude, longitude,
  bearing, pitch, position_error_m, bearing_error_deg, user_id
)
values
  ('test-observation-a', 'test-vantage-a', 'test-site-a', now() - interval '2 days', 'test-site-a/test-observation-a.webp', 27.1, 85.1, 0, 0, 1, 1, '10000000-0000-0000-0000-000000000001'),
  ('test-observation-b', 'test-vantage-b', 'test-site-b', now() - interval '2 days', 'test-site-b/test-observation-b.webp', 27.2, 85.2, 0, 0, 1, 1, '10000000-0000-0000-0000-000000000002');
insert into public.condition_reports (
  id, observation_id, site_id, category, subtype, severity, note, recorded_at, user_id
)
values
  ('test-report-a', 'test-observation-a', 'test-site-a', 'surface', 'crack', 'medium', 'private visitor note', now() - interval '2 days', '10000000-0000-0000-0000-000000000001'),
  ('test-report-b', 'test-observation-b', 'test-site-b', 'water', 'flow', 'low', 'private visitor note', now() - interval '2 days', '10000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq(
  $$select id from public.observations order by id$$,
  $$values ('test-observation-a'::text)$$,
  'custodian reads observations only for an assigned site'
);
select results_eq(
  $$select id from public.condition_reports order by id$$,
  $$values ('test-report-a'::text)$$,
  'custodian reads reports only for an assigned site'
);
select throws_ok(
  $$insert into public.condition_report_actions (report_id, target_status) values ('test-report-b', 'acknowledged')$$,
  '42501',
  'new row violates row-level security policy for table "condition_report_actions"',
  'custodian cannot act on another site'
);
select lives_ok(
  $$insert into public.condition_report_actions (report_id, target_status) values ('test-report-a', 'acknowledged')$$,
  'custodian can acknowledge an assigned report'
);
select lives_ok(
  $$insert into public.condition_report_actions (report_id, target_status, note) values ('test-report-a', 'in_progress', 'inspected')$$,
  'legal next action can be appended'
);
select throws_ok(
  $$insert into public.vantage_priority_actions (vantage_id, urgent) values ('test-vantage-b', true)$$,
  '42501',
  'new row violates row-level security policy for table "vantage_priority_actions"',
  'custodian cannot prioritize another site'
);
select lives_ok(
  $$insert into public.vantage_priority_actions (vantage_id, urgent) values ('test-vantage-a', true)$$,
  'custodian can append an urgent priority for an assigned vantage'
);
select ok(not has_table_privilege('authenticated', 'public.condition_report_actions', 'UPDATE'), 'actions cannot be updated');
select ok(not has_table_privilege('authenticated', 'public.condition_report_actions', 'DELETE'), 'actions cannot be deleted');
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'observations_bucket_auth_update'
  ),
  'observation photographs cannot be overwritten'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'quest_evidence_auth_update'
  ),
  'quest evidence photographs cannot be overwritten'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select results_eq(
  $$select count(*)::bigint from public.observations$$,
  $$values (0::bigint)$$,
  'a visitor cannot read the evidence archive'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$update public.observations set note = 'changed' where id = 'test-observation-a'$$,
  'P0001',
  'evidence rows are immutable; add a new record instead',
  'evidence cannot be silently overwritten'
);
select lives_ok(
  $$insert into public.observations (id, vantage_id, site_id, captured_at, photo_path, user_id) values ('test-observation-null', 'test-vantage-a', 'test-site-a', now(), 'test-site-a/test-observation-null.webp', auth.uid())$$,
  'unavailable measurements may remain null'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq(
  $$select count(*)::bigint from public.observations$$,
  $$values (0::bigint)$$,
  'anonymous users cannot read raw observations'
);
select is(
  jsonb_array_length(public.get_public_site_condition('test-site-a', 90)->'conditions'),
  1,
  'acknowledged site condition is public'
);
select is(
  jsonb_array_length(public.get_public_site_condition('test-site-b', 90)->'conditions'),
  0,
  'unacknowledged condition remains private'
);
select ok(
  public.get_public_site_condition('test-site-a', 90)::text !~ 'note|latitude|longitude|photo_path|user_id|actor_user_id|test-report-a',
  'public transparency omits private fields and raw report ids'
);
select is(
  jsonb_array_length(public.get_public_site_condition('test-site-a', 90)->'conditions'->0->'history'),
  2,
  'public status history contains dated actions without private notes'
);
select is(
  (select urgent from public.get_public_vantage_coverage(90) where vantage_id = 'test-vantage-a'),
  true,
  'append-only custodian urgency reaches the public coverage ranking'
);

select * from finish();
rollback;
