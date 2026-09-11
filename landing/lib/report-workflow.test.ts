import { describe, expect, it } from 'vitest';

import { allowedReportTargets, isLegalReportTransition } from '@/lib/report-workflow';

describe('append-only report workflow', () => {
  it('requires acknowledgement before work or resolution', () => {
    expect(allowedReportTargets('open')).toEqual(['acknowledged']);
    expect(isLegalReportTransition('open', 'resolved')).toBe(false);
  });

  it('permits the normal audited progression', () => {
    expect(isLegalReportTransition('open', 'acknowledged')).toBe(true);
    expect(isLegalReportTransition('acknowledged', 'in_progress')).toBe(true);
    expect(isLegalReportTransition('acknowledged', 'resolved')).toBe(true);
    expect(isLegalReportTransition('in_progress', 'resolved')).toBe(true);
  });

  it('requires an explanation to reopen a resolved report', () => {
    expect(isLegalReportTransition('resolved', 'open')).toBe(false);
    expect(isLegalReportTransition('resolved', 'open', 'New damage observed')).toBe(true);
  });
});
