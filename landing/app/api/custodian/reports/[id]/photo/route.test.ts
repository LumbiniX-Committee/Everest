import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  access: vi.fn(),
  observation: vi.fn(),
  signedUrl: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getCustodianAccess: state.access }));
vi.mock('@/lib/custodian-data', () => ({ observationForReport: state.observation }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    storage: { from: () => ({ createSignedUrl: state.signedUrl }) },
  }),
}));

import { GET } from './route';

const context = { params: Promise.resolve({ id: 'report-a' }) };

beforeEach(() => {
  state.access.mockReset();
  state.observation.mockReset();
  state.signedUrl.mockReset();
});

describe('GET report photo', () => {
  it('requires authentication', async () => {
    state.access.mockResolvedValue(null);
    expect((await GET(new Request('https://sakshi.example'), context)).status).toBe(401);
  });

  it('returns not found outside the custodian site scope', async () => {
    state.access.mockResolvedValue({ siteIds: ['site-b'] });
    state.observation.mockResolvedValue({ site_id: 'site-a', photo_path: 'site-a/photo.webp' });
    const response = await GET(new Request('https://sakshi.example'), context);
    expect(response.status).toBe(404);
    expect(state.signedUrl).not.toHaveBeenCalled();
  });

  it('issues a five-minute URL only after membership verification', async () => {
    state.access.mockResolvedValue({ siteIds: ['site-a'] });
    state.observation.mockResolvedValue({ site_id: 'site-a', photo_path: 'site-a/photo.webp' });
    state.signedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.example/photo' }, error: null });
    const response = await GET(new Request('https://sakshi.example'), context);
    expect(response.status).toBe(200);
    expect(state.signedUrl).toHaveBeenCalledWith('site-a/photo.webp', 300);
    expect(await response.json()).toEqual({ url: 'https://signed.example/photo', expires_in: 300 });
  });
});
