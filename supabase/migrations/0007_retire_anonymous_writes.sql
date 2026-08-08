-- Retire the unauthenticated write path.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ NOT YET APPLIED. This is the second half of 0006 and applying it early    │
-- │ stops every device syncing. Read the preconditions before running it.     │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- 0006 gave every record an author and added policies scoped to auth.uid(),
-- but left the `anon` policies from 0001 and 0005 in place so nothing broke
-- while clients were still catching up. This removes them, which is the point
-- of the exercise: while `anon` can update, a leaked publishable key — and the
-- key ships inside the APK, so treat it as leaked — can overwrite any row in
-- the archive. Author-scoped policies only bind once the unscoped ones are gone.
--
-- ── Preconditions, both required ────────────────────────────────────────────
--
-- 1. **Anonymous sign-ins are enabled** for the project: Authentication →
--    Sign In / Providers → Anonymous sign-ins. Until then the app cannot get a
--    session at all, `ensureSession()` returns null by design, and every write
--    arrives as `anon`. Applying this first makes the app fail to sync with no
--    way for it to recover.
--
-- 2. **Clients have updated.** Updates reach devices over the air and not all
--    at once; a phone running an older bundle has no auth code and writes as
--    anon. Removing the fallback strands it — and it is holding photographs
--    that cannot be retaken.
--
-- ── Readiness check ─────────────────────────────────────────────────────────
--
-- Run this first. It answers "is anything still arriving unauthenticated?"
--
--   select
--     count(*) filter (where user_id is null) as unauthenticated,
--     count(*) filter (where user_id is not null) as authored,
--     max(received_at) filter (where user_id is null) as last_anon_write
--   from public.observations
--   where received_at > now() - interval '7 days';
--
-- `unauthenticated` should be 0, and `last_anon_write` should predate the point
-- at which the update went out. A non-zero count means devices are still
-- writing as anon and this migration would cut them off.
--
-- Rows written before 0006 keep user_id null forever and are not a signal —
-- that is why the query is windowed to the last seven days.
--
-- ── What this does not do ───────────────────────────────────────────────────
--
-- It does not delete or reassign the unauthored rows. They are evidence, and
-- their author is genuinely unknown; inventing one would fabricate exactly the
-- provenance auth exists to establish. They simply become read-only to
-- everyone but the service role, which is the correct end state for a record
-- nobody can prove they wrote.

drop policy if exists observations_anon_insert on public.observations;
drop policy if exists observations_anon_update on public.observations;

drop policy if exists condition_reports_anon_insert on public.condition_reports;
drop policy if exists condition_reports_anon_update on public.condition_reports;

drop policy if exists quest_submissions_anon_insert on public.quest_submissions;
drop policy if exists quest_submissions_anon_update on public.quest_submissions;

-- Storage, same reasoning. The authenticated equivalents were added in 0006.
drop policy if exists observations_bucket_anon_insert on storage.objects;
drop policy if exists observations_bucket_anon_update on storage.objects;

drop policy if exists quest_evidence_anon_insert on storage.objects;
drop policy if exists quest_evidence_anon_update on storage.objects;

-- After this, `anon` holds no policy on any of the three tables or either
-- bucket: an unauthenticated client can neither read nor write. Every new row
-- carries an author the database verified rather than one the client asserted.
