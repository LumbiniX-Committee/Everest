'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('The portal has not been connected to Supabase yet.');
      return;
    }
    const supabase = createClient();
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/custodian';
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
