import { resolveAnonymousSession } from '@/services/supabase/session';
import { hasSupabaseConfiguration } from '@/services/supabase/configuration';

describe('Supabase configuration and anonymous authentication', () => {
  it('rejects missing and placeholder project configuration', () => {
    expect(hasSupabaseConfiguration(undefined, undefined)).toBe(false);
    expect(
      hasSupabaseConfiguration(
        'https://your-project.supabase.co',
        'your-publishable-key',
      ),
    ).toBe(false);
    expect(
      hasSupabaseConfiguration('https://pilot.supabase.co', 'publishable-live-key'),
    ).toBe(true);
  });

  it('restores an existing session without creating another account', async () => {
    const session = { user: { id: 'visitor-a' } };
    const signInAnonymously = jest.fn();
    const auth = {
      getSession: jest.fn().mockResolvedValue({ data: { session } }),
      signInAnonymously,
    };

    const result = await resolveAnonymousSession(auth as never);

    expect(result).toEqual({ session, error: null });
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('returns an explicit safe failure when anonymous sign-in is disabled', async () => {
    const error = new Error('Anonymous sign-ins disabled');
    const auth = {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInAnonymously: jest.fn().mockResolvedValue({
        data: { session: null },
        error,
      }),
    };

    await expect(resolveAnonymousSession(auth as never)).resolves.toEqual({
      session: null,
      error,
    });
  });
});
