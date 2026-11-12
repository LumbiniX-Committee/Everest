begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@admin.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'visitor@admin.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'Keeper@Admin.test', '', now(), now(), '', '', '', '');

insert into public.platform_admins (user_id) values ('60000000-0000-0000-0000-000000000001');
insert into public.monitored_sites (id, name_en, region_id) values ('admin-site', 'Admin site', 'test');
insert into public.monitored_vantages (id, site_id) values ('admin-vantage', 'admin-site');
insert into public.observations (id, vantage_id, site_id, captured_at, photo_path, user_id)
values ('admin-observation', 'admin-vantage', 'admin-site', now(), 'admin-site/admin-observation.webp', '60000000-0000-0000-0000-000000000002');
insert into public.condition_reports (id, observation_id, site_id, category, subtype, severity, recorded_at, user_id)
values ('admin-report', 'admin-observation', 'admin-site', 'surface', 'crack', 'medium', now() - interval '10 days', '60000000-0000-0000-0000-000000000002');

create or replace function pg_temp.as_user(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- A visitor is refused by every admin function.
select pg_temp.as_user('60000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_overview(30) $$, '42501', 'Platform admin access required', 'a visitor cannot read the overview');
select throws_ok($$ select public.admin_set_custodian('visitor@admin.test', 'admin-site') $$, '42501', 'Platform admin access required', 'a visitor cannot grant site access');

-- The owner sees the whole service.
select pg_temp.as_user('60000000-0000-0000-0000-000000000001');
select is((public.admin_overview(30) -> 'reports' ->> 'open')::int, 1, 'the open report is counted');
select is((public.admin_overview(30) -> 'reports' ->> 'unanswered_week')::int, 1, 'a report nobody answered for a week is flagged');

select is(public.admin_set_custodian('nobody@admin.test', 'admin-site') ->> 'status', 'no_account', 'an email with no account is reported, not invented');
select is(public.admin_set_custodian('keeper@admin.test', 'admin-site') ->> 'status', 'ok', 'site access is granted by email, ignoring case');
select is(public.admin_set_custodian('keeper@admin.test', 'admin-site', 'custodian', false) ->> 'status', 'ok', 'access is turned off rather than deleted');
select is((select count(*)::int from public.admin_list_custodians() where active = false), 1, 'the deactivated membership is still listed');

-- Codes issued here redeem through the existing function: the hashes agree.
create temporary table issued on commit drop as select public.admin_issue_codes(2, 30, 180, 'admin test') as code;
select pg_temp.as_user('60000000-0000-0000-0000-000000000002');
select is(public.redeem_activation_code((select code from issued limit 1)) ->> 'status', 'ok', 'an issued code redeems');

select pg_temp.as_user('60000000-0000-0000-0000-000000000001');
select is(public.admin_revoke_batch('admin test', current_date), 2, 'a batch is revoked as a whole');

reset role;
select throws_ok($$ delete from public.admin_actions $$, 'P0001', 'admin_actions is append-only', 'the audit trail cannot be deleted');

select * from finish();
rollback;
