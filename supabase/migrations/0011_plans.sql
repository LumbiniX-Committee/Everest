-- Pro access through activation codes. No payment happens in the app.
--
-- Only a hash of each code is stored, so reading this table doesn't reveal any
-- code. Codes are created by tools/issue-codes.mjs with the service role.
--
-- Installs sign in anonymously, so reinstalling means a new user. A code may
-- therefore be redeemed a limited number of times, and a repeat redemption never
-- extends the time it first granted.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.activation_codes (
  code_hash text primary key,
  duration_days integer not null default 30 check (duration_days > 0),
  max_redemptions integer not null default 2 check (max_redemptions > 0),
  redemption_count integer not null default 0,
  entitled_until timestamptz,
  valid_until timestamptz,
  revoked boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.code_redemptions (
  code_hash text not null references public.activation_codes (code_hash) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code_hash, user_id)
);

create table if not exists public.code_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists idx_code_attempts_user on public.code_attempts (user_id, attempted_at desc);

alter table public.activation_codes enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.code_redemptions enable row level security;
alter table public.code_attempts enable row level security;

-- Codes, redemptions and attempts have no client policies, so clients can't read them.
drop policy if exists "read own entitlement" on public.plan_entitlements;
create policy "read own entitlement" on public.plan_entitlements
  for select to authenticated using (user_id = auth.uid());

create or replace function public.redeem_activation_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_code public.activation_codes%rowtype;
  v_current timestamptz;
  v_until timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('status', 'not_signed_in');
  end if;

  -- Limits guessing. Only failed attempts are recorded, so honest use is unaffected.
  if (select count(*) from public.code_attempts
      where user_id = v_user and attempted_at > now() - interval '1 hour') >= 8 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  v_hash := encode(
    extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'),
    'hex'
  );

  select * into v_code from public.activation_codes where code_hash = v_hash for update;

  if not found or v_code.revoked then
    insert into public.code_attempts (user_id) values (v_user);
    return jsonb_build_object('status', 'invalid');
  end if;

  -- Redeeming your own code again changes nothing.
  if exists (select 1 from public.code_redemptions where code_hash = v_hash and user_id = v_user) then
    return jsonb_build_object('status', 'ok', 'expires_at',
      (select expires_at from public.plan_entitlements where user_id = v_user));
  end if;

  if v_code.valid_until is not null and v_code.valid_until < now() then
    return jsonb_build_object('status', 'expired');
  end if;

  if v_code.redemption_count >= v_code.max_redemptions then
    return jsonb_build_object('status', 'used');
  end if;

  select expires_at into v_current from public.plan_entitlements where user_id = v_user;

  if v_code.entitled_until is null then
    -- First use starts the clock, after any time this person still has.
    v_until := greatest(now(), coalesce(v_current, now())) + make_interval(days => v_code.duration_days);
    update public.activation_codes set entitled_until = v_until where code_hash = v_hash;
  else
    -- A reinstall gets back what the code first granted, and no more.
    v_until := greatest(v_code.entitled_until, coalesce(v_current, v_code.entitled_until));
  end if;

  update public.activation_codes set redemption_count = redemption_count + 1 where code_hash = v_hash;
  insert into public.code_redemptions (code_hash, user_id) values (v_hash, v_user);
  insert into public.plan_entitlements (user_id, expires_at) values (v_user, v_until)
    on conflict (user_id) do update set expires_at = excluded.expires_at, updated_at = now();

  return jsonb_build_object('status', 'ok', 'expires_at', v_until);
end;
$$;

revoke all on function public.redeem_activation_code(text) from public, anon;
grant execute on function public.redeem_activation_code(text) to authenticated;
