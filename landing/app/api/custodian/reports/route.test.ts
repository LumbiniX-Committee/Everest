import { beforeEach, describe, expect, it, vi } from 'vitest';

const { accessMock, listReportsMock } = vi.hoisted(() => ({
  accessMock: vi.fn(),
  listReportsMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getCustodianAccess: accessMock }));
vi.mock('@/lib/custodian-data', () => ({ listReports: listReportsMock }));

import { GET } from './route';

beforeEach(() => {
  accessMock.mockReset();
  listReportsMock.mockReset();
});

describe('GET /api/custodian/reports', () => {
  it('rejects an unauthenticated request', async () => {
    accessMock.mockResolvedValue(null);
    const response = await GET(new Request('https://sakshi.example/api/custodian/reports'));
    expect(response.status).toBe(401);
    expect(listReportsMock).not.toHaveBeenCalled();
  });

  it('hides sites outside the authenticated membership', async () => {
    accessMock.mockResolvedValue({ userId: 'u1', email: null, siteIds: ['manga-hiti'] });
    const response = await GET(new Request(
      'https://sakshi.example/api/custodian/reports?site_id=changu-narayan',
    ));
    expect(response.status).toBe(403);
    expect(listReportsMock).not.toHaveBeenCalled();
  });

  it('validates statuses before querying', async () => {
    accessMock.mockResolvedValue({ userId: 'u1', email: null, siteIds: ['manga-hiti'] });
    const response = await GET(new Request('https://sakshi.example/api/custodian/reports?status=deleted'));
    expect(response.status).toBe(400);
    expect(listReportsMock).not.toHaveBeenCalled();
  });

  it('passes the complete site scope, filters and cursor to the data layer', async () => {
    accessMock.mockResolvedValue({
      userId: 'u1', email: 'custodian@example.org', siteIds: ['manga-hiti', 'patan-durbar-square'],
    });
    listReportsMock.mockResolvedValue({ items: [], nextCursor: null });
    const response = await GET(new Request(
      'https://sakshi.example/api/custodian/reports?site_id=manga-hiti&status=open&cursor=abc&limit=20',
    ));
    expect(response.status).toBe(200);
    expect(listReportsMock).toHaveBeenCalledWith({
      siteId: 'manga-hiti',
      allowedSiteIds: ['manga-hiti', 'patan-durbar-square'],
      status: 'open',
      cursor: 'abc',
      limit: 20,
    });
  });
});
