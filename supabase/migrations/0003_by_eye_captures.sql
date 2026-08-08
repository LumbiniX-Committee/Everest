-- Let a by-eye capture reach the server, and make the schema enforce the
-- distinction it was already trying to record.
--
-- 0001 declared position_error_m and bearing_error_deg NOT NULL, taken from
-- what sync.ts appeared to send. It was wrong about what sync.ts sends.
--
-- services/database/index.ts, toObservation():
--
--     positionErrorM: row.gate_mode === 'manual' ? null : row.position_error_m,
--
-- A manual capture reports its errors as null on purpose — "a by-eye capture
-- makes no claim of measured accuracy", and null is how the app says unknown
-- rather than zero. So every manually framed observation was posted with two
-- nulls into two NOT NULL columns and rejected 23502, permanently.
--
-- The damage was not confined to those rows. syncData() re-threw inside its
-- loop, so the first by-eye observation aborted the pass before the remaining
-- observations and every condition report behind it — one unsyncable row was
-- enough to strand the whole queue. sync.ts is fixed alongside this to isolate
-- a failing record; the constraint change alone would only have narrowed the
-- blockage rather than removed it.
--
-- Dropping NOT NULL is not a loosening. It restores the meaning the columns
-- have on the device, where an unmeasured error is absent rather than zero.
-- Keeping the constraint would have forced a choice between rejecting the
-- observation and writing a zero that reads as a perfect measurement, and the
-- second is the worse outcome: it is not a lost record, it is a false one.

alter table public.observations
  alter column position_error_m drop not null,
  alter column bearing_error_deg drop not null;

comment on column public.observations.position_error_m is
  'Metres between observer and vantage at capture. Null means not measured — a by-eye capture, never zero error.';

comment on column public.observations.bearing_error_deg is
  'Degrees between recorded and target bearing. Null means not measured, never zero error.';

-- The invariant behind gate_mode, stated where it cannot be forgotten: a row
-- claiming the tolerance gate passed must carry the measurements that claim
-- rests on. 'manual' and null gate modes are unconstrained — they assert
-- nothing about accuracy, so they have nothing to substantiate.
--
-- `is distinct from` rather than `<>` so a null gate_mode satisfies the check
-- outright. Rows synced before 0002 have no gate mode and must stay valid;
-- they are not wrong, only unlabelled.
alter table public.observations
  drop constraint if exists observations_aligned_is_measured;

alter table public.observations
  add constraint observations_aligned_is_measured
  check (
    gate_mode is distinct from 'aligned'
    or (position_error_m is not null and bearing_error_deg is not null)
  );

comment on constraint observations_aligned_is_measured on public.observations is
  'gate_mode = aligned asserts the errors are measurements; this refuses the assertion without them.';
