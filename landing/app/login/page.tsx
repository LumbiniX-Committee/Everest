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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // This form used to render unconditionally, even for a browser that already
  // holds a valid session — landing back on /login (from a bookmark, or the
  // public "for custodians" page after already signing in once) asked for a
  // fresh email every time instead of noticing the person was already in.
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

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('The portal has not been connected to Supabase yet.');
      return;
    }
    const supabase = createClient();
    const next = safeNext(new URLSearchParams(window.location.search).get('next'));
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback },
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
  }

  if (checkingSession) return null;

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <p className="text-sm font-semibold tracking-wide text-sakshi uppercase">Sākṣī secure access</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
        Sign in by email
      </h1>
      <p className="mt-4 text-ink-soft">
        Custodian permissions are assigned by site. A sign-in link does not grant access by itself.
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl border border-tirtha/30 bg-tirtha/5 p-5 text-ink">
          Check your email for a one-time sign-in link.
        </div>
      ) : (
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
          <button
            type="submit"
            className="w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white"
          >
            Email me a sign-in link
          </button>
          {error ? <p className="text-sm text-earth">{error}</p> : null}
        </form>
      )}
    </main>
  );
}
