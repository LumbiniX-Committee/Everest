import type { Session } from '@supabase/supabase-js';

import { getSupabase, isConfigured } from './index';

/**
 * The session a sync pass writes under.
 *
 * Until now every row arrived from the `anon` role, which meant RLS could only
 * ask *what* was writing, never *who* — so `anon` held update on every row and
 * a leaked publishable key could overwrite anyone's observation. device_id did
 * not close that: it is a value the client sends, and a policy resting on it
 * would be theatre.
 *
 * A session changes the kind of claim being made. `auth.uid()` is read from a
 * signed token the client cannot forge, so `user_id = auth.uid()` is something
 * the database can actually check. See migration 0006.
 *
 * Anonymous, deliberately. Someone standing at the Maya Devi temple with a
 * photograph to record should not first meet a sign-up form; the account exists
 * to own rows, not to identify a person. What that does **not** buy is worth
 * being plain about: an anonymous session lives in this app's storage, so a
 * reinstall is a new account and the old records stay behind under an id nobody
 * holds any more. Surviving a reinstall needs a real credential — Supabase
 * supports upgrading an anonymous user in place by adding an email, and that is
 * the path, not a second account system.
 */

let pending: Promise<Session | null> | null = null;

/** Logged once rather than on every sync pass, which runs often and quietly. */
let reportedUnavailable = false;

/**
 * Returns the current session, signing in anonymously if there is none.
 *
 * Returns null rather than throwing when a session cannot be had — most often
 * because anonymous sign-ins are switched off for the project, which is a
 * dashboard setting and not something the app can fix at runtime.
 *
 * Null is a working state, not a failure: migration 0006 deliberately left the
 * `anon` write policies in place, so an unauthenticated device still syncs.
 * That is what makes the rollout safe in either order — a client that updates
 * before the setting is enabled keeps working, and so does one that never
 * updates at all. Migration 0007 removes that fallback, and must not be applied
 * until both have happened.
 */
export async function ensureSession(): Promise<Session | null> {
  if (!isConfigured()) return null;

  if (!pending) {
    pending = (async () => {
      const supabase = getSupabase();

      // Restored from AsyncStorage on a warm start, and refreshed by the client
      // itself when it has expired.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) return existing.session;

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        if (!reportedUnavailable) {
          reportedUnavailable = true;
          console.warn(
            'Anonymous sign-in unavailable; syncing without an author. ' +
              'Enable it under Authentication → Sign In / Providers. ' +
              `(${error.message})`,
          );
        }
        return null;
      }

      return data.session;
    })().catch((error) => {
      // Do not cache a rejected promise: a pass that failed on a dead network
      // must be free to succeed on the next one.
      pending = null;
      throw error;
    });
  }

  return pending;
}

/**
 * The signed-in user's id, or null.
 *
 * Read from the session rather than sent anywhere — `user_id` is filled by a
 * column default from the token, so nothing in the app needs to state its own
 * authorship, and nothing in the app is trusted to.
 */
export async function getUserId(): Promise<string | null> {
  const session = await ensureSession();
  return session?.user.id ?? null;
}

/**
 * Drops the cached promise so the next call re-reads the session.
 *
 * For sign-out and for tests. Does not itself end the session.
 */
export function resetSessionCache(): void {
  pending = null;
  reportedUnavailable = false;
}
