import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  access: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({ getAdminAccess: state.access }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ rpc: state.rpc }),
}));

import { GET } from './route';
import { POST as setCustodian } from './custodians/route';
import { POST as issueCodes } from './codes/route';

const post = (body: unknown) => new Request('https://sakshi.example', { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  state.access.mockReset();
  state.rpc.mockReset();
  state.rpc.mockResolvedValue({ data: [], error: null });
});

describe('admin console API', () => {
  it('sends a signed-out visitor to sign in', async () => {
    state.access.mockResolvedValue({ kind: 'signed_out' });
    expect((await GET(new Request('https://sakshi.example/api/admin'))).status).toBe(401);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('refuses a custodian who is not an admin, before any database call', async () => {
    state.access.mockResolvedValue({ kind: 'forbidden' });
    expect((await setCustodian(post({ email: 'a@b.np', site_id: 'site-a' }))).status).toBe(403);
    expect((await issueCodes(post({ count: 1, days: 30, note: 'x' }))).status).toBe(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('clamps an unknown time window to 30 days', async () => {
    state.access.mockResolvedValue({ kind: 'admin', userId: 'owner' });
    await GET(new Request('https://sakshi.example/api/admin?days=9999'));
    expect(state.rpc).toHaveBeenCalledWith('admin_overview', { p_days: 30 });
  });

  it('says when an email has no account instead of creating one', async () => {
    state.access.mockResolvedValue({ kind: 'admin', userId: 'owner' });
    state.rpc.mockResolvedValue({ data: { status: 'no_account' }, error: null });
    const response = await setCustodian(post({ email: 'new@trust.np', site_id: 'site-a' }));
    expect(response.status).toBe(404);
  });

  it('will not issue an unlabelled batch, which could never be found to revoke', async () => {
    state.access.mockResolvedValue({ kind: 'admin', userId: 'owner' });
    expect((await issueCodes(post({ count: 5, days: 30, note: '  ' }))).status).toBe(400);
    expect((await issueCodes(post({ count: 500, days: 30, note: 'too many' }))).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('returns issued codes once, uncached', async () => {
    state.access.mockResolvedValue({ kind: 'admin', userId: 'owner' });
    state.rpc.mockResolvedValue({ data: ['SAKSI-AAAA-BBBB-CCCC'], error: null });
    const response = await issueCodes(post({ count: 1, days: 30, note: 'guides' }));
    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ codes: ['SAKSI-AAAA-BBBB-CCCC'] });
  });
});

import { GET as listReports } from './reports/route';

describe('admin reports API', () => {
  it('drops an unknown status rather than passing it to the database', async () => {
    state.access.mockResolvedValue({ kind: 'admin', userId: 'owner' });
    await listReports(new Request('https://sakshi.example/api/admin/reports?status=deleted&page=2'));
    expect(state.rpc).toHaveBeenCalledWith('admin_list_reports', { p_status: null, p_site_id: null, p_limit: 25, p_offset: 50 });
  });
});
