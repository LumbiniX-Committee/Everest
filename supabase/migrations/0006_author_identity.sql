-- Give a record an author, and let RLS ask who wrote it.
--
-- Step 6 of docs/DATA-ARCHITECTURE.md §5, and the fix for the weakness 0001
-- named in its own comments: with no user, a policy can only be scoped to a
-- role, so `anon` was granted update on every row and a leaked publishable key
-- could overwrite anyone's observation. device_id (0004) did not help — it is a
-- column a client sends, so a policy resting on it would be theatre.
--
-- auth.uid() is different in kind. It is read from a signed JWT the client
-- cannot forge, so `user_id = auth.uid()` is a claim the database can actually
-- check.
--
-- ── This migration does not switch anything off ──────────────────────────────
--
-- The `anon` policies from 0001 and 0005 stay. Two reasons, both about time:
--
--   1. Anonymous sign-in is a project setting, and until it is enabled the app
--      cannot obtain a session at all. Removing the anon path first would stop
--      every device syncing.
--   2. Updates reach devices over the air, not all at once. A client running
--      yesterday's bundle has no auth code and writes as anon; it must keep
--      working until it has updated.
--
-- 0007 retires the anon policies once both are true. Applying that before then
-- is the one way to break this.

-- Added without a default first, then given one. A single ADD COLUMN with a
-- volatile default would rewrite the table evaluating auth.uid() per row —
-- null in a migration, so harmless here, but the two-step says plainly that
-- existing rows are meant to stay unclaimed rather than accidentally staying so.
alter table public.observations
  add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.observations
  alter column user_id set default auth.uid();

alter table public.condition_reports
  add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.condition_reports
  alter column user_id set default auth.uid();

alter table public.quest_submissions
  add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.quest_submissions
  alter column user_id set default auth.uid();

-- ON DELETE SET NULL, never CASCADE. Deleting an account must not delete the
-- observations made through it: the photograph is a record of a place on a day,
-- and the person's relationship to it ending does not unmake the evidence. The
-- row loses its author and keeps its content, which is the truthful outcome —
-- and matches the rule that nothing in this database is deleted.
comment on column public.observations.user_id is
  'Author, from the JWT — set by DEFAULT auth.uid(), never sent by the client. Null = written before auth existed, or the account was deleted.';

comment on column public.condition_reports.user_id is
  'Author, from the JWT. Null = written before auth existed, or the account was deleted.';

comment on column public.quest_submissions.user_id is
  'Author, from the JWT. Null = written before auth existed, or the account was deleted.';

create index if not exists idx_observations_user
  on public.observations (user_id, captured_at desc)
  where user_id is not null;

-- ── Author-scoped policies ──────────────────────────────────────────────────
--
-- The client never sends user_id; the column default fills it from the token.
-- `with check (user_id = auth.uid())` then makes claiming someone else's
-- authorship a rejection rather than a convention.
--
-- Select is granted here where 0001 refused it, and the reasoning has changed
-- rather than been abandoned. 0001 withheld select because a leaked key would
-- otherwise harvest the whole archive. Scoped to auth.uid() there is nothing to
-- harvest: a stolen publishable key buys a fresh anonymous account that owns no
-- rows. What it buys instead is a person being able to see their own record.
--
-- A known edge, accepted rather than papered over: a row inserted as anon
-- before this, whose local `synced` flag never got set, will retry as an
-- authenticated user and be refused — its user_id is null and the update policy
-- requires a match. Widening `using` to `or user_id is null` would fix that by
-- letting any account adopt and overwrite any unclaimed row, which is the exact
-- power this migration exists to remove. The retry fails alone (sync isolates
-- failures per record since 0003) and the local row keeps the observation.

drop policy if exists observations_owner_insert on public.observations;
create policy observations_owner_insert
  on public.observations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists observations_owner_update on public.observations;
create policy observations_owner_update
  on public.observations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists observations_owner_select on public.observations;
create policy observations_owner_select
  on public.observations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists condition_reports_owner_insert on public.condition_reports;
create policy condition_reports_owner_insert
  on public.condition_reports for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists condition_reports_owner_update on public.condition_reports;
create policy condition_reports_owner_update
  on public.condition_reports for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists condition_reports_owner_select on public.condition_reports;
create policy condition_reports_owner_select
  on public.condition_reports for select to authenticated
  using (user_id = auth.uid());

drop policy if exists quest_submissions_owner_insert on public.quest_submissions;
create policy quest_submissions_owner_insert
  on public.quest_submissions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists quest_submissions_owner_update on public.quest_submissions;
create policy quest_submissions_owner_update
  on public.quest_submissions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists quest_submissions_owner_select on public.quest_submissions;
create policy quest_submissions_owner_select
  on public.quest_submissions for select to authenticated
  using (user_id = auth.uid());

-- ── Storage ─────────────────────────────────────────────────────────────────
--
-- Both buckets keep their anon policies until 0007, and gain the authenticated
-- equivalent now.
--
-- Object paths are not owner-scoped: an observation is stored at
-- `<site_id>/<id>.<ext>`, which was chosen so the archive reads by place rather
-- than by person. That means these policies grant an authenticated writer the
-- whole bucket, and a per-object owner check would need the path to carry the
-- user id. Left as it is deliberately — repathing would orphan every file
-- already recorded in a row — and noted so it is a decision rather than an
-- oversight. Read access is still granted to nobody.

drop policy if exists observations_bucket_auth_insert on storage.objects;
create policy observations_bucket_auth_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'observations');

drop policy if exists observations_bucket_auth_update on storage.objects;
create policy observations_bucket_auth_update
  on storage.objects for update to authenticated
  using (bucket_id = 'observations')
  with check (bucket_id = 'observations');

drop policy if exists quest_evidence_auth_insert on storage.objects;
create policy quest_evidence_auth_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'quest-evidence');

drop policy if exists quest_evidence_auth_update on storage.objects;
create policy quest_evidence_auth_update
  on storage.objects for update to authenticated
  using (bucket_id = 'quest-evidence')
  with check (bucket_id = 'quest-evidence');
