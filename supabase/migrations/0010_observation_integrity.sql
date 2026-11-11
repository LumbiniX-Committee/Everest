-- A compass nudge is part of how a photograph was framed, so it belongs in the
-- record. Null means the capture predates this column, not that no nudge was
-- applied. Demo-walk captures never reach this table: the app keeps them local.
alter table public.observations
  add column if not exists heading_nudge_deg double precision;

comment on column public.observations.heading_nudge_deg is
  'Degrees the observer manually corrected the compass by at capture. A nonzero value is always saved as gate_mode = manual.';
