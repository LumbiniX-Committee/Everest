import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  access: vi.fn(),
  vantage: { data: { id: 'vantage-a', site_id: 'site-a' }, error: null } as unknown,
  insert: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getCustodianAccess: state.access }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => table === 'monitored_vantages'
      ? { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => state.vantage }) }) }) }
      : {
          insert: (value: unknown) => {
            state.insert(value);
            return { select: () => ({ single: async () => ({ data: { id: 'priority-a' }, error: null }) }) };
          },
        },
  }),
}));

import { POST } from './route';

const context = { params: Promise.resolve({ id: 'vantage-a' }) };

beforeEach(() => {
  state.access.mockReset();
  state.insert.mockReset();
  state.vantage = { data: { id: 'vantage-a', site_id: 'site-a' }, error: null };
});

describe('POST vantage priority', () => {
  it('requires a custodian session', async () => {
    state.access.mockResolvedValue(null);
    const response = await POST(new Request('https://sakshi.example', {
      method: 'POST', body: JSON.stringify({ urgent: true }),
    }), context);
    expect(response.status).toBe(401);
  });

  it('hides a vantage outside the assigned sites', async () => {
    state.access.mockResolvedValue({ siteIds: ['site-b'] });
    const response = await POST(new Request('https://sakshi.example', {
      method: 'POST', body: JSON.stringify({ urgent: true }),
    }), context);
    expect(response.status).toBe(404);
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('appends urgency without a client-supplied actor', async () => {
    state.access.mockResolvedValue({ userId: 'custodian-a', siteIds: ['site-a'] });
    const response = await POST(new Request('https://sakshi.example', {
      method: 'POST', body: JSON.stringify({ urgent: true, actor_user_id: 'forged' }),
    }), context);
    expect(response.status).toBe(201);
    expect(state.insert).toHaveBeenCalledWith({ vantage_id: 'vantage-a', urgent: true, note: null });
  });
});
