import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signInMock, verifyOtpMock, signInWithPasswordMock, getUserMock, routerReplaceMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  getUserMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock('@/lib/supabase/config', () => ({ isSupabaseConfigured: () => true }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: signInMock,
      verifyOtp: verifyOtpMock,
      signInWithPassword: signInWithPasswordMock,
      getUser: getUserMock,
    },
  }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplaceMock }) }));

import LoginPage from './page';

beforeEach(() => {
  signInMock.mockReset();
  verifyOtpMock.mockReset();
  signInWithPasswordMock.mockReset();
  routerReplaceMock.mockReset();
  // No session by default, so the form renders as it did before this check
  // existed. The one test for an already-signed-in visitor overrides this.
  getUserMock.mockReset().mockResolvedValue({ data: { user: null } });
  window.history.replaceState({}, '', '/login?next=/adopt');
});

describe('magic-link login', () => {
  it('requests a one-time link with a safe return route', async () => {
    signInMock.mockResolvedValue({ error: null });
    render(<LoginPage />);
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'school@example.org' } });
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
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'person@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    expect(signInMock.mock.calls[0][0].options.emailRedirectTo).toContain('next=%2Fcustodian');
  });

  it('sends an already-signed-in visitor straight to their destination instead of asking again', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } });
    render(<LoginPage />);
    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith('/adopt'));
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
  });

  it('signs in from the typed code, without depending on the link ever being opened', async () => {
    signInMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: null });
    render(<LoginPage />);
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'school@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    await screen.findByLabelText('Code from the email');

    fireEvent.change(screen.getByLabelText('Code from the email'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => expect(verifyOtpMock).toHaveBeenCalledWith({
      email: 'school@example.org',
      token: '123456',
      type: 'email',
    }));
    expect(routerReplaceMock).toHaveBeenCalledWith('/adopt');
  });

  it('shows the reason a wrong or expired code was rejected', async () => {
    signInMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } });
    render(<LoginPage />);
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'school@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    await screen.findByLabelText('Code from the email');

    fireEvent.change(screen.getByLabelText('Code from the email'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => expect(screen.getByText('Token has expired or is invalid')).toBeInTheDocument());
    expect(routerReplaceMock).not.toHaveBeenCalledWith('/adopt');
  });

  it('signs in with a password for an account that has one set, no email involved', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    render(<LoginPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Have a password instead?' }));

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@example.org' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct horse battery staple' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'admin@example.org',
      password: 'correct horse battery staple',
    }));
    expect(routerReplaceMock).toHaveBeenCalledWith('/adopt');
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('shows the reason a password sign-in was rejected, without switching modes', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<LoginPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Have a password instead?' }));

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@example.org' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument());
    expect(routerReplaceMock).not.toHaveBeenCalledWith('/adopt');
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('returns to the link form from the password form', async () => {
    render(<LoginPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Have a password instead?' }));
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use a sign-in link or code instead' }));
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Email me a sign-in link' })).toBeInTheDocument();
  });
});
