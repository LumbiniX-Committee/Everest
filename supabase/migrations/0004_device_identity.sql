-- Group a series without pretending to identify a person.
--
-- Step 2 of docs/DATA-ARCHITECTURE.md §5. Every observation on the server is
-- currently anonymous in the strongest sense: there is no way to tell whether
-- two rows came from the same phone or a hundred different ones. "Has this
-- contributor recorded this vantage before?" is a question a conservator will
-- ask of a photographic series, and the schema could not answer it at all.
--
-- device_id answers that and nothing more. It is a random value generated on
-- first launch and kept in the app's own storage — see services/device.
--
-- What it is not, and must never be presented as:
--
--   * Not a person. One phone can be handed between people; one person can
--     carry two phones. It groups captures, it does not attribute them.
--   * Not authentication. It arrives as an ordinary column on an insert, from a
--     client holding the publishable key, so anyone can send any value. RLS
--     cannot be scoped to it, and a policy written as though it could would be
--     security theatre. Author-scoped policies need Supabase Auth (step 4).
--   * Not stable across a reinstall. Clearing the app's storage yields a new
--     id, so a gap in a series may be a new device or the same one starting
--     over. The column cannot distinguish those, and no query should imply it.
--
-- Nullable, with no default. Rows synced before this have no device recorded,
-- and inventing one would fabricate exactly the provenance the column exists to
-- make honest. A null means unknown, not "some other device".

alter table public.observations
  add column if not exists device_id text;

alter table public.condition_reports
  add column if not exists device_id text;

comment on column public.observations.device_id is
  'Opaque per-install id grouping captures from one device. Not a person, not authenticated, not stable across reinstall. Null = unknown.';

comment on column public.condition_reports.device_id is
  'Opaque per-install id, matching observations.device_id. Not a person, not authenticated. Null = unknown.';

-- Ordered by capture time: the query this exists for is "what else did this
-- device record, and when", which is a series read rather than a point lookup.
create index if not exists idx_observations_device
  on public.observations (device_id, captured_at desc)
  where device_id is not null;

create index if not exists idx_condition_reports_device
  on public.condition_reports (device_id, recorded_at desc)
  where device_id is not null;
