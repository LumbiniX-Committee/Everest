import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: null as { email: string } | null,
  signIn: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getAuthenticatedUser: async () => state.user }));
vi.mock('@/lib/supabase/config', () => ({ requireSupabaseConfig: () => ({ url: 'https://x.supabase.co', key: 'k' }) }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signInWithPassword: state.signIn, signOut: async () => ({}) } }),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { updateUser: state.update } }) }));

import { POST } from './route';

const post = (body: unknown) => new Request('https://sakshi.example', { method: 'POST', body: JSON.stringify(body) });
const STRONG = 'river-stone-2026-lotus';

beforeEach(() => {
  state.user = { email: 'owner@saksi.np' };
  state.signIn.mockReset().mockResolvedValue({ error: null });
  state.update.mockReset().mockResolvedValue({ error: null });
});

describe('change password', () => {
  it('needs a signed-in account', async () => {
    state.user = null;
    expect((await POST(post({ current: 'x', next: STRONG }))).status).toBe(401);
  });

  it('refuses a weak new password before checking anything else', async () => {
    expect((await POST(post({ current: 'old-pass-1', next: 'short1' }))).status).toBe(400);
    expect((await POST(post({ current: 'old-pass-1', next: 'onlyletterslong' }))).status).toBe(400);
    expect(state.signIn).not.toHaveBeenCalled();
  });

  it('refuses when the current password is wrong, and changes nothing', async () => {
    state.signIn.mockResolvedValue({ error: { status: 400, message: 'Invalid login credentials' } });
    const response = await POST(post({ current: 'wrong-pass-1', next: STRONG }));
    expect(response.status).toBe(403);
    expect(state.update).not.toHaveBeenCalled();
  });

  it('says so when sign-in attempts are rate limited', async () => {
    state.signIn.mockResolvedValue({ error: { status: 429, message: 'Too many' } });
    expect((await POST(post({ current: 'old-pass-1', next: STRONG }))).status).toBe(429);
  });

  it('checks the current password against the signed-in email, then sets the new one', async () => {
    const response = await POST(post({ current: 'old-pass-1', next: STRONG }));
    expect(response.status).toBe(200);
    expect(state.signIn).toHaveBeenCalledWith({ email: 'owner@saksi.np', password: 'old-pass-1' });
    expect(state.update).toHaveBeenCalledWith({ password: STRONG });
  });
});
