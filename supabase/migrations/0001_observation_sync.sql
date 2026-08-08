-- Remote schema for observation sync.
--
-- The device is the record; this is the copy. services/database/index.ts holds
-- the SQLite migrations that matter for a phone with no signal, and everything
-- here exists only so an observation survives the loss of the phone.
--
-- Column names and types are taken from what services/supabase/sync.ts actually
-- sends, not from the local schema — the two differ deliberately. The device
-- stores `photo_uri`, a file path on that handset; the server stores
-- `photo_path`, a key into the storage bucket. Copying the device's column name
-- across would have recorded a path that means nothing anywhere else.

create table if not exists public.observations (
  id text primary key,
  vantage_id text not null,
  site_id text not null,
  captured_at timestamptz not null,
  -- Key into the `observations` storage bucket, not a device path.
  photo_path text not null,
  latitude double precision not null,
  longitude double precision not null,
  bearing double precision not null,
  pitch double precision not null,
  -- Kept as measurements rather than a quality grade. A later reader decides
  -- what error is acceptable for their question; the record should not decide
  -- it for them.
  position_error_m double precision not null,
  bearing_error_deg double precision not null,
  note text,
  -- 'unreviewed' is the truthful default: an observation nobody has assessed
  -- has not been assessed, and defaulting to 'no-change' would invent a finding.
  assessment text not null default 'unreviewed',
  received_at timestamptz not null default now()
);

create index if not exists idx_observations_site
  on public.observations (site_id, captured_at desc);
create index if not exists idx_observations_vantage
  on public.observations (vantage_id, captured_at desc);

create table if not exists public.condition_reports (
  id text primary key,
  observation_id text not null references public.observations (id) on delete cascade,
  site_id text not null,
  category text not null,
  subtype text not null,
  severity text not null,
  note text,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists idx_condition_reports_site
  on public.condition_reports (site_id, recorded_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
--
-- The app ships the publishable (anon) key, which is readable by anyone who
-- extracts the APK. RLS is therefore the only thing protecting this data, and
-- with no user accounts it is doing that job unaided.
--
-- Insert and update, no select. The app only ever writes: nothing in it reads
-- the remote tables back. So a leaked key can add to the record but cannot
-- harvest it, which is the asymmetry worth having — the observations are the
-- product.
--
-- Update is granted because sync.ts uses upsert(). A retry after a partial
-- failure — row written, local `synced` flag not set — arrives as an insert
-- with on-conflict-update, and would be refused by an insert-only policy,
-- leaving that observation retrying forever. The cost is that a leaked key can
-- overwrite an existing row. The fix for that is Supabase Auth and a policy
-- scoped to the author, not a tighter policy here.

alter table public.observations enable row level security;
alter table public.condition_reports enable row level security;

drop policy if exists observations_anon_insert on public.observations;
create policy observations_anon_insert
  on public.observations for insert to anon
  with check (true);

drop policy if exists observations_anon_update on public.observations;
create policy observations_anon_update
  on public.observations for update to anon
  using (true) with check (true);

drop policy if exists condition_reports_anon_insert on public.condition_reports;
create policy condition_reports_anon_insert
  on public.condition_reports for insert to anon
  with check (true);

drop policy if exists condition_reports_anon_update on public.condition_reports;
create policy condition_reports_anon_update
  on public.condition_reports for update to anon
  using (true) with check (true);

-- ── Photo storage ───────────────────────────────────────────────────────────
--
-- Private bucket. sync.ts uploads to `observations/<site_id>/<id>.<ext>` before
-- inserting the row, so a row always points at a file that exists — and a
-- failed upload throws before anything is written, rather than leaving a
-- record referring to nothing.

insert into storage.buckets (id, name, public)
values ('observations', 'observations', false)
on conflict (id) do nothing;

drop policy if exists observations_bucket_anon_insert on storage.objects;
create policy observations_bucket_anon_insert
  on storage.objects for insert to anon
  with check (bucket_id = 'observations');

-- upsert:true on the upload, for the same retry reason as the tables above.
drop policy if exists observations_bucket_anon_update on storage.objects;
create policy observations_bucket_anon_update
  on storage.objects for update to anon
  using (bucket_id = 'observations')
  with check (bucket_id = 'observations');
