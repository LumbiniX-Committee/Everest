import { describe, expect, it } from 'vitest';

import { safeDays, safeIsoDate } from '@/lib/http';

describe('request parameter guards', () => {
  it('accepts only supported reporting windows', () => {
    expect(safeDays('30')).toBe(30);
    expect(safeDays('365')).toBe(365);
    expect(safeDays('31')).toBe(90);
    expect(safeDays(null)).toBe(90);
  });

  it('does not pass invalid dates into database filters', () => {
    const fallback = new Date('2026-09-10T00:00:00.000Z');
    expect(safeIsoDate('not-a-date', fallback)).toBe(fallback.toISOString());
    expect(safeIsoDate('2026-09-01T12:30:00Z', fallback)).toBe('2026-09-01T12:30:00.000Z');
  });
});
