/**
 * What happened to a report, as the person who filed it should see it.
 *
 * The server keeps an append-only trail of custodian actions; the current state
 * is the newest action, so a correction is a later action, not an edit. This
 * turns that trail into the steps a reporter reads. It never moves a report
 * forward on its own: with no action, a report has been received and nothing
 * more, which is the truth, and a status that drifted to "in progress" by
 * itself would be a faked measurement.
 */
export type CustodianStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';
export type ReportAction = { status: CustodianStatus; note: string | null; at: string };

export type TimelineStep = {
  key: 'waiting' | 'received' | 'acknowledged' | 'in_progress' | 'resolved';
  /** Reached at some point. */
  done: boolean;
  /** The step the report is at now. */
  current: boolean;
  at: string | null;
  note: string | null;
};

const ORDER: TimelineStep['key'][] = ['received', 'acknowledged', 'in_progress', 'resolved'];

export function reportTimeline(input: { recordedAt: string; synced: boolean; actions: readonly ReportAction[] }): TimelineStep[] {
  if (!input.synced) {
    return [{ key: 'waiting', done: false, current: true, at: input.recordedAt, note: null }];
  }
  const actions = [...input.actions].sort((a, b) => a.at.localeCompare(b.at));
  const latest = actions[actions.length - 1];
  // A custodian may reopen a report; 'open' then means back to received.
  const currentKey: TimelineStep['key'] = !latest || latest.status === 'open' ? 'received' : latest.status;
  const currentIndex = ORDER.indexOf(currentKey);
  return ORDER.map((key, index) => {
    const lastOfKind = key === 'received' ? null : [...actions].reverse().find((action) => action.status === key) ?? null;
    return {
      key,
      done: index <= currentIndex,
      current: index === currentIndex,
      at: key === 'received' ? input.recordedAt : index <= currentIndex ? (lastOfKind?.at ?? null) : null,
      note: index <= currentIndex ? (lastOfKind?.note ?? null) : null,
    };
  });
}
