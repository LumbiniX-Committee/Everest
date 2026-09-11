import { afterEach, describe, expect, it, vi } from 'vitest';

import { CustodianApiError, exportUrl, getDashboard, getReports, recordReportAction } from '@/lib/custodianApi';

afterEach(() => vi.restoreAllMocks());

describe('custodian API client', () => {
  it('sends filters using same-origin endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], nextCursor: null }),
    } as Response);
    await getReports({ siteId: 'patan-durbar-square', status: 'open', cursor: 'next' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/custodian/reports?site_id=patan-durbar-square&status=open&cursor=next',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(exportUrl('geojson', { siteId: 'manga-hiti' })).toBe(
      '/api/custodian/export?format=geojson&site_id=manga-hiti',
    );
  });

  it('uses the authenticated session as actor and never sends a custodian id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    await recordReportAction({ reportId: 'report/one', status: 'acknowledged', note: 'Reviewed' });
    const [, request] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe('/api/custodian/reports/report%2Fone/actions');
    expect(JSON.parse(String(request?.body))).toEqual({ status: 'acknowledged', note: 'Reviewed' });
  });

  it('surfaces authentication failures with their HTTP status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Authentication required.' }),
    } as Response);
    const failure = getDashboard({ days: 90 });
    await expect(failure).rejects.toBeInstanceOf(CustodianApiError);
    await expect(failure).rejects.toMatchObject({ status: 401, message: 'Authentication required.' });
  });
});
