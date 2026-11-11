begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a@plans.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'b@plans.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'c@plans.test', '', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'd@plans.test', '', now(), now(), '', '', '', '');

insert into public.activation_codes (code_hash, duration_days, max_redemptions)
values (encode(extensions.digest('SAKSITEST0001', 'sha256'), 'hex'), 30, 2);

create or replace function pg_temp.as_user(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

select pg_temp.as_user('40000000-0000-0000-0000-000000000001');
select is(public.redeem_activation_code('saksi-test 0001')->>'status', 'ok', 'a typed code redeems, ignoring case and separators');
select ok((select expires_at > now() + interval '29 days' from public.plan_entitlements), 'the code grants 30 days');
select is((select count(*)::int from public.activation_codes), 0, 'clients cannot read codes');
select is(public.redeem_activation_code('SAKSITEST0001')->>'status', 'ok', 'redeeming your own code again changes nothing');

select pg_temp.as_user('40000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.plan_entitlements), 0, 'one user cannot see another entitlement');
select is(public.redeem_activation_code('SAKSITEST0001')->>'status', 'ok', 'a reinstall can redeem the same code');

select pg_temp.as_user('40000000-0000-0000-0000-000000000003');
select is(public.redeem_activation_code('SAKSITEST0001')->>'status', 'used', 'the redemption limit holds');

select pg_temp.as_user('40000000-0000-0000-0000-000000000004');
select is(public.redeem_activation_code('WRONG')->>'status', 'invalid', 'a wrong code is refused');
select is(public.redeem_activation_code('')->>'status', 'invalid', 'an empty code is refused');
select throws_ok(
  $$insert into public.plan_entitlements (user_id, expires_at) values ('40000000-0000-0000-0000-000000000004', now() + interval '1 year')$$,
  '42501', null, 'clients cannot grant themselves Pro'
);
select public.redeem_activation_code('WRONG') from generate_series(1, 6);
select is(public.redeem_activation_code('SAKSITEST0001')->>'status', 'rate_limited', 'repeated guesses are stopped, even for a real code');

reset role;
select is(
  (select expires_at from public.plan_entitlements where user_id = '40000000-0000-0000-0000-000000000002'),
  (select expires_at from public.plan_entitlements where user_id = '40000000-0000-0000-0000-000000000001'),
  'a reinstall gets back the same end date, not a fresh 30 days'
);

select * from finish();
rollback;
