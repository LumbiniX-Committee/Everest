-- Crash reports, sent only when the visitor has turned "Share crash reports" on.
-- Insert-only for clients: nobody can read reports back through the API, and a
-- report carries no location, photo, name or record content.
create table if not exists public.crash_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  app_version text not null check (char_length(app_version) <= 32),
  platform text not null check (platform in ('ios', 'android', 'web')),
  message text not null check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  route text check (char_length(route) <= 200),
  fatal boolean not null default false,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

alter table public.crash_reports enable row level security;

drop policy if exists "send own crash report" on public.crash_reports;
create policy "send own crash report" on public.crash_reports
  for insert to authenticated with check (user_id = auth.uid());
