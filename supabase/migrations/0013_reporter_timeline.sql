-- What happened to my report: the reporter's view of the custodian audit trail.
--
-- People whose first report is acted on are far more likely to report again,
-- so the person who filed a report should see each step taken on it. The
-- action table itself stays custodian-only: this function returns only the
-- reporter's own reports, and only the step, its note and its time, never who
-- acted. Nothing here writes, and no status is inferred: a report with no
-- action has simply been received.
create or replace function public.my_report_timeline()
returns table (report_id text, target_status text, note text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.report_id, a.target_status, a.note, a.created_at
  from public.condition_report_actions a
  join public.condition_reports r on r.id = a.report_id
  where r.user_id = auth.uid()
  order by a.report_id, a.created_at, a.id;
$$;

revoke all on function public.my_report_timeline() from public, anon;
grant execute on function public.my_report_timeline() to authenticated;

comment on function public.my_report_timeline() is
  'The calling user''s own reports and the custodian steps taken on them, without actor identities.';
