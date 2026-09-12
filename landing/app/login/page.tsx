'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

function safeNext(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/custodian';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Landing back on /login (from a bookmark, or the public "for custodians"
  // page) with an already-valid session used to show the form again anyway.
  // Checked once, client-side, before the form paints.
  const [checkingSession, setCheckingSession] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then((result: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
        if (!active) return;
        if (result.data.user) {
          router.replace(safeNext(new URLSearchParams(window.location.search).get('next')));
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  /**
   * A password only works for an account that has had one set on it,
   * server-side (see tools/set-custodian-password.mjs) — nothing about who
   * that is lives in this file.
   */
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('The portal has not been connected to Supabase yet.');
      return;
    }
    setSigningIn(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSigningIn(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace(safeNext(new URLSearchParams(window.location.search).get('next')));
  }

  if (checkingSession) return null;

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <p className="text-sm font-semibold tracking-wide text-sakshi uppercase">Sākṣī secure access</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
        Sign in
      </h1>
      <p className="mt-4 text-ink-soft">
        Custodian permissions are assigned by site. Signing in does not grant access by itself.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Email address</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={signingIn}
          className="w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {signingIn ? 'Signing in…' : 'Sign in'}
        </button>
        {error ? <p className="text-sm text-earth">{error}</p> : null}
      </form>
    </main>
  );
}
