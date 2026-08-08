-- Carry the capture-integrity columns through to the server.
--
-- The device records fifteen columns of an observation and sync.ts sends
-- twelve. The three left behind are the ones that say how much the other
-- numbers can be trusted.
--
-- gate_mode is the serious one. services/database/index.ts calls it "the source
-- of truth for honesty": 'aligned' means the tolerance gate passed and the
-- error columns are real measurements, 'manual' means the frame was matched by
-- eye and the reader should treat those errors as unknown. Sync was sending the
-- error columns and dropping the flag, so the remote record showed numbers that
-- read as measurements with no way to tell which ones were not.
--
-- That is worse than incomplete — it is misleading in a specific direction, and
-- a conservator comparing a series would have no way to know.
--
-- Nullable throughout, with no default. Rows written before this migration were
-- synced without these values and genuinely do not have them; a default would
-- assert a gate mode nobody recorded, which is the same fabrication in a
-- smaller font.
--
-- Adding the columns is half the fix. services/supabase/sync.ts must also send
-- them, or this migration only widens a table that stays empty.

alter table public.observations
  add column if not exists gate_mode text,
  add column if not exists align_score double precision,
  add column if not exists gps_acc_m double precision;

comment on column public.observations.gate_mode is
  'aligned = tolerance gate passed, error columns are measurements; manual = framed by eye, errors are not a claim of accuracy; null = predates capture-integrity recording.';

comment on column public.observations.align_score is
  'Weighted alignment score at capture. Meaningful only where gate_mode = ''aligned''.';

comment on column public.observations.gps_acc_m is
  'GPS accuracy in metres reported at capture. position_error_m cannot be interpreted without it.';

-- Lets a reader select only the observations whose error figures are claims.
create index if not exists idx_observations_gate_mode
  on public.observations (gate_mode)
  where gate_mode is not null;
