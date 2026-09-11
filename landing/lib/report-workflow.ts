import type { ReportStatus } from '@/lib/custodianApi';

const NEXT_STATUS: Record<ReportStatus, readonly ReportStatus[]> = {
  open: ['acknowledged'],
  acknowledged: ['in_progress', 'resolved'],
  in_progress: ['resolved'],
  resolved: ['open'],
};

export function allowedReportTargets(status: ReportStatus): readonly ReportStatus[] {
  return NEXT_STATUS[status];
}

export function isLegalReportTransition(from: ReportStatus, to: ReportStatus, note = ''): boolean {
  return NEXT_STATUS[from].includes(to) && (from !== 'resolved' || note.trim().length > 0);
}
