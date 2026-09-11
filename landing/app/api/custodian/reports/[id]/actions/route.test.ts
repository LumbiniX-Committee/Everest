import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  access: vi.fn(),
  report: { data: { id: 'report-a', site_id: 'site-a' }, error: null } as unknown,
  action: { data: { id: 'action-a' }, error: null } as unknown,
  insert: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getCustodianAccess: state.access }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === 'condition_reports') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => state.report }) }) };
      }
      return {
        insert: (value: unknown) => {
          state.insert(value);
          return { select: () => ({ single: async () => state.action }) };
        },
      };
    },
  }),
}));

import { POST } from './route';

const context = { params: Promise.resolve({ id: 'report-a' }) };

beforeEach(() => {
  state.access.mockReset();
  state.insert.mockReset();
  state.report = { data: { id: 'report-a', site_id: 'site-a' }, error: null };
  state.action = { data: { id: 'action-a' }, error: null };
});

describe('POST report action', () => {
  it('requires authentication', async () => {
    state.access.mockResolvedValue(null);
    const response = await POST(new Request('https://sakshi.example', {
      method: 'POST', body: JSON.stringify({ status: 'acknowledged' }),
    }), context);
    expect(response.status).toBe(401);
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('does not reveal or mutate a cross-site report', async () => {
    state.access.mockResolvedValue({ userId: 'custodian', siteIds: ['site-b'] });
    const response = await POST(new Request('https://sakshi.example', {
      method: 'POST', body: JSON.stringify({ status: 'acknowledged' }),
    }), context);
    expect(response.status).toBe(404);
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('records only the report, target and note; actor comes from the session', async () => {
    state.access.mockResolvedValue({ userId: 'custodian', siteIds: ['site-a'] });
    const response = await POST(new Request('https://sakshi.example', {
      method: 'POST',
      body: JSON.stringify({ status: 'acknowledged', note: ' inspected ', custodianId: 'forged' }),
    }), context);
    expect(response.status).toBe(201);
    expect(state.insert).toHaveBeenCalledWith({
      report_id: 'report-a', target_status: 'acknowledged', note: 'inspected',
    });
  });
});
