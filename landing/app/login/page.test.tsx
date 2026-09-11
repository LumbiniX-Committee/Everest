import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }));

vi.mock('@/lib/supabase/config', () => ({ isSupabaseConfigured: () => true }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOtp: signInMock } }),
}));

import LoginPage from './page';

beforeEach(() => {
  signInMock.mockReset();
  window.history.replaceState({}, '', '/login?next=/adopt');
});

describe('magic-link login', () => {
  it('requests a one-time link with a safe return route', async () => {
    signInMock.mockResolvedValue({ error: null });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'school@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    await waitFor(() => expect(signInMock).toHaveBeenCalledWith({
      email: 'school@example.org',
      options: { emailRedirectTo: expect.stringContaining('/auth/callback?next=%2Fadopt') },
    }));
    expect(screen.getByText(/Check your email/)).toBeInTheDocument();
  });

  it('does not permit an external redirect target', async () => {
    signInMock.mockResolvedValue({ error: null });
    window.history.replaceState({}, '', '/login?next=//malicious.example');
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'person@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    expect(signInMock.mock.calls[0][0].options.emailRedirectTo).toContain('next=%2Fcustodian');
  });
});
