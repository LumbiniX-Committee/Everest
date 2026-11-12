/**
 * Every report this visitor has filed, at the step it has really reached.
 *
 * The visitor dashboard lists reports in one place instead of only inside each
 * observation. The step comes from `reportTimeline`, so the same rule holds
 * here: a report moves only when a custodian acts, never by itself.
 */
import { reportTimeline, type ReportAction, type TimelineStep } from './timeline.ts';

export type BoardReport = {
  id: string;
  observationId: string;
  siteId: string;
  category: string;
  severity: string;
  recordedAt: string;
  synced: boolean;
};

export type BoardItem = BoardReport & {
  step: TimelineStep['key'];
  /** When the current step was reached, or when the report was filed if no one has acted. */
  stepAt: string;
  /** The custodian's note on the current step, if they left one. */
  note: string | null;
};

export type ReportBoard = {
  items: BoardItem[];
  counts: Record<TimelineStep['key'], number>;
  /** Filed and not yet resolved. */
  open: number;
};

export function reportBoard(reports: readonly BoardReport[], byReport: Record<string, readonly ReportAction[]>): ReportBoard {
  const counts: ReportBoard['counts'] = { waiting: 0, received: 0, acknowledged: 0, in_progress: 0, resolved: 0 };
  const items = reports.map((report): BoardItem => {
    const steps = reportTimeline({ recordedAt: report.recordedAt, synced: report.synced, actions: byReport[report.id] ?? [] });
    const current = steps.find((step) => step.current) ?? steps[0];
    counts[current.key] += 1;
    return { ...report, step: current.key, stepAt: current.at ?? report.recordedAt, note: current.note };
  });
  // Newest activity first, so a report the site just acted on rises to the top.
  items.sort((a, b) => b.stepAt.localeCompare(a.stepAt));
  return { items, counts, open: items.length - counts.resolved };
}
