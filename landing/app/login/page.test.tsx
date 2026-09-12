import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signInWithPasswordMock, getUserMock, routerReplaceMock } = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  getUserMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock('@/lib/supabase/config', () => ({ isSupabaseConfigured: () => true }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInWithPasswordMock, getUser: getUserMock },
  }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplaceMock }) }));

import LoginPage from './page';

beforeEach(() => {
  signInWithPasswordMock.mockReset();
  routerReplaceMock.mockReset();
  // No session by default, so the form renders as it did before this check
  // existed. The one test for an already-signed-in visitor overrides this.
  getUserMock.mockReset().mockResolvedValue({ data: { user: null } });
  window.history.replaceState({}, '', '/login?next=/adopt');
});

describe('password login', () => {
  it('signs in with email and password', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    render(<LoginPage />);
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'sayhi.aaditya@gmail.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'saksi12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'sayhi.aaditya@gmail.com',
      password: 'saksi12345',
    }));
    expect(routerReplaceMock).toHaveBeenCalledWith('/adopt');
  });

  it('shows the reason a wrong password was rejected', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<LoginPage />);
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'sayhi.aaditya@gmail.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument());
    expect(routerReplaceMock).not.toHaveBeenCalledWith('/adopt');
  });

  it('sends an already-signed-in visitor straight to their destination instead of asking again', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } });
    render(<LoginPage />);
    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith('/adopt'));
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
  });
});
