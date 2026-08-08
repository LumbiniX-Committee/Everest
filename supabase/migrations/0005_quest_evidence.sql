-- Quest evidence reaches the server.
--
-- docs/DATA-ARCHITECTURE.md §7 listed quest_submissions as record-class data
-- that does not sync, and called that "a gap, not a decision". This closes it.
--
-- A submission is a photograph, a count or a note brought back from a task at a
-- named place on a dated day. That is the same kind of thing an observation is,
-- and it was staying on the phone — where a reinstall or a dropped handset ends
-- it. Quest progress can be lost without much cost; what someone actually saw
-- cannot be retaken.
--
-- The primary key is (device_id, quest_id, task_id), not the device's own
-- (quest_id, task_id). Locally that pair is unique because there is one person
-- and one phone. On a shared table it is not: two devices working the same
-- quest produce identical keys, and since sync upserts, the second arrival
-- would silently overwrite the first — a quiet deletion in a table whose whole
-- premise is that nothing is deleted. device_id is NOT NULL here for that
-- reason; unlike the observation columns in 0004 it is load-bearing, and a row
-- without it cannot be stored safely.

create table if not exists public.quest_submissions (
  device_id text not null,
  quest_id text not null,
  task_id text not null,
  -- Key into the `quest-evidence` bucket. Null where the task asked for a count
  -- or a note, and where the device had no image picker: a build predating it
  -- still completes the task with a written answer.
  photo_path text,
  count integer,
  note text,
  submitted_at timestamptz not null,
  -- The machine's opinion, stored beside its author. review_model is what makes
  -- the verdict readable later: an unattributed judgement is indistinguishable
  -- from a finding, and this is neither — it is advice the person was free to
  -- ignore, and did or did not.
  review_verdict text,
  review_comment text,
  review_model text,
  reviewed_at timestamptz,
  received_at timestamptz not null default now(),
  primary key (device_id, quest_id, task_id)
);

comment on table public.quest_submissions is
  'What someone brought back from a quest task. Record-class: the photograph is evidence, the tick is not.';

comment on column public.quest_submissions.review_verdict is
  'Advisory AI opinion at submission time — looks-right | looks-wrong | unsure | unavailable. Never a finding, never gated submission. Null = not reviewed.';

comment on column public.quest_submissions.review_model is
  'Which model gave the verdict. Required to read review_verdict as an opinion rather than an assessment.';

create index if not exists idx_quest_submissions_quest
  on public.quest_submissions (quest_id, submitted_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
--
-- Same shape as observations, for the same reason: insert and update, no
-- select. The app only writes. A leaked publishable key can add to the record
-- but cannot read the photographs back out, and that asymmetry is the point.
--
-- Update is granted because sync upserts on the composite key — a retry after a
-- partial failure arrives as insert-on-conflict-update and an insert-only
-- policy would strand it retrying forever. A re-photographed task is also a
-- deliberate correction and must replace its earlier answer.

alter table public.quest_submissions enable row level security;

drop policy if exists quest_submissions_anon_insert on public.quest_submissions;
create policy quest_submissions_anon_insert
  on public.quest_submissions for insert to anon
  with check (true);

drop policy if exists quest_submissions_anon_update on public.quest_submissions;
create policy quest_submissions_anon_update
  on public.quest_submissions for update to anon
  using (true) with check (true);

-- ── Evidence storage ────────────────────────────────────────────────────────
--
-- A separate private bucket rather than a folder inside `observations`. The
-- observations bucket is the conservation archive — a fixed vantage, rephotographed
-- over years, kept indefinitely. Quest photographs are a person's answer to a
-- prompt. They may well deserve a different retention decision later, and
-- separating them now means that decision does not require moving files whose
-- paths are already recorded in rows.

insert into storage.buckets (id, name, public)
values ('quest-evidence', 'quest-evidence', false)
on conflict (id) do nothing;

drop policy if exists quest_evidence_anon_insert on storage.objects;
create policy quest_evidence_anon_insert
  on storage.objects for insert to anon
  with check (bucket_id = 'quest-evidence');

drop policy if exists quest_evidence_anon_update on storage.objects;
create policy quest_evidence_anon_update
  on storage.objects for update to anon
  using (bucket_id = 'quest-evidence')
  with check (bucket_id = 'quest-evidence');
